import { useState, useEffect, type FC, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { createDocument, getDocument, updateDocument, type DocumentCreate, type DocumentUpdate } from '../api';
import { useToast } from '../components/ToastContext';
import Button from '../components/Button';

// Centralised layout constants [cite: 19, 32]
const PAGE_WIDTH_PX = 794; 
const PAGE_HEIGHT_PX = 1123;
const MARGIN_PX = 50;
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - (MARGIN_PX * 2);
const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - (MARGIN_PX * 2);

const Document: FC = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [title, setTitle] = useState('Untitled Document');
  const [content, setContent] = useState('');
  const [originalTitle, setOriginalTitle] = useState('Untitled Document');
  const [originalContent, setOriginalContent] = useState('');
  const [pages, setPages] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  
  const measureRef = useRef<HTMLDivElement>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Load document on mount or ID change
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
          console.error("Failed to load document", error);
          showToast("Failed to load document. Check console for details.", 'error');
        } finally {
          setLoading(false);
        }
      } else {
        // Reset for new document
        setTitle('Untitled Document');
        setContent('');
        setOriginalTitle('Untitled Document');
        setOriginalContent('');
      }
    };
    loadDoc();
  }, [documentId, showToast]);

  // Pagination logic: Dynamic measurement
  useEffect(() => {
    if (!measureRef.current) return;

    const measureTextHeight = (text: string): number => {
        if (!measureRef.current) return 0;
        measureRef.current.innerText = text;
        // Append a zero-width space to force height calculation for trailing newlines if needed,
        // but innerText usually handles newlines. ScrollHeight is reliable.
        return measureRef.current.scrollHeight;
    };

    const findSplitIndex = (text: string): number => {
        // Optimization: check if whole text fits
        if (measureTextHeight(text) <= CONTENT_HEIGHT_PX) {
            return text.length;
        }

        // Binary search for max fit
        let low = 0;
        let high = text.length;
        let best = 0;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            // We want to correct binary search to find the boundary
            // where text[0..mid] fits, but text[0..mid+1] doesn't (conceptually)
            
            // Try mid
            const sub = text.slice(0, mid);
            if (measureTextHeight(sub) <= CONTENT_HEIGHT_PX) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        // Backtrack to last whitespace to avoid splitting words
        // Only backtrack if we are not at end (which we aren't, because of the first check)
        if (best < text.length) {
            let spaceIndex = best;
            // Backtrack carefully
            while (spaceIndex > 0 && !/\s/.test(text[spaceIndex])) {
                spaceIndex--;
            }
            // If we found a space and didn't backtrack the whole way (giant word)
            if (spaceIndex > 0) {
                return spaceIndex + 1; // Include the space on the current page? 
                // Usually nicer to leave space at end of line.
            }
        }
        
        return best;
    };

    const paginate = () => {
        const newPages: string[] = [];
        let remaining = content;
        
        // Safety break to prevent infinite loops if something goes wrong
        let iterations = 0;
        const MAX_PAGES = 1000; 

        while (remaining.length > 0 && iterations < MAX_PAGES) {
            const split = findSplitIndex(remaining);
            if (split === 0) {
                // Should not happen if logic is correct, but prevents infinite loop
                // Force split at 1 char if stuck
                newPages.push(remaining.slice(0, 1));
                remaining = remaining.slice(1);
            } else {
                newPages.push(remaining.slice(0, split));
                remaining = remaining.slice(split);
            }
            iterations++;
        }
        
        if (newPages.length === 0) newPages.push('');
        setPages(newPages);
    };

    // Debounce or just run? For now, just run.
    paginate();

  }, [content]);

  // Handle keyboard navigation between pages
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    // Only navigate if cursor is not a selection range
    if (selectionStart !== selectionEnd) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      // Check if we are at the end of the current page content
      if (selectionStart === value.length) {
        // Move to next page if it exists
        if (index < pages.length - 1) {
          e.preventDefault();
          const nextPageTextarea = textareaRefs.current[index + 1];
          if (nextPageTextarea) {
            nextPageTextarea.focus();
            nextPageTextarea.setSelectionRange(0, 0);
          }
        }
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      // Check if we are at the start of the current page content
      if (selectionStart === 0) {
        // Move to previous page if it exists
        if (index > 0) {
          e.preventDefault();
          const prevPageTextarea = textareaRefs.current[index - 1];
          if (prevPageTextarea) {
            prevPageTextarea.focus();
            const length = prevPageTextarea.value.length;
            prevPageTextarea.setSelectionRange(length, length);
          }
        }
      }
    }
  };

  const handlePageEdit = (pageIndex: number, newPageText: string) => {
    // Reconstruct content based on CURRENT page boundaries
    let prefix = '';
    for (let i = 0; i < pageIndex; i++) {
        prefix += pages[i];
    }
    
    // We replace the current page's content, but we need to know what the REST of the content was.
    // The current page[pageIndex] corresponds to a slice of the OLD content.
    // We can just calculate the suffix start index.
    
    // Suffix starts after the current page's old content.
    const currentOldLength = pages[pageIndex].length;
    const suffixStart = prefix.length + currentOldLength;
    const suffix = content.slice(suffixStart);
    
    setContent(prefix + newPageText + suffix);
  };

  const isNew = !documentId || documentId === 'new';
  const isDirty = isNew 
    ? (title.trim().length > 0 || content.trim().length > 0) // New doc: enable if *anything* is typed (whitespace allowed per user req, actually user said "can be whitespace", so just length check)
    : (title !== originalTitle || content !== originalContent); // Existing: enable if changed

  const handleSave = async () => {
    try {
      if (documentId && documentId !== 'new') {
        const update: DocumentUpdate = { title, content };
        await updateDocument(documentId, update);
        setOriginalTitle(title);
        setOriginalContent(content);
        showToast('Saved!', 'success');
      } else {
        const create: DocumentCreate = { title, content };
        const newDoc = await createDocument(create);
        navigate(`/document/${newDoc.id}`, { replace: true }); // Use replace to avoid back button issues? or just navigate.
        // After navigate, the effect will run and load the doc, setting original state. 
        // But for perceived speed, we can set it here too if we didn't navigate. 
        // Actually navigate causes unmount/remount usually or at least effect trigger.
        showToast('Document created!', 'success');
      }
    } catch (error) {
      console.error("Failed to save", error);
      showToast("Failed to save.", 'error');
    }
  };


  return (
    <div className="bg-gray-100 min-h-screen w-screen p-5 flex flex-col justify-center items-center">
      {/* Hidden Layout Measurement Div */}
      <div 
        ref={measureRef}
        className="invisible absolute -z-50 whitespace-pre-wrap wrap-break-word text-base leading-normal font-mono"
        style={{
            width: `${CONTENT_WIDTH_PX}px`,
        }}
      />

      {/* UI Controls [cite: 43] */}
      <header className="mb-5 flex gap-2.5 items-center justify-between" style={{ width: `${PAGE_WIDTH_PX}px` }}>
        <Button 
            onClick={() => navigate('/')} 
            variant='secondary'
        >
            Back to Home
        </Button>
        <div className="flex gap-2.5 items-center">
          <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 w-[200px] font-bold border border-gray-300 rounded"
              placeholder="Document Title"
          />
          <Button 
              onClick={handleSave} 
              disabled={loading || !isDirty}
              variant='primary'
              title={!isDirty ? "No changes to save" : ""}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Page Containers [cite: 28, 33] */}
      <main className="flex flex-col items-center gap-5">
        {loading && <p className="text-gray-500">Loading content...</p>}
        {!loading && pages.map((pageText, index) => (
          <div 
            key={index} 
            className="bg-white shadow-md relative flex flex-col"
            style={{
              width: `${PAGE_WIDTH_PX}px`,
              height: `${PAGE_HEIGHT_PX}px`,
              padding: `${MARGIN_PX}px`,
            }}
          >
            <textarea
              ref={(el) => { textareaRefs.current[index] = el; }}
              value={pageText}
              onChange={(e) => handlePageEdit(index, e.target.value)} // Live editing [cite: 7, 35]
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-full h-full border-none resize-none outline-none text-base leading-normal font-mono p-0 overflow-hidden"
            />
            {/* Live page numbers  */}
            <div className="absolute bottom-2.5 w-full text-center left-0 text-gray-400 text-sm pointer-events-none">
              Page {index + 1} of {pages.length}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Document;