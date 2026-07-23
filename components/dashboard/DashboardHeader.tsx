type DashboardHeaderProps = {
  message?: string;
};

export default function DashboardHeader({ message }: DashboardHeaderProps) {
  return (
    <div className="sectionHead">
      <div>
        <h2>Dashboard</h2>
        <p className="muted">Current enquiries, quotes, jobs and follow-ups.</p>
      </div>
      {message ? <span className="badge">{message}</span> : null}
    </div>
  );
}
