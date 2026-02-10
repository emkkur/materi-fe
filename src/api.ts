import axios from 'axios';

// --- Interfaces mirroring Backend Pydantic Models ---

export interface DocumentBase {
  title: string;
  content: string;
}

export type DocumentCreate = DocumentBase;

export interface DocumentUpdate {
  title?: string;
  content?: string;
}

export interface DocumentResponse extends DocumentBase {
  id: string; // UUIDs are strings in JSON
  created_at: string; // Datetime strings
  updated_at: string; // Datetime strings
}

// --- Axios Instance ---

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- API Methods ---

export const createDocument = async (document: DocumentCreate): Promise<DocumentResponse> => {
  const response = await api.post<DocumentResponse>('/document', document);
  return response.data;
};

export const listDocuments = async (): Promise<DocumentResponse[]> => {
  const response = await api.get<DocumentResponse[]>('/documents');
  return response.data;
};

export const getDocument = async (id: string): Promise<DocumentResponse> => {
  const response = await api.get<DocumentResponse>(`/document/${id}`);
  return response.data;
};

export const updateDocument = async (id: string, document: DocumentUpdate): Promise<DocumentResponse> => {
  const response = await api.patch<DocumentResponse>(`/document/${id}`, document);
  return response.data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/document/${id}`);
};

export default api;
