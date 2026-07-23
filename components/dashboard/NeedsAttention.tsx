import type { Enquiry } from "@/lib/types/enquiry";
import type { Quote } from "@/lib/types/quote";

export default function NeedsAttention({
  enquiries,
  quotes,
}: {
  enquiries: Enquiry[];
  quotes: Quote[];
}) {
  const followUps = enquiries.filter(
    item => item.follow_up_at && !item.archived_at && !["closed", "declined", "booked"].includes(item.status)
  );
  const openQuotes = quotes.filter(
    item => !item.archived_at && ["draft", "approved", "sent"].includes(item.status)
  );

  return (
    <div className="card">
      <h3>Needs Attention</h3>
      <p><strong>{followUps.length}</strong> enquiries have follow-ups scheduled.</p>
      <p><strong>{openQuotes.length}</strong> quotes remain open.</p>
    </div>
  );
}
