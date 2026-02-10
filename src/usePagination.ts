import { useEffect } from 'react';
import { Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { PAGE_HEIGHT } from './constants';
import type { PageElement } from './pages/SlateEditor';

export const usePagination = (editor: Editor, value: any) => {
  useEffect(() => {
    if (!editor) return;

    const timeoutId = setTimeout(() => {
      Editor.withoutNormalizing(editor, () => {
        const pages = editor.children;
        if (!pages) return;

        for (let i = 0; i < pages.length; i++) {
          const pageNode = pages[i];
          const pagePath = [i];
          
          try {
            const domNode = ReactEditor.toDOMNode(editor as ReactEditor, pageNode);
            
            if (domNode.scrollHeight > PAGE_HEIGHT) {
              if (!('type' in pageNode) || pageNode.type !== 'page') continue;

              const childrenCount = pageNode.children.length;
              
              if (childrenCount > 1) {
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
                return;
              }
            }
          } catch (e) {
            continue;
          }
        }
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [value, editor]);
};
