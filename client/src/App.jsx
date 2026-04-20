import React from 'react'
import DailyPage from './components/DailyPage';
import DeepDive from './components/DeepDive';
import WeeklyPage from './components/WeeklyPage';
import AuthModal from './components/AuthModal';
import Archive from './components/Archive';
import ArchiveDetail from './components/ArchiveDetail';
import ActivityPage from './pages/ActivityPage';
import SavedPage from './pages/SavedPage';
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
        <Route path="/archive/:id" element={<ArchiveDetail/>} />
        <Route path="/activity" element={<ActivityPage/>} />
        <Route path="/saved" element={<SavedPage/>} />
     </Routes>
    </div>
    </BrowserRouter>
    </AuthProvider>
  )
}

export default App
