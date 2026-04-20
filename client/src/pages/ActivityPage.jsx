import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ArticleGrid from '../components/ArticleGrid';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

const ActivityPage = () => {
    const { user } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await api.get('/user/activity');
                setArticles(response.data);
            } catch (err) {
                console.error("Failed to fetch activity:", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchActivity();
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen bg-black text-white p-8">
                <Navbar />
                <div className="max-w-7xl mx-auto pt-32 text-center text-gray-500">
                    Please log in to view activity.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-3 md:p-8 font-sans">
            <Navbar />
            <main className="max-w-7xl mx-auto pt-24 md:pt-32">
                <div className="flex items-center gap-3 mb-8">
                    <Activity className="text-red-500" size={28} />
                    <h1 className="text-3xl md:text-5xl font-mono uppercase tracking-tighter text-white">
                        Your <span className="text-red-500">Activity</span>
                    </h1>
                </div>
                <div className="mb-12 max-w-2xl">
                    <p className="text-gray-400 text-lg leading-relaxed mix-blend-difference">
                        Record of intelligence bulletins and high-signal events you have engaged with.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64 border border-white/10 relative overflow-hidden bg-[#050505]">
                        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)] before:animate-[scan_2s_linear_infinite]" />
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-gray-500 z-10 animate-pulse">
                            RETRIEVING RECORDS...
                        </span>
                    </div>
                ) : articles.length > 0 ? (
                    <ArticleGrid articles={articles} />
                ) : (
                    <div className="text-center py-32 border border-dashed border-white/10 bg-white/[0.02]">
                        <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">
                            NO ACTIVITY DETECTED
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ActivityPage;
