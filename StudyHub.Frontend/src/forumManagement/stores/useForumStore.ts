// src/forumManagement/stores/useForumStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type { Post, Flair } from "../interfaces/forum";
import { forumService } from "../services/ForumService";
import { useForumSignalRStore } from "./useForumSignalRStore";

interface ModeratorPost extends Post {
  status: boolean | null;
  violation_score?: number;
}

interface ForumState {
  posts: Post[];
  currentPost: Post | null;
  flairs: Flair[];
  myPosts: Post[];
  moderatorPosts: ModeratorPost[];
  isLoading: boolean;
  success: boolean;
  message: string;
  rules: Array<{ id: number; content: string }>;

  loadFlairs: (schoolId?: number) => Promise<void>;
  loadRules: (schoolId?: number) => Promise<void>;

  getPosts: (
    schoolId: number,
    subjectIds?: number[],
    flairIds?: number[],
    query?: string,
    sortBy?: string,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<any>;
  getPostById: (postId: number) => Promise<any>;
  createPost: (formData: FormData) => Promise<any>;
  updatePost: (postId: number, formData: FormData) => Promise<any>;
  deletePost: (postId: number) => Promise<any>;

  topPosts: Post[];
  getTopPosts: (schoolId: number, limit?: number) => Promise<any>;

  getComments: (
    postId: number,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<any>;
  createComment: (formData: FormData) => Promise<any>;
  updateComment: (commentId: number, formData: FormData) => Promise<any>;
  deleteComment: (commentId: number) => Promise<any>;

  getMyPosts: (
    schoolId: number,
    subjectId?: number,
    flairId?: number,
    query?: string,
    sortBy?: string,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<any>;

  createReport: (
    targetId: number,
    targetType: "post" | "comment",
    ruleId: number,
    content: string
  ) => Promise<any>;

  getModeratorPosts: (
    schoolId: number,
    subjectIds?: number[],
    flairIds?: number[],
    query?: string,
    sortBy?: string,
    postStatus?: string,
    minViolationScore?: number,
    maxViolationScore?: number,
    createdFrom?: string,
    createdTo?: string,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<any>;

  approvePost: (postId: number) => Promise<any>;
  rejectPost: (postId: number) => Promise<any>;
  hidePost: (
    postId: number,
    violationScore: number,
    reason?: string
  ) => Promise<any>;
}

const mapPost = (dto: any) => ({
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
    dto.creatorFullname || dto.creatorName || dto.author_name || "Unknown",
  author_initials: (dto.creatorFullname || dto.creatorName || "U")
    .substring(0, 2)
    .toUpperCase(),
  author_class: dto.creatorClass || "",
  comment_count: dto.commentCount || dto.comment_count || 0,
  comments: [],
  image_urls: dto.attachments?.map((a: any) => a.fileUrl).join(",") || "",
});

const mapComment = (dto: any) => ({
  comment_id: dto.commentId || dto.comment_id,
  post_id: dto.postId || dto.post_id,
  parent_comment_id: dto.parentCommentId || dto.parent_comment_id,
  content: dto.content,
  created_at: dto.createdAt || dto.created_at || new Date().toISOString(),
  created_by: dto.createdBy || dto.created_by,
  author_name: dto.creatorName || dto.authorName || "Unknown",
  author_initials: (dto.creatorName || dto.authorName || "U")
    .substring(0, 2)
    .toUpperCase(),
  author_class: dto.creatorClass || "",
  replies: [],
  image_urls: dto.attachments?.map((a: any) => a.fileUrl).join(",") || "",
});

const isDuplicateComment = (comments: any[], targetId: number): boolean => {
  for (const c of comments) {
    if (c.comment_id === targetId) return true;
    if (c.replies?.length && isDuplicateComment(c.replies, targetId))
      return true;
  }
  return false;
};

const addReplyToComment = (comments: any[], reply: any): any[] => {
  return comments.map((c) => {
    if (c.comment_id === reply.parent_comment_id) {
      return { ...c, replies: [...(c.replies || []), reply] };
    }
    if (c.replies?.length) {
      return { ...c, replies: addReplyToComment(c.replies, reply) };
    }
    return c;
  });
};

export const useForumStore = create<ForumState>()(
  devtools(
    (set, get) => {
      // Setup SignalR event handlers
      const signalRStore = useForumSignalRStore.getState();

      signalRStore.onReceiveNewPost = (dto: any) => {
        const mappedPost = mapPost(dto);
        set((state) => {
          const exists = state.posts.some(
            (p) => p.post_id === mappedPost.post_id
          );
          if (exists) return {};
          return { posts: [mappedPost, ...state.posts] };
        });
      };

      signalRStore.onReceiveNewComment = (dto: any) => {
        const mappedComment = mapComment(dto);

        set((state) => {
          const updatedPosts = state.posts.map((p) => {
            if (p.post_id !== mappedComment.post_id) return p;

            const existingComments = p.comments || [];

            if (
              isDuplicateComment(existingComments, mappedComment.comment_id)
            ) {
              return p;
            }

            const newComments = mappedComment.parent_comment_id
              ? addReplyToComment(existingComments, mappedComment)
              : [...existingComments, mappedComment];

            return {
              ...p,
              comments: newComments,
              comment_count: p.comment_count + 1,
            };
          });

          if (
            !state.currentPost ||
            state.currentPost.post_id !== mappedComment.post_id
          ) {
            return { posts: updatedPosts };
          }

          const existingComments = state.currentPost.comments || [];

          if (isDuplicateComment(existingComments, mappedComment.comment_id)) {
            return { posts: updatedPosts };
          }

          let newComments: any[];
          if (mappedComment.parent_comment_id) {
            newComments = addReplyToComment(existingComments, mappedComment);
          } else {
            newComments = [...existingComments, mappedComment];
          }

          const topLevelCount = newComments.filter(
            (c) => !c.parent_comment_id
          ).length;

          return {
            posts: updatedPosts,
            currentPost: {
              ...state.currentPost,
              comments: newComments,
              comment_count: topLevelCount,
            },
          };
        });
      };

      signalRStore.onCommentDeleted = (commentId: number) => {
        set((state) => {
          if (!state.currentPost) return {};

          const newCommentCount = Math.max(
            0,
            state.currentPost.comment_count - 1
          );

          return {
            currentPost: {
              ...state.currentPost,
              comments: state.currentPost.comments.filter(
                (c) => c.comment_id !== commentId
              ),
              comment_count: newCommentCount,
            },
            posts: state.posts.map((p) =>
              p.post_id === state.currentPost?.post_id
                ? { ...p, comment_count: newCommentCount }
                : p
            ),
          };
        });
      };

      signalRStore.onPostUpdated = (dto: any) => {
        const mappedPost = mapPost(dto);

        set((state) => {
          const updatedPosts = state.posts.map((p) =>
            p.post_id === mappedPost.post_id ? { ...p, ...mappedPost } : p
          );

          let updatedCurrentPost = state.currentPost;
          if (state.currentPost?.post_id === mappedPost.post_id) {
            updatedCurrentPost = { ...state.currentPost, ...mappedPost };
          }

          return {
            posts: updatedPosts,
            currentPost: updatedCurrentPost,
          };
        });
      };

      signalRStore.onPostDeleted = (postId: number) => {
        set((state) => ({
          posts: state.posts.filter((p) => p.post_id !== postId),
          currentPost:
            state.currentPost?.post_id === postId ? null : state.currentPost,
        }));
      };

      signalRStore.onCommentUpdated = (dto: any) => {
        const mappedComment = mapComment(dto);

        set((state) => {
          if (
            !state.currentPost ||
            state.currentPost.post_id !== mappedComment.post_id
          ) {
            return {};
          }

          const updateCommentInTree = (comments: any[]): any[] => {
            return comments.map((c) => {
              if (c.comment_id === mappedComment.comment_id) {
                return { ...c, ...mappedComment, replies: c.replies };
              }
              if (c.replies && c.replies.length > 0) {
                return { ...c, replies: updateCommentInTree(c.replies) };
              }
              return c;
            });
          };

          return {
            currentPost: {
              ...state.currentPost,
              comments: updateCommentInTree(state.currentPost.comments || []),
            },
          };
        });
      };

      return {
        posts: [],
        currentPost: null,
        flairs: [],
        topPosts: [],
        rules: [],
        myPosts: [],
        moderatorPosts: [],
        isLoading: false,
        success: false,
        message: "",

        loadFlairs: async (schoolId?: number) => {
          try {
            const result = await forumService.getFlairs(schoolId);
            set({ flairs: result });
          } catch {
            set({ flairs: [] });
          }
        },

        loadRules: async (schoolId?: number) => {
          try {
            const result = await forumService.getRules(schoolId);
            set({ rules: result });
          } catch {
            set({ rules: [] });
          }
        },

        getPosts: async (
          schoolId: number,
          subjectIds?: number[],
          flairIds?: number[],
          query?: string,
          sortBy?: string,
          pageNumber: number = 1,
          pageSize: number = 10
        ) => {
          set({ isLoading: true });
          try {
            const params = new URLSearchParams();
            params.append("schoolId", schoolId.toString());
            if (subjectIds && subjectIds.length > 0)
              params.append("subjectIds", subjectIds.join(","));
            if (flairIds && flairIds.length > 0)
              params.append("flairIds", flairIds.join(","));
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
                ...mapPost(item),
                comments: (item.comments || []).map((c: any) => ({
                  ...mapComment(c),
                  replies: (c.replies || []).map((r: any) => mapComment(r)),
                })),
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
            return null;
          } finally {
            set({ isLoading: false });
          }
        },

        getMyPosts: async (
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
              `/Forum/my-posts?${params.toString()}`
            );
            const body = resp.data;

            if (body?.success) {
              const mappedPosts = (body.data?.items || []).map((item: any) => ({
                ...mapPost(item),
                comments: (item.comments || []).map((c: any) => ({
                  ...mapComment(c),
                  replies: (c.replies || []).map((r: any) => mapComment(r)),
                })),
              }));

              set({
                myPosts: mappedPosts,
                success: true,
                message: body?.message || "",
              });
            } else {
              set({ success: false, message: body?.message || "" });
            }
            return body;
          } catch (err: any) {
            set({ success: false, message: axiosMessageErrorHandler(err) });
            return null;
          } finally {
            set({ isLoading: false });
          }
        },

        getTopPosts: async (schoolId: number, limit: number = 5) => {
          try {
            const params = new URLSearchParams();
            params.append("schoolId", schoolId.toString());
            params.append("sortBy", "mostCommented");
            params.append("pageNumber", "1");
            params.append("pageSize", limit.toString());

            const resp = await axiosInstance.get(
              `/Forum/posts?${params.toString()}`
            );
            const body = resp.data;

            if (body?.success) {
              const mappedPosts = (body.data?.items || []).map((item: any) =>
                mapPost(item)
              );
              set({ topPosts: mappedPosts });
            }
            return body;
          } catch (err: any) {
            return null;
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
                ...mapPost(item),
                comment_count: item.comments?.length || 0,
                comments: (item.comments || []).map((c: any) => ({
                  ...mapComment(c),
                  replies: (c.replies || []).map((r: any) => mapComment(r)),
                })),
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
              const mappedPost = mapPost(body.data);

              set((state) => ({
                posts: state.posts.map((p) =>
                  p.post_id === postId ? mappedPost : p
                ),
                currentPost:
                  state.currentPost?.post_id === postId
                    ? { ...state.currentPost, ...mappedPost }
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
              const mapCommentWithReplies = (comment: any): any => ({
                ...mapComment(comment),
                replies: (comment.replies || []).map(mapCommentWithReplies),
              });

              const mappedComments = (body.data?.items || []).map(
                mapCommentWithReplies
              );

              if (get().currentPost?.post_id === postId) {
                set((state) => ({
                  currentPost: state.currentPost
                    ? { ...state.currentPost, comments: mappedComments }
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
              const mappedComment = mapComment(body.data);

              set((state) => {
                if (!state.currentPost) return { success: true };

                const updateCommentInTree = (comments: any[]): any[] => {
                  return comments.map((c) => {
                    if (c.comment_id === commentId) {
                      return { ...c, ...mappedComment, replies: c.replies };
                    }
                    if (c.replies && c.replies.length > 0) {
                      return { ...c, replies: updateCommentInTree(c.replies) };
                    }
                    return c;
                  });
                };

                return {
                  currentPost: {
                    ...state.currentPost,
                    comments: updateCommentInTree(
                      state.currentPost.comments || []
                    ),
                  },
                  success: true,
                  message: body?.message || "",
                };
              });
            } else {
              set({ success: false, message: body?.message || "" });
            }
            return body;
          } catch (err: any) {
            set({ success: false, message: axiosMessageErrorHandler(err) });
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
            return null;
          } finally {
            set({ isLoading: false });
          }
        },

        createReport: async (
          targetId: number,
          targetType: "post" | "comment",
          ruleId: number,
          content: string
        ) => {
          set({ isLoading: true });
          try {
            const resp = await axiosInstance.post(`/Forum/reports`, {
              targetId,
              targetType,
              ruleId,
              content,
            });
            const body = resp.data;

            if (body?.success) {
              set({
                success: true,
                message: body?.message || "Gửi báo cáo thành công",
              });
            } else {
              set({ success: false, message: body?.message || "" });
            }
            return body;
          } catch (err: any) {
            set({ success: false, message: axiosMessageErrorHandler(err) });
            return null;
          } finally {
            set({ isLoading: false });
          }
        },

        getModeratorPosts: async (
          schoolId: number,
          subjectIds?: number[],
          flairIds?: number[],
          query?: string,
          postStatus?: string,
          minViolationScore?: number,
          maxViolationScore?: number,
          createdFrom?: string,
          createdTo?: string,
          sortBy?: string,
          pageNumber: number = 1,
          pageSize: number = 10
        ) => {
          set({ isLoading: true });
          try {
            const params = new URLSearchParams();
            params.append("schoolId", schoolId.toString());
            if (subjectIds && subjectIds.length > 0)
              params.append("subjectIds", subjectIds.join(","));
            if (flairIds && flairIds.length > 0)
              params.append("flairIds", flairIds.join(","));
            if (query) params.append("query", query);
            if (postStatus) params.append("postStatus", postStatus);
            if (minViolationScore !== undefined)
              params.append("minViolationScore", minViolationScore.toString());
            if (maxViolationScore !== undefined)
              params.append("maxViolationScore", maxViolationScore.toString());
            if (createdFrom) params.append("createdFrom", createdFrom);
            if (createdTo) params.append("createdTo", createdTo);
            if (sortBy) params.append("sortBy", sortBy);
            params.append("pageNumber", pageNumber.toString());
            params.append("pageSize", pageSize.toString());

            const resp = await axiosInstance.get(
              `/Forum/moderator/posts?${params.toString()}`
            );
            const body = resp.data;

            if (body?.success) {
              const mappedPosts = (body.data?.items || []).map((item: any) => ({
                ...mapPost(item),
                status: item.status ?? null,
                violation_score: item.violationScore ?? 0,
              }));

              set({
                moderatorPosts: mappedPosts,
                success: true,
                message: body?.message || "",
              });
            } else {
              set({ success: false, message: body?.message || "" });
            }
            return body;
          } catch (err: any) {
            set({ success: false, message: axiosMessageErrorHandler(err) });
            return null;
          } finally {
            set({ isLoading: false });
          }
        },

        approvePost: async (postId: number) => {
          set({ isLoading: true });
          try {
            const resp = await axiosInstance.post(
              `/Forum/posts/${postId}/approve`
            );
            const body = resp.data;

            if (body?.success) {
              set({
                success: true,
                message: body?.message || "Đã duyệt bài viết",
              });
            } else {
              set({ success: false, message: body?.message || "" });
            }
            return body;
          } catch (err: any) {
            set({ success: false, message: axiosMessageErrorHandler(err) });
            return null;
          } finally {
            set({ isLoading: false });
          }
        },

        rejectPost: async (postId: number) => {
          set({ isLoading: true });
          try {
            const resp = await axiosInstance.post(
              `/Forum/posts/${postId}/reject`
            );
            const body = resp.data;

            if (body?.success) {
              set({
                success: true,
                message: body?.message || "Đã từ chối bài viết",
              });
            } else {
              set({ success: false, message: body?.message || "" });
            }
            return body;
          } catch (err: any) {
            set({ success: false, message: axiosMessageErrorHandler(err) });
            return null;
          } finally {
            set({ isLoading: false });
          }
        },

        hidePost: async (
          postId: number,
          violationScore: number,
          reason?: string
        ) => {
          set({ isLoading: true });
          try {
            const payload: any = { violationScore };
            if (reason) payload.reason = reason;

            const resp = await axiosInstance.post(
              `/Forum/posts/${postId}/hide`,
              payload
            );
            const body = resp.data;

            if (body?.success) {
              set({
                success: true,
                message: body?.message || "Đã ẩn bài viết",
              });
            } else {
              set({ success: false, message: body?.message || "" });
            }
            return body;
          } catch (err: any) {
            set({ success: false, message: axiosMessageErrorHandler(err) });
            return null;
          } finally {
            set({ isLoading: false });
          }
        },
      };
    },
    { name: "forum-store" }
  )
);
