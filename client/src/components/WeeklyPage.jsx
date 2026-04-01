import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { BarChart as BarIcon, TrendingUp, Activity, Loader2, Download } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import Navbar from './Navbar'; 

const WeeklyPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats(res.data);
        if (res.data.charts.byCategory && res.data.charts.byCategory.length > 0) {
          setSelectedSector(res.data.charts.byCategory[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-gray-500">
        <Loader2 size={40} className="animate-spin text-white mb-4" />
        <p className="text-xs uppercase tracking-widest animate-pulse">Connecting to Telemetry...</p>
      </div>
    );
  }

  const SENTIMENT_COLORS = {
    'Positive': '#10b981', 
    'Neutral': '#3b82f6',  
    'Critical': '#ef4444', 
    'Negative': '#ef4444'
  };

  const getFilteredTrendData = () => {
    if (!stats || !stats.trends || !selectedSector) return [];
    return stats.trends.filter(t => t.category === selectedSector);
  };

  const trendData = getFilteredTrendData();
  const sectorList = stats?.charts?.byCategory?.map(c => c.name) || [];

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-200 font-sans pb-24 selection:bg-white selection:text-black">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        
        <div className="mb-12 border-b border-white/10 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Intelligence Telemetry</h1>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-[0.2em]">
              Signal processing & sentiment distribution • Last 30 Days
            </p>
          </div>
          <div className="text-right hidden md:block">
            <span className="text-[10px] font-mono text-gray-600 block mb-1">DATA STATUS</span>
            <div className="flex items-center gap-2 text-green-500 text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE FEED ACTIVE
            </div>
          </div>
        </div>

        {stats && stats.charts && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-[#050505] border border-white/5 rounded-xl p-8 h-[450px] flex flex-col">
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                    <BarIcon size={14} className="text-blue-500" /> Sector Sentiment Matrix
                  </h3>
                  <p className="text-[10px] text-gray-600 mt-1 uppercase font-mono">Comparing outlook across active industries</p>
                </div>
                <div className="flex-grow w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={stats.charts.sentimentMatrix} 
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis 
                         dataKey="category" 
                         type="category" 
                         stroke="#444" 
                         fontSize={10} 
                         tickLine={false} 
                         axisLine={false}
                         width={100}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '8px', fontSize: '11px' }} 
                        itemStyle={{ padding : '2px 0'}}
                      />
                      <Bar dataKey="Positive" stackId="a" fill={SENTIMENT_COLORS.Positive} radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="Neutral" stackId="a" fill={SENTIMENT_COLORS.Neutral} radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="Critical" stackId="a" fill={SENTIMENT_COLORS.Critical} radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#050505] border border-white/5 rounded-xl p-8 h-[450px] flex flex-col">
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                    <Activity size={14} className="text-emerald-500" /> Aggregate Vibe
                  </h3>
                  <p className="text-[10px] text-gray-600 mt-1 uppercase font-mono">Global dataset sentiment distribution</p>
                </div>
                <div className="flex-grow w-full h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.charts.bySentiment}
                        innerRadius={75}
                        outerRadius={100}
                        cornerRadius={5}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.3;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                            return (
                              <text 
                                x={x} 
                                y={y} 
                                fill="white" 
                                textAnchor={x > cx ? 'start' : 'end'} 
                                dominantBaseline="central"
                                className="text-[12px] font-bold font-mono"
                              >
                                {value}
                              </text>
                            );
                          }}
                        labelLine={{ stroke: '#333', strokeWidth: 0 }}
                        isAnimationActive={true}
                      >
                        {stats.charts.bySentiment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || '#333'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-3xl font-serif text-white">
                        {stats.charts.bySentiment.reduce((acc, curr) => acc + curr.value, 0)}
                     </span>
                     <span className="text-[10px] text-gray-600 uppercase tracking-tighter">Signals</span>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                    {Object.entries(SENTIMENT_COLORS).slice(0, 3).map(([key, color]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{key}</span>
                        </div>
                    ))}
                </div>
              </div>

            </div>
            <div className="bg-[#050505] border border-white/5 rounded-xl p-8 min-h-[500px] flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                    <TrendingUp size={14} className="text-purple-500" /> Sector Signal Velocity
                  </h3>
                  <p className="text-[10px] text-gray-600 mt-1 uppercase font-mono">Historical sentiment volatility per industry</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {sectorList.map(sector => (
                        <button
                            key={sector}
                            onClick={() => setSelectedSector(sector)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                selectedSector === sector 
                                ? 'bg-white text-black ring-4 ring-white/10' 
                                : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {sector}
                        </button>
                    ))}
                </div>
              </div>

              <div className="flex-grow w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    
                        <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={SENTIMENT_COLORS.Positive} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={SENTIMENT_COLORS.Positive} stopOpacity={0}/>
                        </linearGradient>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        stroke="#333" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={15}
                        tickFormatter={(str) => {
                            const d = new Date(str);
                            return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
                        }} 
                    />
                    <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '8px', color: '#fff' }}
                        labelStyle={{ color: '#555', fontSize: '10px', marginBottom: '5px' }}
                    />
                    <Legend 
                        verticalAlign="top" 
                        align="right"
                        height={36} 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '0px' }} 
                    />
                    
                    <Line 
                        type="monotone" 
                        dataKey="Positive" 
                        name="Bullish"
                        stroke={SENTIMENT_COLORS.Positive} 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1000}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="Neutral" 
                        name="Stable"
                        stroke={SENTIMENT_COLORS.Neutral} 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4 }}
                        animationDuration={1500}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="Critical" 
                        name="Bearish / Alert"
                        stroke={SENTIMENT_COLORS.Critical} 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono italic">
                <span>* Data aggregated from verified industry publications.</span>
                <span>ID: {selectedSector?.toUpperCase()}_TELEMETRY_STREAM</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-20">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-white/10 pb-4 gap-4">
                <div>
                    <h2 className="text-2xl font-serif text-white tracking-tight">The Executive Dossier</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-mono tracking-widest mt-1">
                        Compiled Top 10 Signals • Official PDF Report
                    </p>
                </div>
                
                <a 
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/news/weekly/report`} 
                    target="_blank" 
                    rel="noreferrer"
                    download="Weekly_Dossier.pdf"
                    className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                    <Download size={14} /> Download Dossier
                </a>
            </div>

            <div className="w-full h-[800px] rounded-xl overflow-hidden border border-white/10 bg-[#111] relative shadow-2xl">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0">
                    <Loader2 size={30} className="animate-spin mb-4" />
                    <span className="text-xs uppercase tracking-widest font-mono">Generating PDF Stream...</span>
                </div>
                
                <iframe 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/news/weekly/report`} 
                    title="Weekly Intelligence Dossier"
                    className="w-full h-full relative z-10"
                    style={{ border: 'none' }}
                />
            </div>
        </div>

      </main>
    </div>
  );
};

export default WeeklyPage;