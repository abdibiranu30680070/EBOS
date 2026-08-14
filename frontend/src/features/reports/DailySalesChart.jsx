// ─────────────────────────────────────────────
// DailySalesChart — Simple sparkline bar chart
// Renders last 14 days of daily sales (pure SVG/HTML)
// Props: orders
// ─────────────────────────────────────────────

export function DailySalesChart({ orders }) {
  // Build last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return { date: d, total: 0 };
  });

  for (const order of orders) {
    const orderDate = new Date(order.createdAt).toDateString();
    const day = days.find(d => d.date.toDateString() === orderDate);
    if (day) day.total += order.totalAmount;
  }

  const maxTotal = Math.max(...days.map(d => d.total), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Daily Sales — Last 14 Days</h3>
        <p className="text-xs text-slate-400 mt-0.5">Total revenue (ETB) per day</p>
      </div>

      <div className="px-6 py-5">
        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-32">
          {days.map((day, i) => {
            const heightPct = (day.total / maxTotal) * 100;
            const isToday   = day.date.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 group relative"
                title={`${day.date.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })}: ETB ${day.total.toLocaleString()}`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ETB {day.total.toLocaleString()}
                  </div>
                  <div className="w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
                </div>

                {/* Bar */}
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${isToday ? 'bg-blue-500' : day.total > 0 ? 'bg-blue-200 hover:bg-blue-300' : 'bg-slate-100'}`}
                  style={{ height: `${Math.max(heightPct, day.total > 0 ? 4 : 2)}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* X axis labels */}
        <div className="flex gap-1.5 mt-2">
          {days.map((day, i) => {
            const isToday = day.date.toDateString() === new Date().toDateString();
            const showLabel = i === 0 || i === 6 || i === 13 || isToday;
            return (
              <div key={i} className="flex-1 text-center">
                {showLabel && (
                  <span className={`text-[10px] font-medium ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                    {isToday ? 'Today' : day.date.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
