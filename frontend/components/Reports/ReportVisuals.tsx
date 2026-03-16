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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];

interface ChartProps {
  data: any[];
  title?: string;
  height?: number;
}

export const AdvancedTrendChart: React.FC<ChartProps> = ({ data, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={10} />
      <YAxis fontSize={12} tickLine={false} axisLine={false} />
      <Tooltip 
        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
      />
      <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
      <Area type="monotone" dataKey="percentage" stroke="#10b981" fill="transparent" strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
);

export const DistributionDonutChart: React.FC<ChartProps> = ({ data, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={5}
        dataKey="count"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend verticalAlign="bottom" height={36}/>
    </PieChart>
  </ResponsiveContainer>
);

export const PerformanceRadarChart: React.FC<ChartProps> = ({ data, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
      <PolarGrid stroke="#e5e7eb" />
      <PolarAngleAxis dataKey="name" fontSize={11} />
      <PolarRadiusAxis />
      <Radar
        name="Performance"
        dataKey="value"
        stroke="#8b5cf6"
        fill="#8b5cf6"
        fillOpacity={0.5}
      />
      <Tooltip />
    </RadarChart>
  </ResponsiveContainer>
);

export const EngagementScatterChart: React.FC<ChartProps> = ({ data, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
      <XAxis type="number" dataKey="x" name="Attendance %" unit="%" fontSize={12} />
      <YAxis type="number" dataKey="y" name="Marks" unit="" fontSize={12} />
      <ZAxis type="number" range={[60, 400]} />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
      <Legend />
      <Scatter name="Student Correlation" data={data} fill="#ec4899" />
    </ScatterChart>
  </ResponsiveContainer>
);
