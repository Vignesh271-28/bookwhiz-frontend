export default function StatCard({ title, value, trend }) {
    return (
      <div className="stat-card">
        <p>{title}</p>
        <h2>{value}</h2>
        <span className={trend > 0 ? "up" : "down"}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      </div>
    );
  }