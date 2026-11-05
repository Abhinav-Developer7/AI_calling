import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  ShoppingBag,
  PhoneCall,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const SENTIMENT_COLORS = {
  positive: '#10b981', // emerald-500
  neutral: '#64748b',  // slate-500
  negative: '#f43f5e', // rose-500
};

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    callsScheduled: 0,
    callsCompleted: 0,
    callsFailedOrNoAnswer: 0,
    avgRating: 0,
    openComplaints: 0,
  });
  const [ratingData, setRatingData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [recentActivity, setRecentActivity] = useState({
    recentPurchases: [],
    recentCompletedCalls: [],
    activeComplaints: [],
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, statsRes, activityRes] = await Promise.all([
        apiClient.get('/dashboard/overview'),
        apiClient.get('/dashboard/call-statistics'),
        apiClient.get('/dashboard/recent-activity'),
      ]);

      if (overviewRes.data.success) {
        setStats(overviewRes.data.stats);
      }

      if (statsRes.data.success) {
        // Prepare 1 to 5 star distribution
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        (statsRes.data.ratingDistribution || []).forEach((item) => {
          if (item._id >= 1 && item._id <= 5) {
            ratingCounts[item._id] = item.count;
          }
        });
        setRatingData([
          { name: '1 ★', count: ratingCounts[1] },
          { name: '2 ★', count: ratingCounts[2] },
          { name: '3 ★', count: ratingCounts[3] },
          { name: '4 ★', count: ratingCounts[4] },
          { name: '5 ★', count: ratingCounts[5] },
        ]);

        // Prepare sentiment distribution
        const sentiments = (statsRes.data.sentimentDistribution || []).map((item) => ({
          name: item._id ? item._id.toUpperCase() : 'UNKNOWN',
          value: item.count,
          color: SENTIMENT_COLORS[item._id?.toLowerCase()] || '#94a3b8',
        }));
        setSentimentData(sentiments);
      }

      if (activityRes.data.success) {
        setRecentActivity({
          recentPurchases: activityRes.data.recentPurchases || [],
          recentCompletedCalls: activityRes.data.recentCompletedCalls || [],
          activeComplaints: activityRes.data.activeComplaints || [],
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time post-purchase feedback calling metrics</p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Total Purchases</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalPurchases}</p>
            <span className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Live billing sync
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Calls Scheduled</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.callsScheduled}</p>
            <span className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> 15m post-purchase delay
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Calls Completed</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.callsCompleted}</p>
            <span className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Feedback collected
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-800">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
              </p>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-xs text-slate-500 mt-1 block">1 to 5 scale</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Breakdown Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Customer Rating Breakdown (1–5 Stars)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value) => [`${value} calls`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Customer Sentiment Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                No sentiment data collected yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Completed Calls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Recent Feedback Calls
          </h2>
          <div className="space-y-3">
            {recentActivity.recentCompletedCalls.length > 0 ? (
              recentActivity.recentCompletedCalls.map((item) => (
                <div key={item._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800">{item.customerName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Invoice #{item.invoiceNumber}</p>
                    <p className="text-[11px] text-slate-600 italic truncate max-w-xs mt-0.5">"{item.summary}"</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-600 text-sm">{item.overallRating ? `${item.overallRating} ★` : 'No rating'}</span>
                    <span className="block text-[10px] text-slate-400 mt-1 capitalize">{item.sentiment}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No completed feedback calls recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Complaints Requiring Attention */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Open Complaints Requiring Action ({stats.openComplaints})
          </h2>
          <div className="space-y-3">
            {recentActivity.activeComplaints.length > 0 ? (
              recentActivity.activeComplaints.map((item) => (
                <div key={item._id} className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800">{item.customerName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Invoice #{item.invoiceNumber}</p>
                    <p className="text-[11px] text-rose-700 font-medium truncate max-w-xs mt-0.5">{item.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                    {item.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                All clear! No open customer complaints.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
