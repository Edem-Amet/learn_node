import HomePage from './pages/HomePage';
import { Routes, Route } from 'react-router';

import './App.css'

function App() {

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="checkout" element={<div>test page</div>} />
    </Routes>
  )
}

export default App
