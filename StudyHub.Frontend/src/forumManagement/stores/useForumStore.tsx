// src/forumManagement/stores/useForumStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type { HubConnection } from "@microsoft/signalr";
import { createForumFuncConnection } from "@/lib/signalR";
import type { Post } from "../interfaces/forum";

interface ForumState {
  posts: Post[];
  currentPost: Post | null;
  isForumConnected: boolean;
  isLoading: boolean;
  success: boolean;
  message: string;

  startForum: () => Promise<void>;
  stopForum: () => Promise<void>;
  joinSchoolForum: (schoolId: number) => Promise<void>;
  leaveSchoolForum: (schoolId: number) => Promise<void>;
  joinPost: (postId: number) => Promise<void>;
  leavePost: (postId: number) => Promise<void>;
  sendTyping: (postId: number, isTyping: boolean) => Promise<void>;

  getPosts: (
    schoolId: number,
    subjectId?: number,
    flairId?: number,
    query?: string,
    sortBy?: string,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<any>;
  getPostById: (postId: number) => Promise<any>;
  createPost: (formData: FormData) => Promise<any>;
  updatePost: (postId: number, formData: FormData) => Promise<any>;
  deletePost: (postId: number) => Promise<any>;

  getComments: (
    postId: number,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<any>;
  createComment: (formData: FormData) => Promise<any>;
  updateComment: (commentId: number, formData: FormData) => Promise<any>;
  deleteComment: (commentId: number) => Promise<any>;
}

export const useForumStore = create<ForumState>()(
  devtools(
    (set, get) => ({
      posts: [],
      currentPost: null,
      isForumConnected: false,
      isLoading: false,
      success: false,
      message: "",

      startForum: async () => {
        try {
          if ((window as any).__forumConn) return;
          const conn: HubConnection = createForumFuncConnection();
          (window as any).__forumConn = conn;

          conn.on("ReceiveNewPost", (dto: any) => {
            try {
              console.log("ReceiveNewPost", dto);
              set((state) => {
                const exists = state.posts.some(
                  (p) => p.post_id === dto.post_id
                );
                if (exists) return {};
                return { posts: [dto, ...state.posts] };
              });
            } catch (err) {
              console.error("ReceiveNewPost handler error", err);
            }
          });

          conn.on("PostUpdated", (dto: any) => {
            try {
              console.log("PostUpdated", dto);
              set((state) => ({
                posts: state.posts.map((p) =>
                  p.post_id === dto.post_id ? { ...p, ...dto } : p
                ),
                currentPost:
                  state.currentPost?.post_id === dto.post_id
                    ? { ...state.currentPost, ...dto }
                    : state.currentPost,
              }));
            } catch (err) {
              console.error("PostUpdated handler error", err);
            }
          });

          conn.on("PostDeleted", (postId: number) => {
            try {
              console.log("PostDeleted", postId);
              set((state) => ({
                posts: state.posts.filter((p) => p.post_id !== postId),
                currentPost:
                  state.currentPost?.post_id === postId
                    ? null
                    : state.currentPost,
              }));
            } catch (err) {
              console.error("PostDeleted handler error", err);
            }
          });

          conn.on("ReceiveNewComment", (dto: any) => {
            try {
              console.log("ReceiveNewComment", dto);
              set((state) => {
                if (
                  !state.currentPost ||
                  state.currentPost.post_id !== dto.post_id
                )
                  return {};

                const existingComments = state.currentPost.comments || [];
                const exists = existingComments.some(
                  (c) => c.comment_id === dto.comment_id
                );
                if (exists) return {};

                return {
                  currentPost: {
                    ...state.currentPost,
                    comments: [...existingComments, dto],
                    comment_count: state.currentPost.comment_count + 1,
                  },
                  posts: state.posts.map((p) =>
                    p.post_id === dto.post_id
                      ? { ...p, comment_count: p.comment_count + 1 }
                      : p
                  ),
                };
              });
            } catch (err) {
              console.error("ReceiveNewComment handler error", err);
            }
          });

          conn.on("CommentUpdated", (dto: any) => {
            try {
              console.log("CommentUpdated", dto);
              set((state) => {
                if (!state.currentPost) return {};
                return {
                  currentPost: {
                    ...state.currentPost,
                    comments: state.currentPost.comments.map((c) =>
                      c.comment_id === dto.comment_id ? { ...c, ...dto } : c
                    ),
                  },
                };
              });
            } catch (err) {
              console.error("CommentUpdated handler error", err);
            }
          });

          conn.on("CommentDeleted", (commentId: number) => {
            try {
              console.log("CommentDeleted", commentId);
              set((state) => {
                if (!state.currentPost) return {};
                return {
                  currentPost: {
                    ...state.currentPost,
                    comments: state.currentPost.comments.filter(
                      (c) => c.comment_id !== commentId
                    ),
                    comment_count: Math.max(
                      0,
                      state.currentPost.comment_count - 1
                    ),
                  },
                  posts: state.posts.map((p) =>
                    p.post_id === state.currentPost?.post_id
                      ? {
                          ...p,
                          comment_count: Math.max(0, p.comment_count - 1),
                        }
                      : p
                  ),
                };
              });
            } catch (err) {
              console.error("CommentDeleted handler error", err);
            }
          });

          conn.on("UserTyping", (payload: any) => {
            console.log("UserTyping", payload);
          });

          await conn.start();
          set({ isForumConnected: true });
        } catch (err) {
          console.error("startForum failed", err);
        }
      },

      stopForum: async () => {
        try {
          const conn: HubConnection | undefined = (window as any).__forumConn;
          if (conn) {
            await conn.stop();
            delete (window as any).__forumConn;
          }
          set({ isForumConnected: false });
        } catch (err) {
          console.error("stopForum failed", err);
        }
      },

      joinSchoolForum: async (schoolId: number) => {
        try {
          const conn: HubConnection | undefined = (window as any).__forumConn;
          if (!conn) return;
          await conn.invoke("JoinSchoolForum", schoolId);
        } catch (err) {
          console.error("joinSchoolForum failed", err);
        }
      },

      leaveSchoolForum: async (schoolId: number) => {
        try {
          const conn: HubConnection | undefined = (window as any).__forumConn;
          if (!conn) return;
          await conn.invoke("LeaveSchoolForum", schoolId);
        } catch (err) {
          console.error("leaveSchoolForum failed", err);
        }
      },

      joinPost: async (postId: number) => {
        try {
          const conn: HubConnection | undefined = (window as any).__forumConn;
          if (!conn) return;
          await conn.invoke("JoinPost", postId);
        } catch (err) {
          console.error("joinPost failed", err);
        }
      },

      leavePost: async (postId: number) => {
        try {
          const conn: HubConnection | undefined = (window as any).__forumConn;
          if (!conn) return;
          await conn.invoke("LeavePost", postId);
        } catch (err) {
          console.error("leavePost failed", err);
        }
      },

      sendTyping: async (postId: number, isTyping: boolean) => {
        try {
          const conn: HubConnection | undefined = (window as any).__forumConn;
          if (!conn) return;
          await conn.invoke("TypingInPost", postId, isTyping);
        } catch (err) {
          console.error("sendTyping failed", err);
        }
      },

      getPosts: async (
        schoolId: number,
        subjectId?: number,
        flairId?: number,
        query?: string,
        sortBy?: string,
        pageNumber: number = 1,
        pageSize: number = 10
      ) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          params.append("schoolId", schoolId.toString());
          if (subjectId) params.append("subjectId", subjectId.toString());
          if (flairId) params.append("flairId", flairId.toString());
          if (query) params.append("query", query);
          if (sortBy) params.append("sortBy", sortBy);
          params.append("pageNumber", pageNumber.toString());
          params.append("pageSize", pageSize.toString());

          const resp = await axiosInstance.get(
            `/Forum/posts?${params.toString()}`
          );
          const body = resp.data;

          if (body?.success) {
            set({
              posts: body.data?.items || [],
              success: true,
              message: body?.message || "",
            });
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      getPostById: async (postId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.get(`/Forum/posts/${postId}`);
          const body = resp.data;

          if (body?.success) {
            set({
              currentPost: body.data,
              success: true,
              message: body?.message || "",
            });
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      createPost: async (formData: FormData) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(
            `/Forum/posts/create`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          const body = resp.data;

          if (body?.success) {
            set((state) => ({
              posts: [body.data, ...state.posts],
              success: true,
              message: body?.message || "",
            }));
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updatePost: async (postId: number, formData: FormData) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.put(
            `/Forum/posts/${postId}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          const body = resp.data;

          if (body?.success) {
            set((state) => ({
              posts: state.posts.map((p) =>
                p.post_id === postId ? body.data : p
              ),
              currentPost:
                state.currentPost?.post_id === postId
                  ? body.data
                  : state.currentPost,
              success: true,
              message: body?.message || "",
            }));
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deletePost: async (postId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.delete(`/Forum/posts/${postId}`);
          const body = resp.data;

          if (body?.success) {
            set((state) => ({
              posts: state.posts.filter((p) => p.post_id !== postId),
              currentPost:
                state.currentPost?.post_id === postId
                  ? null
                  : state.currentPost,
              success: true,
              message: body?.message || "",
            }));
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      getComments: async (
        postId: number,
        pageNumber: number = 1,
        pageSize: number = 50
      ) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          params.append("pageNumber", pageNumber.toString());
          params.append("pageSize", pageSize.toString());

          const resp = await axiosInstance.get(
            `/Forum/posts/${postId}/comments?${params.toString()}`
          );
          const body = resp.data;

          if (body?.success && get().currentPost?.post_id === postId) {
            set((state) => ({
              currentPost: state.currentPost
                ? {
                    ...state.currentPost,
                    comments: body.data?.items || [],
                  }
                : null,
              success: true,
              message: body?.message || "",
            }));
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      createComment: async (formData: FormData) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(
            `/Forum/comments/create`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          const body = resp.data;

          if (body?.success) {
            const postId = parseInt(formData.get("postId") as string);
            set((state) => ({
              currentPost:
                state.currentPost?.post_id === postId
                  ? {
                      ...state.currentPost,
                      comments: [
                        ...(state.currentPost.comments || []),
                        body.data,
                      ],
                      comment_count: state.currentPost.comment_count + 1,
                    }
                  : state.currentPost,
              posts: state.posts.map((p) =>
                p.post_id === postId
                  ? { ...p, comment_count: p.comment_count + 1 }
                  : p
              ),
              success: true,
              message: body?.message || "",
            }));
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateComment: async (commentId: number, formData: FormData) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.put(
            `/Forum/comments/${commentId}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          const body = resp.data;

          if (body?.success) {
            set((state) => ({
              currentPost: state.currentPost
                ? {
                    ...state.currentPost,
                    comments: state.currentPost.comments.map((c) =>
                      c.comment_id === commentId ? body.data : c
                    ),
                  }
                : null,
              success: true,
              message: body?.message || "",
            }));
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteComment: async (commentId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.delete(
            `/Forum/comments/${commentId}`
          );
          const body = resp.data;

          if (body?.success) {
            set((state) => ({
              currentPost: state.currentPost
                ? {
                    ...state.currentPost,
                    comments: state.currentPost.comments.filter(
                      (c) => c.comment_id !== commentId
                    ),
                    comment_count: Math.max(
                      0,
                      state.currentPost.comment_count - 1
                    ),
                  }
                : null,
              posts: state.posts.map((p) =>
                p.post_id === state.currentPost?.post_id
                  ? { ...p, comment_count: Math.max(0, p.comment_count - 1) }
                  : p
              ),
              success: true,
              message: body?.message || "",
            }));
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    { name: "forum-store" }
  )
);
