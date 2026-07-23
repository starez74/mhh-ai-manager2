import "server-only";

import { ApiRouteError } from "@/lib/api/errors";
import { getMetaConfig } from "@/lib/config";
import { createServerSupabase } from "@/lib/supabase/server";

type MetaErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

function metaError(data: MetaErrorPayload, fallback: string): string {
  const error = data.error;
  if (!error) return fallback;

  return [
    error.message,
    error.type ? `Type: ${error.type}` : "",
    error.code != null ? `Code: ${error.code}` : "",
    error.error_subcode != null ? `Subcode: ${error.error_subcode}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function getMetaConnectionStatus() {
  const config = getMetaConfig();
  const syncedAt = new Date().toISOString();

  if (!config.pageId || !config.pageAccessToken) {
    return {
      connected: false,
      publishingEnabled: config.publishingEnabled,
      syncedAt,
      pageIdConfigured: Boolean(config.pageId),
      tokenConfigured: Boolean(config.pageAccessToken),
      graphVersion: config.graphApiVersion,
      message: "META_PAGE_ID or META_PAGE_ACCESS_TOKEN is missing from Vercel.",
    };
  }

  const pageUrl =
    `https://graph.facebook.com/${config.graphApiVersion}/${encodeURIComponent(config.pageId)}` +
    `?fields=${encodeURIComponent("id,name,link")}` +
    `&access_token=${encodeURIComponent(config.pageAccessToken)}`;

  const pageResponse = await fetch(pageUrl, { cache: "no-store" });
  const pageData = (await pageResponse.json()) as MetaErrorPayload & {
    name?: string;
    link?: string;
  };

  if (!pageResponse.ok) {
    return {
      connected: false,
      publishingEnabled: config.publishingEnabled,
      syncedAt,
      pageIdConfigured: true,
      tokenConfigured: true,
      graphVersion: config.graphApiVersion,
      pageId: config.pageId,
      stage: "page_identity",
      message: metaError(pageData, "Meta could not verify the configured Facebook Page."),
    };
  }

  const fields = "id,message,created_time,permalink_url";
  const postsUrl =
    `https://graph.facebook.com/${config.graphApiVersion}/${encodeURIComponent(config.pageId)}/posts` +
    `?fields=${encodeURIComponent(fields)}` +
    "&limit=15" +
    `&access_token=${encodeURIComponent(config.pageAccessToken)}`;

  const postsResponse = await fetch(postsUrl, { cache: "no-store" });
  const postsData = (await postsResponse.json()) as MetaErrorPayload & {
    data?: unknown[];
  };

  if (!postsResponse.ok) {
    return {
      connected: false,
      pageIdentityConnected: true,
      postsReadable: false,
      publishingEnabled: config.publishingEnabled,
      syncedAt,
      pageIdConfigured: true,
      tokenConfigured: true,
      graphVersion: config.graphApiVersion,
      pageId: config.pageId,
      pageName: pageData.name || "",
      pageLink: pageData.link || "",
      stage: "read_posts",
      message: metaError(postsData, "The Page was verified, but recent posts could not be read."),
    };
  }

  const posts = Array.isArray(postsData.data) ? postsData.data : [];
  return {
    connected: true,
    pageIdentityConnected: true,
    postsReadable: true,
    publishingEnabled: config.publishingEnabled,
    syncedAt,
    pageIdConfigured: true,
    tokenConfigured: true,
    graphVersion: config.graphApiVersion,
    pageId: config.pageId,
    pageName: pageData.name || "",
    pageLink: pageData.link || "",
    postCount: posts.length,
    posts,
    message: "Facebook Page identity and recent-post access were verified successfully.",
  };
}

export async function publishCampaign(
  campaignId: string,
  userId: string,
  accessToken: string
) {
  const config = getMetaConfig();

  if (!config.publishingEnabled) {
    throw new ApiRouteError("Facebook publishing is disabled in Vercel.", 403);
  }
  if (!config.pageId || !config.pageAccessToken) {
    throw new ApiRouteError("Meta Page connection is not configured.", 500);
  }

  const supabase = createServerSupabase(accessToken);
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id,status,facebook_post,content")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();

  if (error || !campaign) {
    throw new ApiRouteError("Campaign not found.", 404);
  }
  if (campaign.status !== "approved") {
    throw new ApiRouteError("Only approved campaigns can be published.", 403);
  }

  const message = campaign.facebook_post || campaign.content;
  if (!message?.trim()) {
    throw new ApiRouteError("Campaign has no Facebook caption.", 400);
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${encodeURIComponent(config.pageId)}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, access_token: config.pageAccessToken }),
    }
  );
  const data = (await response.json()) as {
    id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.id) {
    throw new ApiRouteError(
      data.error?.message || "Facebook publishing failed.",
      response.status
    );
  }

  const { error: updateError } = await supabase
    .from("campaigns")
    .update({
      status: "published",
      meta_post_id: data.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", campaign.id)
    .eq("user_id", userId);

  if (updateError) {
    throw new ApiRouteError(updateError.message, 500);
  }

  return {
    success: true,
    postId: data.id,
    message: "Approved caption published to Facebook.",
  };
}
