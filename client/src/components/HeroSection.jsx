import React from 'react';
import { ArrowUpRight, Clock, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate} from 'react-router-dom'


const HeroSection = ({ article, isDeepdiveAvailable }) => {
   const navigate = useNavigate();
   const categoryImages = {'Research' : 'https://drive.google.com/thumbnail?id=15ZTr66kfFjQiYLaRb--2lmVUvChaR3In&sz=s3000',
                           'Product': 'https://drive.google.com/thumbnail?id=1BQFgbOneEXU8DaWEQXHgdDb4iDQcQsns&sz=s3000',
                           'Policy': 'https://drive.google.com/thumbnail?id=1beoiWtKpc2aroXJetfpBSD6Njaq9yOlE&sz=s3000',
                           'Business':'https://drive.google.com/thumbnail?id=1R5Zy5PotFR4umkcRorZ9vvVTn8Tv_YTX&sz=s3000',
                           'Ethics': 'https://drive.google.com/thumbnail?id=1mEKtluRe_Vt2LEIMPWppySe57nYi9p_7&sz=s3000',
                           'Security': 'https://drive.google.com/thumbnail?id=1LM6UVjouabE57sqQawAthjOJRppNu3R1&sz=s3000'
                        }

   if (!article){
      return null
   }

   const bgImage = article.imageUrl || categoryImages[article.category]

   return (
      <div className = 'min-h-[500px] relative h-[60vh] bg-black '>
         <img className = 'absolute inset-0 object-cover w-full h-full' src = {bgImage}/>
         <div className='absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent'></div>
         <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-12 h-full flex items-end">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-end">
               
               <div className="lg:col-span-7">

                  <div className="mb-4 flex items-center gap-3">
                     <span className="bg-white text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                        {article.category || 'News'}
                     </span>
                     <span className="text-green-400 text-xs font-mono uppercase tracking-widest bg-green-900/30 px-2 py-1 rounded border border-green-900">
                        Score: {article.curatorScore}
                     </span>
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight mb-6 drop-shadow-xl">
                     {article.title}
                  </h1>

                  <div className="flex items-center gap-4 text-gray-300 text-sm mb-6">
                     <Clock size={16} />
                     <span>{formatDistanceToNow(new Date(article.publishedAt))} ago</span>
                     <span className="text-gray-500">•</span>
                     <span className="text-white font-medium">{article.sourceName}</span>
                  </div>


                  <div className="flex gap-3">
                     <button 
                        onClick={() => navigate(`/article/${article.id}`)}
                        className="bg-white text-black px-6 py-3 font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition flex items-center gap-2"
                     >
                        <Bookmark size={16} /> Deep Dive
                     </button>

                     <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="border border-white/30 text-white px-6 py-3 font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition flex items-center gap-2"
                     >
                        Read Source <ArrowUpRight size={16}/>
                     </a>
                  </div>
               </div>

               <div className="hidden lg:block lg:col-span-5 border-l border-white/20 pl-8 pb-2">
                  <h3 className="text-gray-400 uppercase text-xs tracking-[0.2em] mb-4 font-bold">
                     Intelligence Briefing
                  </h3>
                  <p className="text-gray-200 text-lg font-serif leading-relaxed line-clamp-4 opacity-90">
                     {/* Removes bullets so it reads like a paragraph */}
                     {article.summary ? article.summary.replace(/•/g, '') : "Summary unavailable."}
                  </p>
               </div>

            </div>
            </div>
      </div>
   )

}
export default HeroSection;