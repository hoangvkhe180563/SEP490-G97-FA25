// // src/forumManagement/hooks/useForumFilters.ts
// import { useState, useEffect, useCallback } from "react";
// import { useSearchParams, useLocation } from "react-router-dom";
// import type { ForumFilters } from "../interfaces/filter";

// export const useForumFilters = () => {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const location = useLocation();

//   const getInitialState = (): ForumFilters => {
//     const saved = sessionStorage.getItem("forumMainState");
//     if (saved && location.state?.fromModal) {
//       return JSON.parse(saved);
//     }
//     return {
//       searchQuery: searchParams.get("q") || "",
//       selectedSubjects: searchParams.get("subjects")
//         ? searchParams.get("subjects")!.split(",").map(Number)
//         : [],
//       selectedFlairs: searchParams.get("flairs")
//         ? searchParams.get("flairs")!.split(",").map(Number)
//         : [],
//       sortBy: searchParams.get("sort") || "newest",
//       visiblePosts: 10,
//       scrollPosition: 0,
//     };
//   };

//   const [filters, setFilters] = useState<ForumFilters>(getInitialState());

//   useEffect(() => {
//     const state = {
//       ...filters,
//       scrollPosition: window.scrollY,
//     };
//     sessionStorage.setItem("forumMainState", JSON.stringify(state));
//   }, [filters]);

//   useEffect(() => {
//     const initialState = getInitialState();
//     if (location.state?.fromModal && initialState.scrollPosition) {
//       window.scrollTo(0, initialState.scrollPosition);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [location.state?.fromModal]);

//   useEffect(() => {
//     const newSearchParams = new URLSearchParams();
//     if (filters.searchQuery) newSearchParams.set("q", filters.searchQuery);
//     if (filters.selectedSubjects.length > 0)
//       newSearchParams.set("subjects", filters.selectedSubjects.join(","));
//     if (filters.selectedFlairs.length > 0)
//       newSearchParams.set("flairs", filters.selectedFlairs.join(","));
//     if (filters.sortBy !== "newest")
//       newSearchParams.set("sort", filters.sortBy);

//     setSearchParams(newSearchParams, { replace: true });
//   }, [
//     filters.searchQuery,
//     filters.selectedSubjects,
//     filters.selectedFlairs,
//     filters.sortBy,
//     setSearchParams,
//   ]);

//   const handleSearchChange = useCallback((value: string) => {
//     setFilters((prev) => ({ ...prev, searchQuery: value }));
//   }, []);

//   const toggleSubject = useCallback((subjectId: number) => {
//     setFilters((prev) => ({
//       ...prev,
//       selectedSubjects: prev.selectedSubjects.includes(subjectId)
//         ? prev.selectedSubjects.filter((s) => s !== subjectId)
//         : [...prev.selectedSubjects, subjectId],
//     }));
//   }, []);

//   const toggleFlair = useCallback((flairId: number) => {
//     setFilters((prev) => ({
//       ...prev,
//       selectedFlairs: prev.selectedFlairs.includes(flairId)
//         ? prev.selectedFlairs.filter((f) => f !== flairId)
//         : [...prev.selectedFlairs, flairId],
//     }));
//   }, []);

//   const handleSortChange = useCallback((value: string) => {
//     setFilters((prev) => ({ ...prev, sortBy: value }));
//   }, []);

//   const handleClearFilters = useCallback(() => {
//     setFilters({
//       searchQuery: "",
//       selectedSubjects: [],
//       selectedFlairs: [],
//       sortBy: "newest",
//       visiblePosts: 10,
//       scrollPosition: 0,
//     });
//   }, []);

//   const handleLoadMore = useCallback((maxPosts: number) => {
//     setFilters((prev) => ({
//       ...prev,
//       visiblePosts: Math.min(prev.visiblePosts + 5, maxPosts),
//     }));
//   }, []);

//   const resetVisiblePosts = useCallback(() => {
//     setFilters((prev) => ({ ...prev, visiblePosts: 10 }));
//   }, []);

//   return {
//     filters,
//     handleSearchChange,
//     toggleSubject,
//     toggleFlair,
//     handleSortChange,
//     handleClearFilters,
//     handleLoadMore,
//     resetVisiblePosts,
//   };
// };
