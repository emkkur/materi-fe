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
        console.log(editor)
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
              const lastChildIndex = childrenCount - 1;
              const lastChild = pageNode.children[lastChildIndex];
              const lastChildPath = [...pagePath, lastChildIndex];

              // If the last child is a paragraph, we might need to split it
              if (lastChild.type === 'paragraph') {
                 try {
                     const domLastChild = ReactEditor.toDOMNode(editor as ReactEditor, lastChild);
                     const clientRect = domLastChild.getBoundingClientRect();
                     const pageRect = domNode.getBoundingClientRect();
                     
                     // Calculate where the split should happen relative to the paragraph
                     // The bottom of the allowed content is the page top + PAGE_HEIGHT
                     const pageBottom = pageRect.top + PAGE_HEIGHT;
                     
                     if (clientRect.bottom > pageBottom) {
                         const textContent = (lastChild.children as any[]).map(c => c.text).join('');
                         
                         // Pre-calculate text nodes and their offsets to avoid repeated TreeWalker checks
                         const textNodes: { node: Node; start: number; end: number }[] = [];
                         let currentOffset = 0;
                         const walker = document.createTreeWalker(domLastChild, NodeFilter.SHOW_TEXT);
                         while(walker.nextNode()) {
                             const node = walker.currentNode;
                             const len = node.textContent?.length || 0;
                             textNodes.push({
                                 node,
                                 start: currentOffset,
                                 end: currentOffset + len
                             });
                             currentOffset += len;
                         }

                         // Optimized helper using cached nodes
                         const getDomNodeAndOffset = (globalOffset: number) => {
                             // Binary search or simple find (since usually few text nodes)
                             // Simple finding is likely fast enough for paragraph children count, 
                             // but let's do a quick find.
                             for (const info of textNodes) {
                                 if (globalOffset >= info.start && globalOffset < info.end) {
                                     return { node: info.node, offset: globalOffset - info.start };
                                 }
                             }
                             // Edge case: exactly at the end
                             if (textNodes.length > 0 && globalOffset === currentOffset) {
                                 const last = textNodes[textNodes.length - 1];
                                 return { node: last.node, offset: last.end - last.start };
                             }
                             return null;
                         };

                         let start = 0;
                         let end = textContent.length;
                         let splitIndex = -1;
                         
                         const range = document.createRange();
                         
                         if (textNodes.length > 0) {
                             while (start <= end) {
                                 const mid = Math.floor((start + end) / 2);
                                 try {
                                     const startPoint = getDomNodeAndOffset(0);
                                     const endPoint = getDomNodeAndOffset(mid);
                                     
                                     if (startPoint && endPoint) {
                                         range.setStart(startPoint.node, startPoint.offset);
                                         range.setEnd(endPoint.node, endPoint.offset);
                                         
                                         const rects = range.getClientRects();
                                         if (rects.length > 0) {
                                             const lastRect = rects[rects.length - 1]; // Use last rect for multiline
                                             if (lastRect.bottom <= pageBottom) {
                                                 splitIndex = mid;
                                                 start = mid + 1;
                                             } else {
                                                 end = mid - 1;
                                             }
                                         } else {
                                              // No rects? maybe empty or hidden. Assume fits.
                                              start = mid + 1; 
                                         }
                                     } else {
                                         break;
                                     }
                                 } catch (e) {
                                     break;
                                 }
                             }
                         }

                         if (splitIndex !== -1 && splitIndex < textContent.length) {
                             // Find word boundary (space)
                             const lastSpace = textContent.lastIndexOf(' ', splitIndex);
                             if (lastSpace > 0) {
                                 splitIndex = lastSpace + 1;
                             }
                             
                             // Map global splitIndex back to Slate child index and offset
                             let remaining = splitIndex;
                             let childIndex = 0;
                             let splitOffset = 0;
                             
                             for (let k = 0; k < lastChild.children.length; k++) {
                                 const child = lastChild.children[k];
                                 const textLen = (child.text?.length || 0);
                                 if (remaining <= textLen) {
                                     childIndex = k;
                                     splitOffset = remaining;
                                     break;
                                 }
                                 remaining -= textLen;
                             }
                             
                             // Perform split
                             Transforms.splitNodes(editor, {
                                 at: { path: [...lastChildPath, childIndex], offset: splitOffset },
                                 height: 1 
                             });
                             
                             // Move new paragraph to next page
                             const nextParaIndex = lastChildIndex + 1;
                             const nextParaPath = [...pagePath, nextParaIndex];
                             
                             const hasNextPage = i + 1 < pages.length;
                             if (!hasNextPage) {
                                  const newPage: PageElement = { type: 'page', children: [] };
                                  Transforms.insertNodes(editor, newPage, { at: [i + 1] });
                             }
                             
                             Transforms.moveNodes(editor, {
                                 at: nextParaPath,
                                 to: [i + 1, 0]
                             });
                             
                             return; // Done
                         }
                     }
                 } catch (e) {
                     // Error
                 }
              }

              // Fallback: Default generic move logic for non-splittable or not-yet-processed items
              if (childrenCount > 1) {
                const movePath = [...pagePath, childrenCount - 1];
                const hasNextPage = i + 1 < pages.length;
                
                if (hasNextPage) {
                  Transforms.moveNodes(editor, {
                    at: movePath,
                    to: [i + 1, 0]
                  });
                } else {
                  const newPage: PageElement = {
                    type: 'page',
                    children: []
                  };
                  Transforms.insertNodes(editor, newPage, { at: [i + 1] });
                  Transforms.moveNodes(editor, {
                    at: movePath,
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
