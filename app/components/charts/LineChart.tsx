'use client';

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface LineChartProps {
  data: any[];
  width?: string | number;
  height?: string | number;
}

export default function CustomLineChart({ data, width = "100%", height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="adSpend" stroke="#8884d8" />
        <Line type="monotone" dataKey="conversions" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
} 