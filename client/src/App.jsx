import React from 'react'
import DailyPage from './components/DailyPage';
import { BrowserRouter } from 'react-router-dom';

function App() {
  

  return (
    <BrowserRouter>
    <div className='min-h-screen bg-slate-700'>
     <DailyPage />
    </div>
    </BrowserRouter>
  )
}

export default App
