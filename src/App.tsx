import { Routes, Route } from 'react-router';
import Home from './pages/Home';
import Document from './pages/Document';
import { ToastProvider } from './components/ToastContext';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/document" element={<Document />} />
        <Route path="/document/:documentId" element={<Document />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;

