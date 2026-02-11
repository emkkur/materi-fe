# Materi Document Editor

A minimal, working document editor with live pagination and persistent storage. Built as part of the Materi Founding Engineer Case Study.

## 1. Tech Stack

* **Frontend**: React, TypeScript, Vite, Tailwind CSS.
* **Editor Framework**: Slate.js (`slate`, `slate-react`, `slate-history`).

## 2. Prerequisites

* **Bun**: Recommended for the frontend (or `npm`/`yarn`).

## 3. Setup and Run Commands

Provide the following commands to reliably start the demo on a clean machine:


### Frontend Setup

```bash
cd materi-fe
bun install
bun dev

```

*The application will be accessible at `http://localhost:5173`.*


## 4. Pagination Strategy

Instead of relying on CSS print-only pagination, this editor uses a deterministic measurement engine:

* **Live Measurement**: The `usePagination` hook calculates the height of DOM nodes in real-time.
* **Fixed Page Size**: Content is rendered into A4 portrait containers ( px at 96 DPI).
* **Dynamic Reflow**: When text exceeds the page height, the layout engine binary-searches for the exact split point and moves overflowing nodes to the next page.
* **Page Numbering**: "Page X of N" indicators are rendered at the bottom of every page.