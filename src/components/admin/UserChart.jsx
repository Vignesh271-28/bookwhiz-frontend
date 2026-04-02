import { PieChart, Pie, Cell } from "recharts";

const data = [
  { name: "Admin", value: 10 },
  { name: "Organizer", value: 30 },
  { name: "Attendee", value: 60 }
];

const COLORS = ["#60a5fa", "#3b82f6", "#1e40af"];

export default function UserChart() {
  return (
    <div className="chart-box">
      <h4>User Distribution</h4>
      <PieChart width={260} height={260}>
        <Pie data={data} dataKey="value" innerRadius={60} outerRadius={90}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>
      </PieChart>
    </div>
  );
}