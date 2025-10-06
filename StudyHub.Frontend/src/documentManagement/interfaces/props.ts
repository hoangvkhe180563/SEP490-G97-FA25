import type { Document } from './document';

export interface DocumentItemProps {
  document: Document;
  idx: number;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
}