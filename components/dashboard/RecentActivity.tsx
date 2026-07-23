import type { Activity } from "@/lib/types/activity";

export default function RecentActivity({ items }: { items: Activity[] }) {
  return (
    <div className="card">
      <h3>Recent Activity</h3>
      {items.length === 0 ? (
        <p className="muted">No activity recorded yet.</p>
      ) : (
        items.slice(0, 8).map(item => (
          <div className="campaign" key={item.id}>
            <strong>{item.title}</strong>
            <div className="muted">{new Date(item.created_at).toLocaleString("en-AU")}</div>
            {item.details ? <p>{item.details}</p> : null}
          </div>
        ))
      )}
    </div>
  );
}
