// useForumDashboardStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type {
  PostStatsDto,
  CommentStatsDto,
  ViolationStatsDto,
  AppealStatsDto,
  UserActivityStatsDto,
  ModeratorActivityDto,
  TopEngagedPost,
} from "../interfaces/moderator-dashboard";

interface State {
  schoolId: number | null;
  dateRange: number;
  postStats: PostStatsDto | null;
  commentStats: CommentStatsDto | null;
  violationStats: ViolationStatsDto | null;
  appealStats: AppealStatsDto | null;
  userActivityStats: UserActivityStatsDto | null;
  moderatorActivity: ModeratorActivityDto[] | null;
  topEngagedPosts: TopEngagedPost[] | null;
  isLoading: boolean;
  error: string | null;

  setSchoolId: (id: number) => void;
  setDateRange: (days: number) => void;
  fetchPostStats: (schoolId: number, days: number) => Promise<void>;
  fetchCommentStats: (schoolId: number, days: number) => Promise<void>;
  fetchViolationStats: (schoolId: number, days: number) => Promise<void>;
  fetchAppealStats: (schoolId: number, days: number) => Promise<void>;
  fetchUserActivityStats: (schoolId: number, days: number) => Promise<void>;
  fetchModeratorActivity: (schoolId: number, days: number) => Promise<void>;
  fetchTopEngagedPosts: (schoolId: number, days: number) => Promise<void>;
  fetchAllStats: (schoolId: number, days: number) => Promise<void>;
}

