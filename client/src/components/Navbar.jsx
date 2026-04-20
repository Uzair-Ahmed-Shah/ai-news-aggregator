import React, {useState} from 'react'
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, User, LogOut, Bookmark, Activity, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ deepDiveId }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isUpdatingNewsletter, setIsUpdatingNewsletter] = useState(false);
    const location = useLocation();
    const { user, openAuthModal, logout, toggleNewsletterOptIn } = useAuth();
    
    const handleNewsletterToggle = async (e) => {
        e.stopPropagation();
        if (isUpdatingNewsletter) return;
        
        setIsUpdatingNewsletter(true);
        try {
            await toggleNewsletterOptIn();
        } catch (error) {
            console.error("Failed to toggle newsletter:", error);
        } finally {
            setIsUpdatingNewsletter(false);
        }
    };

  return (
    <nav className = 'sticky z-50 top-0 w-full  bg-black backdrop-blur-md'>
        <div className = 'mx-auto flex h-16 max-w-7xl items-center justify-between px-6'>
            <div className = 'flex items-center gap-4'>
                <button className = 'text-gray-400 hover:text-white md:hidden'>
                    <Menu size = {24}/>
                </button>

                <div className = 'font-serif text-xl font-bold tracking-tighter text-white'>
                    The AI Intel
                </div>
            </div>

            <div className='hidden md:flex gap-8 text-sm font-medium text-gray-400'>
                <Link 
                    to="/" 
                    className={`transition hover:text-white ${location.pathname === '/' ? 'text-white' : ''}`}
                >
                    Daily
                </Link>
                <Link 
                    to="/weekly" 
                    className={`transition hover:text-white ${location.pathname === '/weekly' ? 'text-white' : ''}`}
                >
                    Weekly
                </Link>
                
                <Link 
                  to={deepDiveId ? `/article/${deepDiveId}` : '/'} 
                  className={`transition hover:text-white ${location.pathname.startsWith('/article/') ? 'text-white' : ''}`}
                >
                  Deep Dives
                </Link>
                
                <Link 
                  to="/archive" 
                  className={`transition hover:text-white ${location.pathname === '/archive' ? 'text-white' : ''}`}
                >
                  Archive
                </Link>
            </div>

            <div className = 'flex items-center gap-4'>
                <button className = 'text-gray-400 hover:text-white'>
                    <Search size = {20}/>
                </button>

                {user? (
                <div className='relative'>
                    <button onClick = {() => setDropdownOpen(!isDropdownOpen)} 
                    className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-xs font-bold text-white ring-2 ring-black transition hover:ring-white/20'>
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                    </button>

                    {isDropdownOpen && (
                        <div className='absolute right-0 mt-2 w-48 origin-top-right rounded-md border border-white/10 bg-[#111] py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
                            <div className='px-4 py-2 text-xs text-gray-500'> Signed in as <br/> <span className='text-white font-bold'>{user.name || 'User'}</span></div>
                            <hr className='border-white/10' />
                            <Link to="/activity" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                                <Activity size={14} className="mr-2"/> Activity
                            </Link>
                            <Link to="/saved" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                                <Bookmark size={14} className="mr-2"/> Saved
                            </Link>
                            <hr className="border-white/10 my-1"/>
                            
                            
                            <div className="flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer" onClick={handleNewsletterToggle}>
                                <div className="flex items-center text-sm text-gray-300">
                                    <Mail size={14} className="mr-2 text-gray-400" />
                                    Weekly Briefing
                                </div>
                                
                                <button 
                                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-300 focus:outline-none ${user.newsletterOptIn ? 'bg-blue-500' : 'bg-gray-600'} ${isUpdatingNewsletter ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span 
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-300 ${user.newsletterOptIn ? 'translate-x-4' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>

                            <hr className="border-white/10 my-1"/>
                            <button 
                                onClick={logout}
                                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5"
                            >
                                <LogOut size={14} className="mr-2"/> Sign out
                            </button>
                        </div>
                    )}
                </div>
                ):(
                    <button 
                        onClick={openAuthModal}
                        className='rounded-sm bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-gray-200'
                    >
                        Sign In
                    </button>
                )}
            </div>
        </div>
    </nav>
  )
}

export default Navbar
