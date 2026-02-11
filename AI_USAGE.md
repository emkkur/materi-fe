# AI Orchestration & Methodology

This document provides transparency into the AI tools, agents, and methodologies used to develop the Materi Document Editor within the 24-hour assignment window.

## 1. AI Tools and Agents

We utilized a multi-layered AI approach to handle architectural planning, frontend complexity, and backend reliability:

* **Gemini (Core Model)**: Acted as the primary architect for high-level strategy, "Dual-Layer" rendering concepts, and solving complex CSS/UX synchronization issues.
* **Custom "Materi Helper" Gem**: A specialized Gemini instance configured with specific system instructions to prioritize React/FastAPI best practices and ensure all solutions aligned with the "Founding Engineer" technical standards.
* **Antigravity (IDE & Orchestration)**: The primary development environment used to manage parallel workflows. Its "Mission Control" was used to deploy background agents for concurrent task execution.
* **Claude (via Antigravity)**: Integrated within the Antigravity environment to handle specific refactoring sessions, particularly the migration from basic textareas to a robust Slate.js implementation.

## 2. Key Tasks and Prompts

### Architectural Scaffolding

* **Prompt**: "I have a take home assignment for a job, can you make a PoA based on this case study".
* **Result**: Generated a 5-phase Plan of Action prioritizing the layout engine and deterministic measurement over non-essential features.

### Pagination & Layout Engine

* **Task**: Implementing a deterministic reflow algorithm that doesn't rely on CSS print logic.
* **Prompt**: "We've solved the navigating between pages problem, but dragging the mouse to select multiple textarea components do not work. What do you think is the best way to do multi-page selection...".
* **Solution**: Collaborated with Gemini to move from a "Shadow Overlay" textarea to a full Slate.js nested document model to support native-feeling multi-page selection.

### Backend Persistence & CRUD

* **Task**: Scaffolding a FastAPI backend with local JSON persistence.
* **Logic**: Agents in Antigravity generated the `DocumentService` singleton and the Pydantic models required to ensure the state remained the "Source of Truth".

## 3. Verification and Transparency

To ensure the AI-generated code met the Materi acceptance criteria, we performed the following:

* **Manual Review**: Every pagination transformation (splits and moves) was manually verified in the Antigravity integrated browser to ensure no "layout thrashing" occurred.
* **State Integrity**: Verified that JSON states serialized by the frontend were correctly re-hydrated by the backend, ensuring identical layouts upon hard refresh.
* 
**Chat Logs**: Full conversational transcripts are available in the repository as `GEMINI_EXPORT.md` and `CHAT_EXPORT.md`.