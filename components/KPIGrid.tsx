"use client";

type KPIGridProps = {
  newLeads: number;
  openQuotes: number;
  upcomingJobs: number;
  followUps: number;
};

function Card({
  title,
  value,
  colour,
}: {
  title: string;
  value: number;
  colour: string;
}) {
  return (
    <div
      className="card"
      style={{
        borderLeft: `6px solid ${colour}`,
      }}
    >
      <div className="muted">{title}</div>

      <div
        style={{
          fontSize: 40,
          fontWeight: 700,
          marginTop: 12,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function KPIGrid({
  newLeads,
  openQuotes,
  upcomingJobs,
  followUps,
}: KPIGridProps) {
  return (
    <div className="grid four">
      <Card
        title="New Enquiries"
        value={newLeads}
        colour="#2b7fff"
      />

      <Card
        title="Open Quotes"
        value={openQuotes}
        colour="#16a34a"
      />

      <Card
        title="Upcoming Jobs"
        value={upcomingJobs}
        colour="#f59e0b"
      />

      <Card
        title="Follow Ups Due"
        value={followUps}
        colour="#ef4444"
      />
    </div>
  );
}