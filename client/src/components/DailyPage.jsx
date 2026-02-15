import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Filter, Loader2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import ArticleGrid from './ArticleGrid';

const DailyPage = () => {
  const [allArticles, setAllArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showHighSignalOnly, setShowHighSignalOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const ARTICLES_PER_PAGE = 21

  const categories = ['All', 'Research', 'Product', 'Business', 'Ethics', 'Policy', 'Security'];

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:8000/api/news');
        setAllArticles(res.data.articles || []);
      } catch (err) {
        console.error("Failed to fetch news", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [])


  const deepDiveArticle = useMemo(() => {
     if (allArticles.length > 0) {
        return allArticles[0]; // Since backend sorts by Date > Score, the first one is THE one.
     }
     return null;
  }, [allArticles]);

  const { visibleGridArticles, heroArticle, totalPages } = useMemo(() => {
    let filtered = allArticles;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(a => a.category === selectedCategory)
    }

    if (showHighSignalOnly) {
      filtered = filtered.filter(a => a.curatorScore >= 70)
    }

    const totalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE)
    const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
    const startIndex = (safePage - 1) * ARTICLES_PER_PAGE
    const paginatedItems = filtered.slice(startIndex, startIndex + ARTICLES_PER_PAGE)
    const hero = paginatedItems.length > 0 ? paginatedItems[0] : null;
    const grid = paginatedItems.length > 0 ? paginatedItems.slice(1) : []

    return { visibleGridArticles: grid, heroArticle: hero, totalPages }
  }, [allArticles, selectedCategory, showHighSignalOnly, currentPage])

  const getDateLabel = () => {
    if (heroArticle && heroArticle.publishedAt) {
        return format(new Date(heroArticle.publishedAt), 'eeee, MMMM do');
    }
    return "All Time";
  }


  const isDeepDive = heroArticle && deepDiveArticle && heroArticle.id === deepDiveArticle.id;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-white selection:text-black">
      <Navbar />
      <div className="sticky top-16 z-40 w-full border-b border-white/10 bg-black/40 backdrop-blur-md ">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex gap-6 text-xs uppercase tracking-widest overflow-x-auto no-scrollbar pb-2 md:pb-0">
             {categories.map((cat) => (
               <button key={cat} onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                 className={`transition-colors duration-200 whitespace-nowrap pb-1 ${ 
                 selectedCategory === cat ? 'text-white font-bold border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'            
                 }`}
               >
                 {cat}
               </button>
             ))}
           </div>


           <button onClick={() => setShowHighSignalOnly(!showHighSignalOnly)} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded border transition-all ${
                showHighSignalOnly ? 'bg-green-500/10 border-green-500 text-green-400': 'border-white/20 text-gray-500 hover:border-white hover:text-white'
             }`}
           >
             <Filter size={12} />
             <span>High Signal Only</span>
           </button>

        </div>
      </div>


      {loading ? (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-gray-500">
           <Loader2 size={40} className="animate-spin text-white" />
           <p className="text-xs uppercase tracking-widest animate-pulse">Initializing Intelligence Feed...</p>
        </div>
      ) : (
        <div className='-mt-16 relative z-0'>

            {heroArticle ? (
                <HeroSection article={heroArticle} isDeepdiveAvailable={isDeepDive}/>
            ) : (
                <div className="h-64 flex items-center justify-center border-b border-white/10 text-gray-500 italic">
                    No intelligence found in this sector.
                </div>
            )}

            <main className="max-w-7xl mx-auto px-6 py-12">
                

                <div className="flex flex-col md:flex-row items-end justify-between mb-8 pb-4 border-b border-white/10 gap-4">
                    <div>
                        <h2 className="text-2xl text-white font-serif mb-2">Detailed Analysis</h2>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono uppercase">
                            <Calendar size={12} />
                            <span>{getDateLabel()}</span>
                            <span className="w-px h-3 bg-gray-700 mx-2"></span>
                            <span>Page {currentPage} of {totalPages || 1}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="flex items-center gap-1 px-3 py-1.5 border border-white/10 rounded hover:bg-white/5 text-xs uppercase disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-white/10 rounded hover:bg-white/5 text-xs uppercase disabled:opacity-30 disabled:cursor-not-allowed transition">
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
                <ArticleGrid articles={visibleGridArticles} />
            </main>
        </div>


      )}



    </div>
  );
};

export default DailyPage;