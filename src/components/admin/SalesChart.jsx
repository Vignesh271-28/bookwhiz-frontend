import { BarChart, Bar, XAxis, Tooltip } from "recharts";

const data = [
  { month: "Jan", sold: 120 },
  { month: "Feb", sold: 180 },
  { month: "Mar", sold: 150 }
];

export default function SalesChart() {
  return (
    <div className="chart-box">
      <h4>Ticket Sales Analytics</h4>
      <BarChart width={500} height={260} data={data}>
        <XAxis dataKey="month" />
        <Tooltip />
        <Bar dataKey="sold" fill="#2563eb" radius={6} />
      </BarChart>
    </div>
  );
}