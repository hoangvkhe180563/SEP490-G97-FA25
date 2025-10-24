import type { Document } from "./forums";

export interface DocumentItemProps {
  document: Document;
  idx: number;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
}