export const useForumDashboardStore = create<State>()(
  devtools((set, get) => ({
    schoolId: null,
    dateRange: 7,
    postStats: null,
    commentStats: null,
    violationStats: null,
    appealStats: null,
    userActivityStats: null,
    moderatorActivity: null,
    topEngagedPosts: null,
    isLoading: false,
    error: null,

    setSchoolId: (id) => set({ schoolId: id }),
    setDateRange: (days) => set({ dateRange: days }),

    fetchPostStats: async (schoolId: number, days: number) => {
      set({ isLoading: true, error: null });
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const resp = await axiosInstance.get(`/Forum/moderator/posts`, {
          params: {
            schoolId,
            createdFrom: startDate.toISOString(),
            createdTo: endDate.toISOString(),
            pageNumber: 1,
            pageSize: 1000,
          },
        });

        const posts = resp.data?.data?.items || [];
        const total = posts.length;
        const approved = posts.filter((p: any) => p.status === true).length;
        const pending = posts.filter((p: any) => p.status === null).length;
        const rejected = posts.filter((p: any) => p.status === false).length;
        const hidden = posts.filter((p: any) => p.isHidden === true).length;

        const postsByDate = posts.reduce((acc: any, post: any) => {
          const date = new Date(post.createdAt).toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const postsByPeriod = Object.entries(postsByDate)
          .map(([period, count]) => ({ period, count: count as number }))
          .sort((a, b) => a.period.localeCompare(b.period));

        const flairCounts = posts.reduce((acc: any, post: any) => {
          if (post.flairName) {
            acc[post.flairName] = (acc[post.flairName] || 0) + 1;
          }
          return acc;
        }, {});

        const topFlairs = Object.entries(flairCounts)
          .map(([flairName, count]) => ({ flairName, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        const subjectCounts = posts.reduce((acc: any, post: any) => {
          if (post.subjectName) {
            acc[post.subjectName] = (acc[post.subjectName] || 0) + 1;
          }
          return acc;
        }, {});

        const topSubjects = Object.entries(subjectCounts)
          .map(([subjectName, count]) => ({
            subjectName,
            count: count as number,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        set({
          postStats: {
            totalPosts: total,
            approvedPosts: approved,
            pendingPosts: pending,
            rejectedPosts: rejected,
            hiddenPosts: hidden,
            postsByPeriod,
            topFlairs,
            topSubjects,
          },
        });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchCommentStats: async (schoolId: number, days: number) => {
      set({ isLoading: true, error: null });
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const resp = await axiosInstance.get(`/Forum/moderator/comments`, {
          params: {
            schoolId,
            createdFrom: startDate.toISOString(),
            createdTo: endDate.toISOString(),
            pageNumber: 1,
            pageSize: 1000,
          },
        });

        const comments = resp.data?.data?.items || [];
        const total = comments.length;
        const approved = comments.filter((c: any) => c.status === true).length;
        const pending = comments.filter((c: any) => c.status === null).length;
        const hidden = comments.filter((c: any) => c.isHidden === true).length;

        const commentsByDate = comments.reduce((acc: any, comment: any) => {
          const date = new Date(comment.createdAt).toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const commentsByPeriod = Object.entries(commentsByDate)
          .map(([period, count]) => ({ period, count: count as number }))
          .sort((a, b) => a.period.localeCompare(b.period));

        const postIds = [...new Set(comments.map((c: any) => c.postId))];
        const averageCommentsPerPost =
          postIds.length > 0 ? total / postIds.length : 0;

        set({
          commentStats: {
            totalComments: total,
            approvedComments: approved,
            pendingComments: pending,
            hiddenComments: hidden,
            commentsByPeriod,
            averageCommentsPerPost:
              Math.round(averageCommentsPerPost * 10) / 10,
          },
        });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchViolationStats: async (schoolId: number, days: number) => {
      set({ isLoading: true, error: null });
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const resp = await axiosInstance.get(`/Forum/moderator/violations`, {
          params: {
            schoolId,
            from: startDate.toISOString(),
            to: endDate.toISOString(),
            pageNumber: 1,
            pageSize: 1000,
          },
        });

        const violations = resp.data?.data?.items || [];
        const total = violations.length;

        const violationsByDate = violations.reduce((acc: any, v: any) => {
          const date = new Date(v.createdAt).toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const violationsByPeriod = Object.entries(violationsByDate)
          .map(([period, count]) => ({ period, count: count as number }))
          .sort((a, b) => a.period.localeCompare(b.period));

        const severityCounts = violations.reduce((acc: any, v: any) => {
          const severity = v.ruleSeverity || "Unknown";
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {});

        const violationsBySeverity = Object.entries(severityCounts).map(
          ([severity, count]) => ({ severity, count: count as number })
        );

        const sourceTypeCounts = violations.reduce((acc: any, v: any) => {
          const sourceType = v.sourceType || "Unknown";
          acc[sourceType] = (acc[sourceType] || 0) + 1;
          return acc;
        }, {});

        const violationsBySourceType = Object.entries(sourceTypeCounts).map(
          ([sourceType, count]) => ({ sourceType, count: count as number })
        );

        const ruleCounts = violations.reduce((acc: any, v: any) => {
          const ruleName = v.ruleName || "Unknown";
          acc[ruleName] = (acc[ruleName] || 0) + 1;
          return acc;
        }, {});

        const violationsByRule = Object.entries(ruleCounts)
          .map(([ruleName, count]) => ({ ruleName, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const flairCounts = violations.reduce((acc: any, v: any) => {
          const flairName = v.flairName || "Không có flair";
          acc[flairName] = (acc[flairName] || 0) + 1;
          return acc;
        }, {});

        const violationsByFlair = Object.entries(flairCounts)
          .map(([flairName, count]) => ({ flairName, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const subjectCounts = violations.reduce((acc: any, v: any) => {
          const subjectName = v.subjectName || "Unknown";
          acc[subjectName] = (acc[subjectName] || 0) + 1;
          return acc;
        }, {});

        const violationsBySubject = Object.entries(subjectCounts)
          .map(([subjectName, count]) => ({
            subjectName,
            count: count as number,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const userViolationCounts = violations.reduce((acc: any, v: any) => {
          const key = v.userId;
          if (!acc[key]) {
            acc[key] = {
              userId: v.userId,
              username: v.username || "",
              fullname: v.fullname || "",
              count: 0,
            };
          }
          acc[key].count += 1;
          return acc;
        }, {});

        const topViolators = Object.values(userViolationCounts)
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 10);

        const totalScore = violations.reduce(
          (sum: number, v: any) => sum + (v.violationScore || 0),
          0
        );
        const averageViolationScore =
          total > 0 ? Math.round((totalScore / total) * 10) / 10 : 0;

        set({
          violationStats: {
            totalViolations: total,
            violationsByPeriod,
            violationsBySeverity,
            violationsBySourceType,
            violationsByRule,
            violationsByFlair,
            violationsBySubject,
            topViolators: topViolators as any,
            averageViolationScore,
          },
        });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchAppealStats: async (schoolId: number, days: number) => {
      set({ isLoading: true, error: null });
      try {
        const resp = await axiosInstance.get(`/Forum/moderator/appeals`, {
          params: {
            schoolId,
            pageNumber: 1,
            pageSize: 1000,
          },
        });

        const appeals = resp.data?.data?.items || [];

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const filteredAppeals = appeals.filter((a: any) => {
          const createdAt = new Date(a.createdAt);
          return createdAt >= startDate && createdAt <= endDate;
        });

        const total = filteredAppeals.length;

        const pending = filteredAppeals.filter(
          (a: any) => a.status === null || a.statusText === "Pending"
        ).length;

        const approved = filteredAppeals.filter(
          (a: any) => a.status === true || a.statusText === "Approved"
        ).length;

        const rejected = filteredAppeals.filter(
          (a: any) => a.status === false || a.statusText === "Rejected"
        ).length;

        const appealsByDate = filteredAppeals.reduce(
          (acc: any, appeal: any) => {
            const date = new Date(appeal.createdAt).toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          },
          {}
        );

        const appealsByPeriod = Object.entries(appealsByDate)
          .map(([period, count]) => ({ period, count: count as number }))
          .sort((a, b) => a.period.localeCompare(b.period));

        const resolvedAppeals = filteredAppeals.filter(
          (a: any) =>
            a.updatedAt && (a.status !== null || a.statusText !== "Pending")
        );

        const totalResolveTime = resolvedAppeals.reduce(
          (sum: number, a: any) => {
            const created = new Date(a.createdAt).getTime();
            const updated = new Date(a.updatedAt).getTime();
            return sum + (updated - created);
          },
          0
        );

        const averageResolveHours =
          resolvedAppeals.length > 0
            ? Math.round(
                (totalResolveTime / resolvedAppeals.length / 3600000) * 10
              ) / 10
            : 0;

        set({
          appealStats: {
            totalAppeals: total,
            pendingAppeals: pending,
            approvedAppeals: approved,
            rejectedAppeals: rejected,
            appealsByPeriod,
            averageResolveHours,
          },
        });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoading: false });
      }
    },
    fetchUserActivityStats: async (schoolId: number, days: number) => {
      set({ isLoading: true, error: null });
      try {
        const resp = await axiosInstance.get(`/Forum/moderator/user-status`, {
          params: {
            schoolId,
            pageNumber: 1,
            pageSize: 1000,
          },
        });

        const users = resp.data?.data?.items || [];
        const totalActiveUsers = users.length;
        const mutedUsers = users.filter((u: any) => u.isMute === true).length;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const postResp = await axiosInstance.get(`/Forum/moderator/posts`, {
          params: {
            schoolId,
            createdFrom: startDate.toISOString(),
            createdTo: endDate.toISOString(),
            pageNumber: 1,
            pageSize: 1000,
          },
        });

        const posts = postResp.data?.data?.items || [];
        const userPostCounts = posts.reduce((acc: any, post: any) => {
          const userId = post.createdBy;
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              username: post.creatorName || "",
              fullname: post.creatorName || "",
              postCount: 0,
              commentCount: 0,
            };
          }
          acc[userId].postCount += 1;
          return acc;
        }, {});

        const topContributors = Object.values(userPostCounts)
          .sort((a: any, b: any) => b.postCount - a.postCount)
          .slice(0, 10);

        const scoreBuckets: any = {
          "0-10": 0,
          "11-20": 0,
          "21-30": 0,
          "31-40": 0,
          "41-50": 0,
          "50+": 0,
        };

        users.forEach((u: any) => {
          const score = u.totalViolationScore || 0;
          if (score <= 10) scoreBuckets["0-10"] += 1;
          else if (score <= 20) scoreBuckets["11-20"] += 1;
          else if (score <= 30) scoreBuckets["21-30"] += 1;
          else if (score <= 40) scoreBuckets["31-40"] += 1;
          else if (score <= 50) scoreBuckets["41-50"] += 1;
          else scoreBuckets["50+"] += 1;
        });

        const usersByViolationScore = Object.entries(scoreBuckets).map(
          ([scoreRange, count]) => ({ scoreRange, count: count as number })
        );

        set({
          userActivityStats: {
            totalActiveUsers,
            mutedUsers,
            topContributors: topContributors as any,
            usersByViolationScore,
          },
        });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchModeratorActivity: async (_schoolId: number, _days: number) => {
      set({ isLoading: true, error: null });
      try {
        set({ moderatorActivity: null });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchTopEngagedPosts: async (schoolId: number, days: number) => {
      set({ isLoading: true, error: null });
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const postsResp = await axiosInstance.get(`/Forum/moderator/posts`, {
          params: {
            schoolId,
            createdFrom: startDate.toISOString(),
            createdTo: endDate.toISOString(),
            pageNumber: 1,
            pageSize: 1000,
          },
        });

        const posts = postsResp.data?.data?.items || [];

        const postsWithComments = posts.map((post: any) => ({
          postId: post.postId,
          title: post.title,
          commentCount: post.commentCount || 0,
          viewCount: 0,
          creatorName: post.creatorName || post.authorName || "Unknown",
          createdAt: post.createdAt,
        }));

        const topEngagedPosts = postsWithComments
          .sort((a: any, b: any) => b.commentCount - a.commentCount)
          .slice(0, 10);

        set({ topEngagedPosts });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchAllStats: async (schoolId: number, days: number) => {
      const {
        fetchPostStats,
        fetchCommentStats,
        fetchViolationStats,
        fetchAppealStats,
        fetchUserActivityStats,
        fetchModeratorActivity,
        fetchTopEngagedPosts,
      } = get();

      set({ isLoading: true, error: null });
      try {
        await Promise.all([
          fetchPostStats(schoolId, days),
          fetchCommentStats(schoolId, days),
          fetchViolationStats(schoolId, days),
          fetchAppealStats(schoolId, days),
          fetchUserActivityStats(schoolId, days),
          fetchModeratorActivity(schoolId, days),
          fetchTopEngagedPosts(schoolId, days),
        ]);
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);
