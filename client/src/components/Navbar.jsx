import React, {useState} from 'react'
import { Menu, Search, User, LogOut, Bookmark, Activity } from 'lucide-react';

const Navbar = () => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const user = {name : 'Uzair', avatar : null}

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

            <div className = 'hidden md:flex gap-8 text-sm font-medium text-gray-400'>
                <a href="#" className="text-white transition hover:text-gray-300">Daily</a>
                <a href="#" className="transition hover:text-white">Weekly</a>
                <a href="#" className="transition hover:text-white">Deep Dives</a>
                <a href="#" className="transition hover:text-white">Archive</a>
            </div>

            <div className = 'flex items-center gap-4'>
                <button className = 'text-gray-400 hover:text-white'>
                    <Search size = {20}/>
                </button>

                {user? (
                <div className='relative'>
                    <button onClick = {() => setDropdownOpen(!isDropdownOpen)} 
                    className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-xs font-bold text-white ring-2 ring-black transition hover:ring-white/20'>
                        {user.name[0]}
                    </button>

                    {isDropdownOpen && (
                        <div className='absolute right-0 mt-2 w-48 origin-top-right rounded-md border border-white/10 bg-[#111] py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
                            <div className='px-4 py-2 text-xs text-gray-500'> Signed in as <br/> <span className='text-white font-bold'>{user.name}</span></div>
                            <hr className='border-white/10' />
                            <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                                <Activity size={14} className="mr-2"/> Activity
                            </a>
                            <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                                <Bookmark size={14} className="mr-2"/> Saved
                            </a>
                            <hr className="border-white/10"/>
                            <button className="flex w-full items-center px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5">
                                <LogOut size={14} className="mr-2"/> Sign out
                            </button>
                        </div>
                    )}
                </div>
                ):(
                    <button className='rounded-sm bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-gray-200'>
                        Sign In
                    </button>
                )}
            </div>
        </div>
    </nav>
  )
}

export default Navbar
