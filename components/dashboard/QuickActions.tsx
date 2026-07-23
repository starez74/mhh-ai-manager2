type QuickActionsProps = {
  onOpenEnquiries: () => void;
  onOpenQuotes: () => void;
  onOpenJobs: () => void;
};

export default function QuickActions({
  onOpenEnquiries,
  onOpenQuotes,
  onOpenJobs,
}: QuickActionsProps) {
  return (
    <div className="card">
      <h3>Quick Actions</h3>
      <div className="actions">
        <button className="btn" onClick={onOpenEnquiries}>Review enquiries</button>
        <button className="btn secondary" onClick={onOpenQuotes}>Open quotes</button>
        <button className="btn secondary" onClick={onOpenJobs}>View jobs</button>
      </div>
    </div>
  );
}
