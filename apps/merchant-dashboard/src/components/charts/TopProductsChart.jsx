import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const TopProductsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No product data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-dark mb-4">Top Products by Revenue</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tickCount={5}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => value.length > 20 ? `${value.slice(0, 20)}...` : value}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
            />
            <Bar
              dataKey="revenue"
              radius={[0, 4, 4, 0]}
              maxBarWidth={40}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopProductsChart;