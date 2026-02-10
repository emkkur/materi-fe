import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router';
import { listDocuments, deleteDocument, type DocumentResponse } from '../api';
import Button from '../components/Button';
import { useToast } from '../components/ToastContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const Home: FC = () => {

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentResponse | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await listDocuments();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      showToast("Failed to fetch documents", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Requirement: Load documents via a simple backend API [cite: 29]
  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateNew = () => {
    navigate('/document');
  };

  const handleSelectDocument = (id: string) => {
    navigate(`/document/${id}`);
  };

  const handleDeleteClick = (doc: DocumentResponse) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!documentToDelete) return;
    
    try {
      setLoading(true);
      await deleteDocument(documentToDelete.id);
      showToast('Document deleted', 'success');
      await fetchDocuments();
    } catch (error) {
      showToast('Failed to delete document', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="font-sans bg-white w-screen h-screen px-2 py-2">
      <header className="flex justify-center items-center border-b border-gray-200 pb-5 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Materi Documents Editor</h1>
        {/* Requirement: Button to create documents [cite: 45] */}
        
      </header>

      <section>

        <div className="flex justify-start items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-gray-700">Your Documents</h2>
          <button 
            onClick={handleCreateNew} 
            className="bg-blue-600 text-white px-5 py-2.5 rounded hover:bg-blue-700 font-bold transition-colors shadow-sm"
          >
            + New Document
          </button>
        </div>
        {loading ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-600 mb-4">No documents found.</p> 
            <button onClick={handleCreateNew} className="text-blue-600 hover:underline cursor-pointer">Create one to get started.</button>
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
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleSelectDocument(doc.id)}>
                    <td className="p-4 text-gray-800 font-medium">{doc.title || 'Untitled Document'}</td>
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(doc.updated_at).toLocaleDateString()} <span className="text-gray-400 mx-1">•</span> {new Date(doc.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 flex gap-2">
                      <Button 
                        onClick={(e) => {e.stopPropagation(); handleDeleteClick(doc)}} 
                        variant="secondary"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirmed}
        title={documentToDelete?.title || 'Untitled Document'}
        loading={loading}
      />
    </div>
  );
};

export default Home;