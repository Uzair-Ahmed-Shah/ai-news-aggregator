import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ExternalLink } from 'lucide-react';
import api from '../lib/api';
import Navbar from './Navbar';

const ArchiveDetail = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get(`/archive/${id}`);
        setReport(response.data);
      } catch (error) {
        console.error("Failed to fetch archive detail", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-gray-200">
        <Navbar />
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-gray-500 font-mono tracking-widest text-sm uppercase animate-pulse">Loading Archive Scope...</div>
        </div>
      </div>
    );
  }

  if (!report && !loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-gray-200">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-serif text-white mb-4">Classified Report Not Found</h2>
          <Link to="/archive" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest text-xs">
            <ChevronLeft size={16} /> Return to Archives
          </Link>
        </div>
      </div>
    );
  }

  // Parse JSON depending on how Prisma returns it (JSON array or raw string)
  let articlesObject = [];
  try {
    articlesObject = typeof report.topArticles === 'string' 
      ? JSON.parse(report.topArticles) 
      : report.topArticles;
  } catch(e) {
    console.error("Error parsing JSON array:", e);
  }

  const articlesArray = Array.isArray(articlesObject) ? articlesObject : [];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-white selection:text-black">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-6 py-12 pb-24">
        <Link 
          to="/archive" 
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 mb-8 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Archives
        </Link>

        <header className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400/80 mb-4 uppercase tracking-widest font-mono">
            <Calendar size={14} />
            <span>Scope Ended: {formatDate(report.weekEndDate)}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">
            {report.title || 'Weekly Intelligence Snapshot'}
          </h1>
          
          <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
            This dossier contains the highest-signal articles scraped and analyzed over the preceding week. The entries are immutable to preserve historical context.
          </p>
        </header>

        <div className="space-y-6">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-6 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-600"></span> Captured Articles ({articlesArray.length})
          </h2>
          
          {articlesArray.map((article, idx) => (
            <article 
              key={article.id || idx} 
              className="bg-[#0a0a0a] border border-white/5 rounded-sm p-6 hover:border-white/20 transition-all duration-300 group"
            >
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">
                  <span className="text-gray-400">{article.sourceName || 'Unknown Database'}</span>
                  <span className="text-gray-700">•</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${article.curatorScore > 50 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span>Score: {article.curatorScore || 'N/A'}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-serif text-white mb-3 leading-snug group-hover:text-gray-200 transition-colors">
                  {article.title}
                </h3>
                
                {article.summary && (
                  <div className="text-gray-400 text-sm leading-relaxed mb-6 whitespace-pre-line">
                    {article.summary}
                  </div>
                )}
                
                <div className="mt-auto border-t border-white/5 pt-4">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Read Source Intel <ExternalLink size={12} className="ml-1" />
                  </a>
                </div>
              </div>
            </article>
          ))}
          
          {articlesArray.length === 0 && (
             <div className="text-center py-12 text-sm text-gray-500 border border-white/5 rounded-sm bg-white/5">
                No article telemetry data found for this week.
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ArchiveDetail;