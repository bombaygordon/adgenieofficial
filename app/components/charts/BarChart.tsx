'use client';

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface BarChartProps {
  data: any[];
  width?: string | number;
  height?: string | number;
}

export default function CustomBarChart({ data, width = "100%", height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="ctr" fill="#8884d8" />
        <Bar dataKey="cpc" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
} 