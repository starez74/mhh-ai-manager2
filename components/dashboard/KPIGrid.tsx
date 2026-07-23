type KPIGridProps = {
  newLeads: number;
  openQuotes: number;
  upcomingJobs: number;
  followUps: number;
};

function KPICard({ title, value, colour }: { title: string; value: number; colour: string }) {
  return (
    <div className="card" style={{ borderLeft: `6px solid ${colour}` }}>
      <div className="muted">{title}</div>
      <div style={{ fontSize: 40, fontWeight: 700, marginTop: 12 }}>{value}</div>
    </div>
  );
}

export default function KPIGrid(props: KPIGridProps) {
  return (
    <div className="grid four">
      <KPICard title="New Enquiries" value={props.newLeads} colour="#2b7fff" />
      <KPICard title="Open Quotes" value={props.openQuotes} colour="#16a34a" />
      <KPICard title="Upcoming Jobs" value={props.upcomingJobs} colour="#f59e0b" />
      <KPICard title="Follow Ups Due" value={props.followUps} colour="#ef4444" />
    </div>
  );
}
