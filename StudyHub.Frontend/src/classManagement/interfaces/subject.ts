
export interface Subject {
  id: number;
  name: string;
}

export interface GetSubjectsResponse {
  success: boolean;
  subjects: Subject[];
  message: string;
}