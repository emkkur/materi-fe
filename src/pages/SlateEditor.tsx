import React, { useCallback, useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { createEditor, Editor, Transforms, type BaseEditor, type Descendant } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';

// Define custom types
export type ParagraphElement = { type: 'paragraph'; children: CustomText[] };
export type PageElement = { type: 'page'; children: ParagraphElement[] };
export type CustomElement = ParagraphElement | PageElement;
export type CustomText = { text: string; bold?: boolean };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface SlateEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

export interface SlateEditorRef {
  undo: () => void;
  redo: () => void;
}

const PAGE_HEIGHT = 1056; // 11 inches at 96 DPI
const PAGE_MARGIN = 50;

const SlateEditor = forwardRef<SlateEditorRef, SlateEditorProps>(({ initialContent, onChange }, ref) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  
  // Clean initial state handling
  const [value, setValue] = useState<Descendant[]>(() => {
    try {
      const parsed = JSON.parse(initialContent);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      // Fallback for plain text or empty content
    }
    return [
      {
        type: 'page',
        children: [
          {
            type: 'paragraph',
            children: [{ text: initialContent || '' }],
          },
        ],
      },
    ];
  });

  // Track page refs for measurement
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Expose undo/redo to parent
  useImperativeHandle(ref, () => ({
    undo: () => {
      editor.undo();
    },
    redo: () => {
      editor.redo();
    }
  }));

  const renderElement = useCallback((props: any) => {
    switch (props.element.type) {
      case 'page':
        const pagePath = ReactEditor.findPath(editor, props.element);
        const pageIndex = pagePath[0];
        
        return <PageElement {...props} pageIndex={pageIndex} ref={(el: HTMLDivElement) => {
            try {
                // Safely assign ref, handling potential race conditions where node isn't found
                if (pageRefs.current) {
                    pageRefs.current[pageIndex] = el;
                }
            } catch (e) {
                // Node might be unmounting or not yet in editor
            }
        }} />;
      case 'paragraph':
        return <p {...props.attributes} className="mb-2 min-h-[1.2em]">{props.children}</p>;
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, [editor]);

  const renderLeaf = useCallback((props: any) => {
    return <span {...props.attributes} style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}>{props.children}</span>;
  }, []);

  const handleChange = (newValue: Descendant[]) => {
    setValue(newValue);
    onChange(JSON.stringify(newValue));
  };

  // Pagination Logic
  useEffect(() => {
    if (!editor) return;

    // Use a timeout to allow the render to complete and paint before measuring
    const timeoutId = setTimeout(() => {
      Editor.withoutNormalizing(editor, () => {
        const pages = editor.children;
        if (!pages) return;

        for (let i = 0; i < pages.length; i++) {
          const pageNode = pages[i];
          const pagePath = [i];
          
          try {
            const domNode = ReactEditor.toDOMNode(editor, pageNode);
            
            if (domNode.scrollHeight > PAGE_HEIGHT) {
              if (!('type' in pageNode) || pageNode.type !== 'page') continue;

              const childrenCount = pageNode.children.length;
              
              if (childrenCount > 0) {
                // Prevent infinite loop: If there's only one child and it overflows,
                // we can't move it to the next page because it will likely overflow there too.
                // For now, we allow it to overflow the current page.
                if (childrenCount < 2) return;

                const lastChildPath = [...pagePath, childrenCount - 1];
                const hasNextPage = i + 1 < pages.length;
                
                if (hasNextPage) {
                  Transforms.moveNodes(editor, {
                    at: lastChildPath,
                    to: [i + 1, 0]
                  });
                } else {
                  const newPage: PageElement = {
                    type: 'page',
                    children: []
                  };
                  Transforms.insertNodes(editor, newPage, { at: [i + 1] });
                  Transforms.moveNodes(editor, {
                    at: lastChildPath,
                    to: [i + 1, 0]
                  });
                }
                return; // Handle one overflow per cycle
              }
            }
          } catch (e) {
            continue;
          }
        }
      });
    }, 10); // Small delay to unblock thread

    return () => clearTimeout(timeoutId);
  }, [value, editor]);

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen py-8">
      <Slate editor={editor} 
             initialValue={value} 
             onChange={handleChange}
      >
        <Editable 
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          className="outline-none text-gray-900"
          spellCheck={false}
        />
      </Slate>
    </div>
  );
});

// ForwardRef is needed for the PageElement to expose its DOM node
const PageElement = React.forwardRef(({ attributes, children, pageIndex }: any, ref: React.Ref<HTMLDivElement>) => {
  // Merge Slate's ref (from attributes) with our forwarded ref
  const setRef = useCallback((el: HTMLDivElement | null) => {
    // Handle Slate's ref
    if (attributes.ref) {
      if (typeof attributes.ref === 'function') {
        attributes.ref(el);
      } else {
        attributes.ref.current = el;
      }
    }
    
    // Handle forwarded ref
    if (ref) {
      if (typeof ref === 'function') {
        ref(el);
      } else {
        (ref as any).current = el;
      }
    }
  }, [attributes.ref, ref]);

  return (
    <div 
      {...attributes} 
      ref={setRef}
      className="bg-white shadow-lg mx-auto mb-8 relative group"
      style={{
        width: '816px',
        minHeight: `${PAGE_HEIGHT}px`,
        padding: `${PAGE_MARGIN}px`,
        boxSizing: 'border-box'
      }}
    >
      {children}
      
      {/* Page number */}
      <div 
        contentEditable={false} 
        className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400 select-none"
      >
        Page {pageIndex + 1}
      </div>
    </div>
  );
});

export default SlateEditor;
