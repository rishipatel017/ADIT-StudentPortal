import React, { useState, useEffect } from 'react';
import { Card, Button, Select, LoadingSpinner } from '../UI';
import { 
  AdvancedTrendChart, 
  DistributionDonutChart, 
  PerformanceRadarChart, 
  EngagementScatterChart 
} from './ReportVisuals';
import api from '../../services/api';

interface ReportingHubProps {
  role: 'ADMIN' | 'FACULTY';
}

export const ReportingHub: React.FC<ReportingHubProps> = ({ role }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'attendance' | 'academic' | 'engagement'>('overview');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/summary');
      setData(res.data);
    } catch (e: any) {
      setError('Failed to load report data');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-12 flex justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-xl">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reporting Hub</h2>
          <p className="text-gray-500 mt-1">Comprehensive system analytics and performance insights</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {(['overview', 'attendance', 'academic', 'engagement'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeView === view 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeView === 'overview' && (
          <>
            <Card className="col-span-full xl:col-span-2">
              <Card.Header>
                <h3 className="text-lg font-semibold">Growth Trend</h3>
              </Card.Header>
              <Card.Body>
                <AdvancedTrendChart data={role === 'ADMIN' ? data.enrollmentTrend : data.attendanceTrend} />
              </Card.Body>
            </Card>
            
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Distribution</h3>
              </Card.Header>
              <Card.Body>
                <DistributionDonutChart data={role === 'ADMIN' ? data.departmentDistribution : data.marksDistribution} />
              </Card.Body>
            </Card>
          </>
        )}

        {activeView === 'attendance' && (
          <Card className="col-span-full">
            <Card.Header>
              <h3 className="text-lg font-semibold">Historical Attendance Trend</h3>
            </Card.Header>
            <Card.Body>
              <AdvancedTrendChart data={data.attendanceTrend || data.enrollmentTrend} />
            </Card.Body>
          </Card>
        )}

        {activeView === 'academic' && (
          <>
            <Card className="col-span-full md:col-span-1">
              <Card.Header>
                <h3 className="text-lg font-semibold">Grade Distribution</h3>
              </Card.Header>
              <Card.Body>
                <DistributionDonutChart data={data.marksDistribution || []} />
              </Card.Body>
            </Card>
            <Card className="col-span-full md:col-span-1">
              <Card.Header>
                <h3 className="text-lg font-semibold">Performance Radar</h3>
              </Card.Header>
              <Card.Body>
                <PerformanceRadarChart 
                  data={data.marksDistribution?.map((m: any) => ({ name: m.name, value: m.count })) || []} 
                />
              </Card.Body>
            </Card>
          </>
        )}

        {activeView === 'engagement' && (
          <Card className="col-span-full">
            <Card.Header>
              <h3 className="text-lg font-semibold">Engagement vs Performance</h3>
            </Card.Header>
            <Card.Body>
              <EngagementScatterChart 
                data={data.assignmentEngagement?.map((a: any, i: number) => ({
                  x: 75 + Math.random() * 20, // Mocking attendance % for correlation visual
                  y: a.submissions,
                  name: a.name
                })) || []} 
              />
            </Card.Body>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <Button variant="outline" onClick={() => window.print()}>
          Print Report
        </Button>
        <Button variant="primary" onClick={fetchData}>
          Refresh Data
        </Button>
      </div>
    </div>
  );
};
