import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router';
import { listDocuments, type DocumentResponse } from '../api';

const Home: FC = () => {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Requirement: Load documents via a simple backend API [cite: 29]
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const data = await listDocuments();
        setDocuments(data);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const handleCreateNew = () => {
    navigate('/document');
  };

  const handleSelectDocument = (id: string) => {
    navigate(`/document/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto my-10 px-5 font-sans">
      <header className="flex justify-between items-center border-b border-gray-200 pb-5 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Materi Documents</h1>
        {/* Requirement: Button to create documents [cite: 45] */}
        <button 
          onClick={handleCreateNew} 
          className="bg-blue-600 text-white px-5 py-2.5 rounded hover:bg-blue-700 font-bold transition-colors shadow-sm"
        >
          + Create New Document
        </button>
      </header>

      <section>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Your Documents</h2>
        {loading ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-600 mb-4">No documents found.</p> 
            <button onClick={handleCreateNew} className="text-blue-600 hover:underline">Create one to get started.</button>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 font-semibold text-gray-600 border-b border-gray-200">Title</th>
                  <th className="p-4 font-semibold text-gray-600 border-b border-gray-200">Last Updated</th>
                  <th className="p-4 font-semibold text-gray-600 border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800 font-medium">{doc.title || 'Untitled Document'}</td>
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(doc.updated_at).toLocaleDateString()} <span className="text-gray-400 mx-1">•</span> {new Date(doc.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      {/* Requirement: Load by ID [cite: 47] */}
                      <button 
                        onClick={() => handleSelectDocument(doc.id)} 
                        className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;