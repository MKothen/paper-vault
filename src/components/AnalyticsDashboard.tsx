import React, { useMemo } from 'react';
import type { Paper, ReadingSession } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BookOpen, Clock, TrendingUp, Award, Flame } from 'lucide-react';

interface Props {
  papers: Paper[];
  sessions: ReadingSession[];
}

const COLORS = ['#FFD90F', '#22d3ee', '#FF90E8', '#a3e635', '#c084fc', '#fb923c'];

export function AnalyticsDashboard({ papers, sessions }: Props) {
  const stats = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const readPapers = papers.filter(p => p.status === 'read');
    const recentPapers = papers.filter(p => p.createdAt > thirtyDaysAgo);
    
    // Papers per month for last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const count = papers.filter(p => {
        const date = new Date(p.createdAt);
        return date >= monthStart && date < monthEnd;
      }).length;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        count
      });
    }
    
    // Tag frequency
    const tagFreq: Record<string, number> = {};
    papers.forEach(p => {
      p.tags?.forEach(tag => {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
    
    // Status distribution
    const statusDist = [
      { name: 'To Read', value: papers.filter(p => p.status === 'to-read').length },
      { name: 'Reading', value: papers.filter(p => p.status === 'reading').length },
      { name: 'Read', value: readPapers.length }
    ];
    
    // Total reading time
    const totalTime = papers.reduce((sum, p) => sum + (p.totalReadingTime || 0), 0);
    const avgTime = totalTime / Math.max(readPapers.length, 1);
    
    // Current streak
    const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);
    let currentStreak = 0;
    let lastDate: Date | null = null;
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (!lastDate) {
        lastDate = sessionDate;
        currentStreak = 1;
      } else {
        const dayDiff = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000));
        if (dayDiff === 1) {
          currentStreak++;
          lastDate = sessionDate;
        } else if (dayDiff > 1) {
          break;
        }
      }
    }
    
    return {
      total: papers.length,
      read: readPapers.length,
      recentAdded: recentPapers.length,
      totalTime: Math.floor(totalTime / 3600), // hours
      avgTime: Math.floor(avgTime / 60), // minutes
      currentStreak,
      monthlyData,
      topTags,
      statusDist
    };
  }, [papers, sessions]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {/* Stat Cards */}
      <div className="nb-card bg-nb-yellow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">Total Papers</p>
            <p className="text-4xl font-black">{stats.total}</p>
          </div>
          <BookOpen size={40} strokeWidth={3} />
        </div>
      </div>
      
      <div className="nb-card bg-nb-lime p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">Papers Read</p>
            <p className="text-4xl font-black">{stats.read}</p>
          </div>
          <Award size={40} strokeWidth={3} />
        </div>
      </div>
      
      <div className="nb-card bg-nb-cyan p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">Reading Time</p>
            <p className="text-4xl font-black">{stats.totalTime}h</p>
          </div>
          <Clock size={40} strokeWidth={3} />
        </div>
      </div>
      
      <div className="nb-card bg-nb-pink p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase">Day Streak</p>
            <p className="text-4xl font-black">{stats.currentStreak}</p>
          </div>
          <Flame size={40} strokeWidth={3} className="text-orange-600" />
        </div>
      </div>
      
      {/* Charts */}
      <div className="nb-card bg-white p-6 md:col-span-2">
        <h3 className="text-xl font-black mb-4 uppercase">Papers Added (6 Months)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats.monthlyData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#000" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="nb-card bg-white p-6 md:col-span-2">
        <h3 className="text-xl font-black mb-4 uppercase">Top Tags</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.topTags}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#000" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="nb-card bg-white p-6 lg:col-span-2">
        <h3 className="text-xl font-black mb-4 uppercase">Status Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={stats.statusDist} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
              {stats.statusDist.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
