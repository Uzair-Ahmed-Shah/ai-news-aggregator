import React from 'react'
import DailyPage from './components/DailyPage';
import DeepDive from './components/DeepDive';
import WeeklyPage from './components/WeeklyPage';
import AuthModal from './components/AuthModal';
import Archive from './components/Archive';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

function App() {
  

  return (
    <AuthProvider>
    <BrowserRouter>
    <div className='min-h-screen bg-slate-700'>
     <AuthModal />
     <Routes>
        <Route path="/" element={<DailyPage />} />
        <Route path="/article/:id" element={<DeepDive />} />
        <Route path="/weekly" element={<WeeklyPage/>} />
        <Route path="/archive" element={<Archive/>} />
     </Routes>
    </div>
    </BrowserRouter>
    </AuthProvider>
  )
}

export default App
