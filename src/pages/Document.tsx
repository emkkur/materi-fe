import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';

import BackSvg from '../assets/back.svg?react';
import Button from '../components/Button';
import { useToast } from '../components/ToastContext';
import { getDocument, updateDocument, createDocument, deleteDocument } from '../api';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

import SlateEditor, { type SlateEditorRef } from './SlateEditor';

export const Document = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [originalContent, setOriginalContent] = useState('');
  const [originalTitle, setOriginalTitle] = useState('Untitled Document');
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Ref to access Slate editor methods (undo/redo)
  const editorRef = useRef<SlateEditorRef>(null);

  // Load document
  useEffect(() => {
    const loadDoc = async () => {
      if (documentId && documentId !== 'new') {
        try {
          setLoading(true);
          const doc = await getDocument(documentId);
          setTitle(doc.title);
          setContent(doc.content);
          setOriginalTitle(doc.title);
          setOriginalContent(doc.content);
        } catch (error) {
          showToast("Failed to load document", 'error');
        } finally {
          setLoading(false);
        }
      } else {
        setTitle('Untitled Document');
        setContent(''); // Will be handled by SlateEditor's default
        setOriginalTitle('Untitled Document');
        setOriginalContent('');
      }
    };
    loadDoc();
  }, [documentId, showToast]);

  // Dirty check
  useEffect(() => {
    const isContentChanged = content !== originalContent;
    const isTitleChanged = title !== originalTitle;
    setIsDirty(isContentChanged || isTitleChanged);
  }, [content, originalContent, title, originalTitle]);

  const handleSave = async () => {
    try {
      const payload = { title, content };
      
      if (documentId && documentId !== 'new') {
        await updateDocument(documentId, payload);
      } else {
        const newDoc = await createDocument(payload);
        navigate(`/document/${newDoc.id}`, { replace: true });
      }
      setOriginalTitle(title);
      setOriginalContent(content);
      showToast('Saved!', 'success');
    } catch (error) {
      showToast("Failed to save", 'error');
    }
  };

  const undo = () => {
    if (editorRef.current) {
      editorRef.current.undo();
    }
  };

  const redo = () => {
    if (editorRef.current) {
      editorRef.current.redo();
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!documentId || documentId === 'new') return;
    
    try {
      setLoading(true);
      await deleteDocument(documentId);
      showToast('Document deleted', 'success');
      navigate('/');
    } catch (error) {
      showToast('Failed to delete document', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <Button onClick={() => navigate('/')} variant="secondary">
            <BackSvg width={20} height={20} fill='#ffffff' />
          </Button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-medium text-lg text-black px-2 py-1 rounded hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all flex-1 max-w-md"
            placeholder="Untitled Document"
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 mr-4 border-r pr-4 border-gray-100">
            <Button 
              onClick={undo} 
              variant="secondary"
              className="px-2 py-1 text-xs"
            >
              Undo
            </Button>
            <Button 
              onClick={redo} 
              variant="secondary"
              className="px-2 py-1 text-xs"
            >
              Redo
            </Button>
          </div>
          {documentId && documentId !== 'new' && (
            <Button 
              onClick={() => setShowDeleteModal(true)} 
              variant="secondary"
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
            >
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading || !isDirty} variant="primary">
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto relative">
        <div className="min-h-full py-8">
          {!loading && (
            <SlateEditor 
                key={documentId} // Force remount when switching docs
                ref={editorRef}
                initialContent={content} 
                onChange={setContent} 
            />
          )}
        </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirmed}
        title={title}
        loading={loading}
      />
    </div>
  );
};

export default Document;