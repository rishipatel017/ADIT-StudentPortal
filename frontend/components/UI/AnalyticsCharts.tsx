import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

interface ChartProps {
  data: any[];
  title: string;
}

export const TrendLineChart: React.FC<ChartProps> = ({ data, title }) => (
  <div className="h-64 w-full">
    <h4 className="text-sm font-medium text-gray-700 mb-4">{title}</h4>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={10} />
        <YAxis fontSize={10} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="Count" />
        <Line type="monotone" dataKey="percentage" stroke="#82ca9d" name="Percentage" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const DistributionBarChart: React.FC<ChartProps> = ({ data, title }) => (
  <div className="h-64 w-full">
    <h4 className="text-sm font-medium text-gray-700 mb-4">{title}</h4>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={10} />
        <YAxis fontSize={10} />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" name="Students" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const ComparisonPieChart: React.FC<ChartProps> = ({ data, title }) => (
  <div className="h-64 w-full">
    <h4 className="text-sm font-medium text-gray-700 mb-4">{title}</h4>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
