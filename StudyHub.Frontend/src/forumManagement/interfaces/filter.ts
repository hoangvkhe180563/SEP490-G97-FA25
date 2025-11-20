// src/forumManagement/interfaces/filter.ts
export interface ForumFilters {
  searchQuery: string;
  selectedSubjects: number[];
  selectedFlairs: number[];
  sortBy: string;
  visiblePosts: number;
  scrollPosition: number;
}

export interface ImageModalState {
  isOpen: boolean;
  images: string[];
  selectedIndex: number;
  zoom: number;
}

export interface CommentFormState {
  content: string;
  images: File[];
  visibleCount: number;
}
