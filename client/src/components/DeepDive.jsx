import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, Calendar, Share2, Bookmark, ShieldCheck, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from './Navbar';

const DeepDive = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:8000/api/news/${id}`);
        setArticle(res.data.article);
      } catch (err) {
        console.error("Failed to fetch article", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-500 font-mono text-sm tracking-widest">DECRYPTING BRIEFING...</div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-200 font-sans selection:bg-green-900 selection:text-white">
      <Navbar />

      <div className="fixed top-0 left-0 w-full h-1 z-50">
        <div className="h-full bg-green-500 w-[0%] animate-[width_1s_ease-out_forwards]" style={{width: '30%'}}></div>
      </div>

      <main className="pb-24">
        
        <div className="relative w-full h-[60vh] min-h-[500px]">
           <img 
             src={article.imageUrl} 
             className="absolute inset-0 w-full h-full object-cover opacity-40 mask-image-gradient"
             alt="Cover" 
           />
           <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/80 to-neutral-950"></div>

           <div className="relative z-10 max-w-4xl mx-auto px-6 h-full flex flex-col justify-end pb-12">
              
              <button 
                onClick={() => navigate('/')}
                className="absolute top-8 left-6 md:left-0 flex items-center gap-2 text-gray-400 hover:text-white transition group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Back to Intel
              </button>

              <div className="flex items-center gap-3 mb-6">
                 <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm">
                    {article.category} Deep Dive
                 </span>
                 <span className="flex items-center gap-1.5 bg-green-900/30 text-green-400 border border-green-900 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm">
                    <ShieldCheck size={12} /> Score: {article.curatorScore}
                 </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-white leading-tight mb-8">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 border-t border-white/10 pt-6 font-mono">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {format(new Date(article.publishedAt), 'MMMM do, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    5 min read
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <FileText size={16} />
                    Source: {article.sourceName}
                  </div>
              </div>
           </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 -mt-10 relative z-20">
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-12 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Executive Intelligence Summary
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed font-serif italic">
                    "This represents a pivotal shift in AI architecture. Understanding the move from probabilistic generation to logical reasoning is crucial for anticipating the next wave of enterprise applications."
                </p>
            </div>

            <article className="prose prose-invert prose-lg max-w-none">
                {(article.deepSummary || article.summary).split('\n').map((paragraph, index) => (
                    <p key={index} className={`text-gray-300 leading-8 mb-6 font-serif ${index === 0 ? 'first-letter:text-5xl first-letter:font-bold first-letter:text-white first-letter:mr-3 first-letter:float-left' : ''}`}>
                        {paragraph.replace(/•/g, '')}
                    </p>
                ))}
            </article>

            <div className="mt-16 pt-8 border-t border-white/10 flex justify-between items-center">
                <div className="text-gray-500 text-xs uppercase tracking-widest">
                    End of Briefing
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                        <Share2 size={18} /> Share
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                        <Bookmark size={18} /> Save
                    </button>
                    <a href={article.url} target="_blank" rel="noreferrer" className="bg-white text-black px-6 py-2 rounded-sm font-bold text-sm uppercase hover:bg-gray-200 transition">
                        Read Full Source
                    </a>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default DeepDive;