import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function DailyOrdersChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '160px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        fontSize: '13px'
      }}>
        Нет данных за последние 14 дней
      </div>
    );
  }

  const chartData = data.map(stat => {
    const date = new Date(stat.date);
    const dayLabel = isNaN(date.getTime())
      ? stat.date.substring(5, 10).replace('-', '.')
      : date.toLocaleDateString('ru-KZ', { day: 'numeric', month: 'short' });
    
    return {
      label: dayLabel,
      count: stat.count,
      fullDate: stat.date,
    };
  });

  const maxValue = Math.max(...chartData.map(d => d.count));

  return (
    <div style={{ width: '100%', height: '180px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border-subtle)" 
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-subtle)' }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              fontSize: '12px',
            }}
            formatter={(value) => [value, 'Заказов']}
            labelStyle={{ color: 'var(--text-main)' }}
          />
          <Bar
            dataKey="count"
            fill="var(--blue-primary)"
            radius={[3, 3, 0, 0]}
            maxBarSize={24}
          >
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DailyOrdersChart;
