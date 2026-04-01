import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import api from '../lib/api';
import { Calendar, ChevronRight, BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Archive = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchives = async () => {
      try {
        const response = await api.get('/archive');
        setArchives(response.data);
      } catch (error) {
        console.error("Failed to fetch archives", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArchives();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-white selection:text-black">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-white mb-2">Weekly Archive</h1>
          <p className="text-gray-400">Past intelligence reports, preserved for historical context.</p>
        </div>

        {loading ? (
          <div className="flex animate-pulse space-x-4 h-64 bg-white/5 rounded-sm w-full"></div>
        ) : archives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0a0a0a] rounded-sm border border-white/5">
            <BookOpen className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300">No Archives Found</h3>
            <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">
              Snapshots are generated automatically every Sunday. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {archives.map((report) => (
              <div 
                key={report.id} 
                className="group relative flex flex-col rounded-sm border border-white/5 bg-[#0a0a0a] p-6 transition-all duration-300 hover:border-white/20"
              >
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-widest font-mono">
                  <Calendar size={14} />
                  <span>
                    Week Ending: {formatDate(report.weekEndDate)}
                  </span>
                </div>
                
                <h2 className="text-xl font-serif text-white hover:text-gray-200 leading-snug mb-3">
                  {report.title || 'Weekly Snapshot'}
                </h2>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                  Contains captured trends, industry analysis, and the top curated articles from this week.
                </p>

                <div className="flex items-center justify-between border-t border-white/5 mt-auto pt-4">
                  <div className="flex items-center text-[10px] font-mono text-gray-500">
                    <Clock size={14} className="mr-1 inline" />
                    Generated Snapshot
                  </div>
                  
                  <Link 
                    to={`#`} 
                    className="flex items-center text-white hover:text-gray-300 transition-colors gap-1 text-[10px] font-bold uppercase tracking-wider"
                  >
                    View Report
                    <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Archive;
