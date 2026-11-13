import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OrdersChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No orders data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-dark mb-4">Orders Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickCount={5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [`${value}`, 'Orders']}
            />
            <Bar
              dataKey="orders"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarWidth={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrdersChart;