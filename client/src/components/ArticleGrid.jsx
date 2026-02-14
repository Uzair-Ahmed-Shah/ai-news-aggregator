import React from 'react';
import { ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ArticleGrid = ({ articles }) => {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {articles.map((article, index) => (
        <ArticleCard key={article.id || article.url || index} article={article} />
      ))}
    </div>
  );
};

const ArticleCard = ({ article }) => {
  const bgImage = article.imageUrl || "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop";

  return (
    <div className="group flex flex-col bg-[#0a0a0a] border border-white/5 hover:border-white/20 transition-all duration-300 rounded-sm overflow-hidden flex-1">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={bgImage} 
          alt={article.title}
          className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
        
        <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-black/80 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-sm border border-white/10 uppercase tracking-tighter text-gray-200">
                {article.category || 'News'}
            </span>
            
            {article.curatorScore >= 80 && (
                <span className="bg-green-500/20 backdrop-blur-md text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-sm border border-green-500/30 flex items-center gap-1">
                    <ShieldCheck size={10} /> HIGH SIGNAL
                </span>
            )}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">
          <Clock size={12} />
          <span>{article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt)) : 'Just now'} ago</span>
          <span className="text-gray-800">•</span>
          <span className="text-gray-400">{article.sourceName || 'Unknown'}</span>
        </div>

        
        <h3 className="text-lg font-serif text-white group-hover:text-gray-200 leading-snug mb-4 line-clamp-2">
          {article.title}
        </h3>

        <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
           {article.summary ? article.summary.replace(/•/g, '') : "AI-generated summary pending analysis..."}
        </p>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${article.curatorScore > 50 ? 'bg-green-500' : 'bg-gray-500'} animate-pulse`}></div>
                <span className="text-[10px] font-mono text-gray-500">Score: {article.curatorScore || 'N/A'}</span>
            </div>
            
            <a 
              href={article.url} 
              target="_blank" 
              rel="noreferrer"
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
            >
              Intelligence <ArrowUpRight size={14} />
            </a>
        </div>
      </div>
    </div>
  );
};

export default ArticleGrid;
