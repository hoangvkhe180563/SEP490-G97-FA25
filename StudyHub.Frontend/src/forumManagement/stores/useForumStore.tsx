// src/forumManagement/stores/useForumStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type { HubConnection } from "@microsoft/signalr";
import { createForumFuncConnection } from "@/lib/signalR";
import type { Post, Flair } from "../interfaces/forum";
import { forumService } from "../services/ForumService";

interface ForumState {
  posts: Post[];
  currentPost: Post | null;
  flairs: Flair[];
  isForumConnected: boolean;
  isLoading: boolean;
  success: boolean;
  message: string;

  loadFlairs: (schoolId?: number) => Promise<void>;
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
      flairs: [],
      isForumConnected: false,
      isLoading: false,
      success: false,
      message: "",

      loadFlairs: async (schoolId?: number) => {
        try {
          const result = await forumService.getFlairs(schoolId);
          set({ flairs: result });
        } catch (error) {
          console.error("Failed to load flairs:", error);
          set({ flairs: [] });
        }
      },

      startForum: async () => {
        try {
          if ((window as any).__forumConn) {
            console.log("Forum connection already exists");
            return;
          }

          const conn: HubConnection = createForumFuncConnection();
          (window as any).__forumConn = conn;
          conn.on("ReceiveNewPost", (dto: any) => {
            try {
              console.log("ReceiveNewPost", dto);

              const mappedPost = {
                post_id: dto.postId || dto.post_id,
                school_id: dto.schoolId || dto.school_id,
                subject_id: dto.subjectId || dto.subject_id,
                subject_name: dto.subjectName || dto.subject_name || "N/A",
                flair_id: dto.flairId || dto.flair_id,
                flair_name: dto.flairName || dto.flair_name || "N/A",
                title: dto.title,
                content: dto.content,
                created_at: dto.createdAt || dto.created_at,
                created_by: dto.createdBy || dto.created_by,
                author_name:
                  dto.creatorFullname ||
                  dto.creatorName ||
                  dto.author_name ||
                  "Unknown",
                author_initials: (dto.creatorFullname || dto.creatorName || "U")
                  .substring(0, 2)
                  .toUpperCase(),
                author_class: dto.creatorClass || "",
                comment_count: dto.commentCount || dto.comment_count || 0,
                comments: [],
                image_urls:
                  dto.attachments?.map((a: any) => a.fileUrl).join(",") || "",
              };

              set((state) => {
                const exists = state.posts.some(
                  (p) => p.post_id === mappedPost.post_id
                );
                if (exists) {
                  console.log(
                    "Post already exists, skipping:",
                    mappedPost.post_id
                  );
                  return {};
                }
                return { posts: [mappedPost, ...state.posts] };
              });
            } catch (err) {
              console.error("ReceiveNewPost handler error", err);
            }
          });

          conn.on("ReceiveNewComment", (dto: any) => {
            try {
              console.log("ReceiveNewComment RAW DTO:", dto);

              const mappedComment = {
                comment_id: dto.commentId || dto.comment_id,
                post_id: dto.postId || dto.post_id,
                parent_comment_id: dto.parentCommentId || dto.parent_comment_id,
                content: dto.content,
                created_at:
                  dto.createdAt || dto.created_at || new Date().toISOString(),
                created_by: dto.createdBy || dto.created_by,
                author_name: dto.creatorName || dto.authorName || "Unknown",
                author_initials: (dto.creatorName || dto.authorName || "U")
                  .substring(0, 2)
                  .toUpperCase(),
                author_class: dto.creatorClass || "",
                replies: [],
                image_urls:
                  dto.attachments?.map((a: any) => a.fileUrl).join(",") || "",
              };

              set((state) => {
                if (
                  state.currentPost &&
                  state.currentPost.post_id === mappedComment.post_id
                ) {
                  const existingComments = state.currentPost.comments || [];

                  const isDuplicate = (
                    comments: any[],
                    targetId: number
                  ): boolean => {
                    for (const c of comments) {
                      if (c.comment_id === targetId) return true;
                      if (c.replies && isDuplicate(c.replies, targetId))
                        return true;
                    }
                    return false;
                  };

                  if (isDuplicate(existingComments, mappedComment.comment_id)) {
                    console.log(
                      "Comment already exists, skipping:",
                      mappedComment.comment_id
                    );
                    return {};
                  }

                  if (mappedComment.parent_comment_id) {
                    const addReplyToComment = (comments: any[]): any[] => {
                      return comments.map((c) => {
                        if (c.comment_id === mappedComment.parent_comment_id) {
                          return {
                            ...c,
                            replies: [...(c.replies || []), mappedComment],
                          };
                        }
                        if (c.replies && c.replies.length > 0) {
                          return {
                            ...c,
                            replies: addReplyToComment(c.replies),
                          };
                        }
                        return c;
                      });
                    };

                    return {
                      currentPost: {
                        ...state.currentPost,
                        comments: addReplyToComment(existingComments),
                        comment_count: state.currentPost.comment_count,
                      },
                      posts: state.posts.map((p) =>
                        p.post_id === mappedComment.post_id ? { ...p } : p
                      ),
                    };
                  } else {
                    return {
                      currentPost: {
                        ...state.currentPost,
                        comments: [...existingComments, mappedComment],
                        comment_count: state.currentPost.comment_count + 1,
                      },
                      posts: state.posts.map((p) =>
                        p.post_id === mappedComment.post_id
                          ? { ...p, comment_count: p.comment_count + 1 }
                          : p
                      ),
                    };
                  }
                }

                return {
                  posts: state.posts.map((p) =>
                    p.post_id === mappedComment.post_id &&
                    !mappedComment.parent_comment_id
                      ? { ...p, comment_count: p.comment_count + 1 }
                      : p
                  ),
                };
              });
            } catch (err) {
              console.error("ReceiveNewComment handler error", err);
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
              console.log("ReceiveNewComment RAW DTO:", dto);

              const mappedComment = {
                comment_id: dto.commentId || dto.comment_id,
                post_id: dto.postId || dto.post_id,
                parent_comment_id: dto.parentCommentId || dto.parent_comment_id,
                content: dto.content,
                created_at:
                  dto.createdAt || dto.created_at || new Date().toISOString(),
                created_by: dto.createdBy || dto.created_by,
                author_name: dto.creatorName || dto.authorName || "Unknown",
                author_initials: (dto.creatorName || dto.authorName || "U")
                  .substring(0, 2)
                  .toUpperCase(),
                author_class: dto.creatorClass || "",
                replies: [],
                image_urls:
                  dto.attachments?.map((a: any) => a.fileUrl).join(",") || "",
              };

              set((state) => {
                if (
                  state.currentPost &&
                  state.currentPost.post_id === mappedComment.post_id
                ) {
                  const existingComments = state.currentPost.comments || [];

                  const isDuplicate = (
                    comments: any[],
                    targetId: number
                  ): boolean => {
                    for (const c of comments) {
                      if (c.comment_id === targetId) return true;
                      if (c.replies && isDuplicate(c.replies, targetId))
                        return true;
                    }
                    return false;
                  };

                  if (isDuplicate(existingComments, mappedComment.comment_id)) {
                    console.log(
                      "Comment already exists, skipping:",
                      mappedComment.comment_id
                    );
                    return {};
                  }

                  if (mappedComment.parent_comment_id) {
                    const addReplyToComment = (comments: any[]): any[] => {
                      return comments.map((c) => {
                        if (c.comment_id === mappedComment.parent_comment_id) {
                          return {
                            ...c,
                            replies: [...(c.replies || []), mappedComment],
                          };
                        }
                        if (c.replies && c.replies.length > 0) {
                          return {
                            ...c,
                            replies: addReplyToComment(c.replies),
                          };
                        }
                        return c;
                      });
                    };

                    const newComments = addReplyToComment(existingComments);
                    const topLevelCount = newComments.filter(
                      (c) => !c.parent_comment_id
                    ).length;

                    return {
                      currentPost: {
                        ...state.currentPost,
                        comments: newComments,
                        comment_count: topLevelCount,
                      },
                      posts: state.posts.map((p) =>
                        p.post_id === mappedComment.post_id
                          ? { ...p, comment_count: topLevelCount }
                          : p
                      ),
                    };
                  } else {
                    const newComments = [...existingComments, mappedComment];
                    const topLevelCount = newComments.filter(
                      (c) => !c.parent_comment_id
                    ).length;

                    return {
                      currentPost: {
                        ...state.currentPost,
                        comments: newComments,
                        comment_count: topLevelCount,
                      },
                      posts: state.posts.map((p) =>
                        p.post_id === mappedComment.post_id
                          ? { ...p, comment_count: topLevelCount }
                          : p
                      ),
                    };
                  }
                }

                return {};
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
          delete (window as any).__forumConn;
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
          if (!conn) {
            console.warn("No forum connection");
            return;
          }
          if (conn.state !== "Connected") {
            console.warn("Connection not ready");
            return;
          }
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
            const mappedPosts = (body.data?.items || []).map((item: any) => ({
              post_id: item.postId || item.post_id,
              school_id: item.schoolId || item.school_id,
              subject_id: item.subjectId || item.subject_id,
              subject_name: item.subjectName || item.subject_name,
              flair_id: item.flairId || item.flair_id,
              flair_name: item.flairName || item.flair_name,
              title: item.title,
              content: item.content,
              created_at: item.createdAt || item.created_at,
              created_by: item.createdBy || item.created_by,
              author_name:
                item.creatorFullname ||
                item.creatorName ||
                item.author_name ||
                "Unknown",
              author_initials: (item.creatorFullname || item.creatorName || "U")
                .substring(0, 2)
                .toUpperCase(),
              author_class: item.creatorName || "",
              comment_count: item.commentCount || 0,
              comments: [],
              image_urls:
                item.attachments?.map((a: any) => a.fileUrl).join(",") || "",
            }));

            set({
              posts: mappedPosts,
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
            const item = body.data;
            const mappedPost = {
              post_id: item.postId,
              school_id: item.schoolId,
              subject_id: item.subjectId,
              subject_name: item.subjectName,
              flair_id: item.flairId,
              flair_name: item.flairName,
              title: item.title,
              content: item.content,
              created_at: item.createdAt,
              created_by: item.createdBy,
              author_name: item.creatorFullname || item.creatorName,
              author_initials:
                item.creatorName?.substring(0, 2).toUpperCase() || "U",
              author_class: item.creatorName || "",
              comment_count: item.comments?.length || 0,
              comments: (item.comments || []).map((c: any) => ({
                comment_id: c.commentId,
                post_id: c.postId,
                parent_comment_id: c.parentCommentId,
                content: c.content,
                created_at: c.createdAt,
                created_by: c.createdBy,
                author_name: c.creatorName || c.authorName,
                author_initials:
                  c.creatorName?.substring(0, 2).toUpperCase() || "U",
                replies: (c.replies || []).map((r: any) => ({
                  comment_id: r.commentId,
                  post_id: r.postId,
                  parent_comment_id: r.parentCommentId,
                  content: r.content,
                  created_at: r.createdAt,
                  created_by: r.createdBy,
                  author_name: r.creatorName || r.authorName,
                  author_initials:
                    r.creatorName?.substring(0, 2).toUpperCase() || "U",
                  replies: [],
                  image_urls:
                    r.attachments?.map((a: any) => a.fileUrl).join(",") || "",
                })),
                image_urls:
                  c.attachments?.map((a: any) => a.fileUrl).join(",") || "",
              })),
              image_urls:
                item.attachments?.map((a: any) => a.fileUrl).join(",") || "",
            };

            set({
              currentPost: mappedPost,
              success: true,
              message: body?.message || "",
            });
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
            set({
              success: true,
              message: body?.message || "Tạo bài viết thành công",
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

          if (body?.success) {
            const mapCommentWithReplies = (comment: any): any => {
              return {
                comment_id: comment.commentId || comment.comment_id,
                post_id: comment.postId || comment.post_id,
                parent_comment_id:
                  comment.parentCommentId || comment.parent_comment_id,
                content: comment.content,
                created_at: comment.createdAt || comment.created_at,
                created_by: comment.createdBy || comment.created_by,
                author_name:
                  comment.creatorName || comment.authorName || "Unknown",
                author_initials: (
                  comment.creatorName ||
                  comment.authorName ||
                  "U"
                )
                  .substring(0, 2)
                  .toUpperCase(),
                author_class: comment.creatorClass || "",
                replies: (comment.replies || []).map(mapCommentWithReplies),
                image_urls:
                  comment.attachments?.map((a: any) => a.fileUrl).join(",") ||
                  "",
              };
            };

            const mappedComments = (body.data?.items || []).map(
              mapCommentWithReplies
            );

            if (get().currentPost?.post_id === postId) {
              set((state) => ({
                currentPost: state.currentPost
                  ? {
                      ...state.currentPost,
                      comments: mappedComments,
                    }
                  : null,
                success: true,
                message: body?.message || "",
              }));
            }

            return body;
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
            set({
              success: true,
              message: body?.message || "Tạo bình luận thành công",
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
