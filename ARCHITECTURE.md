ARCHITECTURE.md: Materi Document Editor
This document outlines the architectural decisions, data models, and algorithms implemented for the Materi Document Editor, focusing on deterministic pagination and state-driven rendering.

1. Editor State Model
We utilize Slate.js as the core editor framework to manage the document state.

Schema: The document is modeled as a nested JSON tree structure: Editor -> Page -> Paragraph -> Text.

State as Source of Truth: Unlike a standard HTML contenteditable or textarea, Slate maintains an internal immutable state. This ensures that the document structure is preserved exactly as intended across saves and loads, proving the state is a true source of truth rather than an incidental DOM snapshot.
+1

History: We integrated the slate-history plugin to provide reliable, deterministic Undo/Redo functionality within the state model.

2. Pagination Algorithm
The hardest constraint of this task is live, deterministic pagination. We implemented a DOM-measurement-based layout engine within the usePagination hook.
+2

Measurement Approach: As the user types, the engine monitors the scrollHeight of each page container against the centralized PAGE_HEIGHT constant (1056px at 96 DPI).

Split Point Discovery: When a page overflows, the engine targets the last paragraph node. It uses a TreeWalker to cache text nodes and a document.createRange object to binary-search for the exact character index that crosses the page boundary.

Reflow & Move:

Split: The algorithm performs a Transforms.splitNodes at the discovered character offset to break the paragraph into two.

Move: The overflowing node is then moved to the start of the next page using Transforms.moveNodes.

Creation: If no subsequent page exists, a new PageElement is inserted into the Slate tree.


Determinism: By using fixed pixel constants and standardizing font metrics, the engine ensures that the same content always breaks at the same point regardless of the editing session.
+2

3. Persistence Flow
The application implements a clear separation between the frontend state and the backend persistence layer.
+1

Client-to-Server: On "Save," the frontend serializes the Slate JSON tree into a string and sends it via an Axios PATCH or POST request to the FastAPI backend.

Backend Storage: The FastAPI service utilizes a JSON-file-based persistence strategy.

Incoming documents are validated using Pydantic models (DocumentCreate, DocumentUpdate).

The DocumentService maintains an in-memory dictionary for performance and flushes the state to data.json on every write operation to ensure data survives server restarts.

4. Layout Constants
All layout metrics are centralized in src/constants.ts to ensure consistency between the measurement logic and the CSS rendering:
+1

Page Width: 816px (8.5 inches @ 96 DPI).

Page Height: 1056px (11 inches @ 96 DPI).

Margins: 50px.

Line Height: 1.5.