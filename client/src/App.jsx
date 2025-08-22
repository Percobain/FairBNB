import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import HomePage from './components/HomePage'
import LandingPage from './components/LandingPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neo-white font-neo">
        {/* Navigation Toggle */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <Link 
            to="/" 
            className="bg-neo-yellow text-neo-black px-4 py-2 rounded-neo font-bold border-2 border-neo-black shadow-neo hover:bg-neo-orange transition-colors"
          >
            Homepage
          </Link>
          <Link 
            to="/landing" 
            className="bg-neo-purple text-neo-white px-4 py-2 rounded-neo font-bold border-2 border-neo-black shadow-neo hover:bg-purple-600 transition-colors"
          >
            Landing Page
          </Link>
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/landing" element={<LandingPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
