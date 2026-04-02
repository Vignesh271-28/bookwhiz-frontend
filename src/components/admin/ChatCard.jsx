export default function ChartCard({ title, children }) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {children}
      </div>
    );
  }