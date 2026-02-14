import React from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import { BrowserRouter } from 'react-router-dom';

function App() {
  // Mock data so you can see the HeroSection in action
  const mockArticle = {
    title: "The Future of Artificial Intelligence: From Generative Models to AGI",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000&auto=format&fit=crop",
    curatorScore: 98,
    publishedAt: new Date().toISOString(),
    sourceName: "TechCrunch",
    url: "#",
    summary: "• Generative AI is rapidly evolving beyond simple text completion. • Experts predict a shift towards autonomous agents. • The impact on the global economy could reach trillions by 2030."
  };

  return (
    <BrowserRouter>
    <div className='min-h-screen bg-slate-700'>
      <Navbar/>
      <HeroSection article={mockArticle} />
    </div>
    </BrowserRouter>
  )
}

export default App
