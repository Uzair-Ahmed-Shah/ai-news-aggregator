import React from 'react'
import DailyPage from './components/DailyPage';
import DeepDive from './components/DeepDive';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  

  return (
    <BrowserRouter>
    <div className='min-h-screen bg-slate-700'>
     <Routes>
        <Route path="/" element={<DailyPage />} />
        <Route path="/article/:id" element={<DeepDive />} />
     </Routes>
    </div>
    </BrowserRouter>
  )
}

export default App
