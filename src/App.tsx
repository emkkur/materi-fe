import { Routes, Route } from 'react-router';
import Home from './pages/Home';
import Document from './pages/Document';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/document/:documentId" element={<Document />} />
    </Routes>
  );
}

export default App;

