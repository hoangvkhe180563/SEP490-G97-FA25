// src/forumManagement/components/ForumSidebar.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { TrendingUp, Users, BookOpen, AlertCircle } from "lucide-react";
import type { Post } from "../interfaces/forum";
import { getSubjectBadgeColor } from "../utils/colorUtils";
import { useNavigate } from "react-router-dom";
import { useUserOnlineStore } from "@/common/stores/useUserOnlineStore";
import { useForumStore } from "../stores/useForumStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { axiosInstance } from "@/lib/axios";

interface ForumSidebarProps {
  totalPosts?: number;
  topPosts: Post[];
  currentSubjectId?: number;
  currentPostId?: number;
  showStats?: boolean;
  showRules?: boolean;
  showRelatedPosts?: boolean;
}
interface UserStatus {
  totalViolationScore: number;
  isMute: boolean;
  muteUntil?: string;
}
export const ForumSidebar = ({
  topPosts,
  currentSubjectId,
  currentPostId,
  showStats = true,
  showRules = true,
  showRelatedPosts = false,
}: ForumSidebarProps) => {
  const navigate = useNavigate();
  const { onlineCount } = useUserOnlineStore();
  const { rules, loadRules, posts } = useForumStore();
  const { user } = useAuthStore();

  const schoolId = user?.schoolId || 1;

  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  useEffect(() => {
    if (showRules) {
      loadRules(schoolId);
    }
  }, [loadRules, showRules, schoolId]);

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await axiosInstance.get(
          `/Forum/user/status?schoolId=${schoolId}`
        );
        if (response.data?.success && response.data?.data) {
          setUserStatus({
            totalViolationScore: response.data.data.totalViolationScore || 0,
            isMute: response.data.data.isMute || false,
            muteUntil: response.data.data.muteUntil,
          });
        }
      } catch (error) {
        console.error("Error fetching user status:", error);
      }
    };

    if (showStats && schoolId) {
      fetchUserStatus();
    }
  }, [schoolId, showStats]);

  const relatedPosts =
    showRelatedPosts && currentSubjectId
      ? posts
          .filter(
            (p) =>
              p.subject_id === currentSubjectId && p.post_id !== currentPostId
          )
          .slice(0, 5)
      : [];

  const handlePostClick = (postId: number) => {
    navigate(`/forum/student/forums/details/${postId}`);
  };

  return (
    <div className="space-y-4">
      {showStats && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-lg">Thống kê</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-sky-600">
                  {onlineCount}
                </div>
                <div className="text-sm text-gray-600">Người online</div>
              </div>
              <div className="text-center pt-4 border-t">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertCircle
                    className={`w-4 h-4 ${
                      !userStatus
                        ? "text-gray-400"
                        : userStatus.isMute
                        ? "text-red-600"
                        : userStatus.totalViolationScore < 30
                        ? "text-red-600"
                        : userStatus.totalViolationScore >= 80
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  />
                  <div
                    className={`text-2xl font-bold ${
                      !userStatus
                        ? "text-gray-400"
                        : userStatus.isMute
                        ? "text-red-600"
                        : userStatus.totalViolationScore < 30
                        ? "text-red-600"
                        : userStatus.totalViolationScore >= 80
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {userStatus ? userStatus.totalViolationScore : "..."}
                  </div>
                </div>
                <div className="text-sm text-gray-600">Điểm của tôi</div>
                {userStatus?.isMute && userStatus.muteUntil && (
                  <div className="text-xs text-red-600 font-medium mt-1">
                    Bạn đã bị mute đến{" "}
                    {new Date(userStatus.muteUntil).toLocaleDateString("vi-VN")}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showRelatedPosts && relatedPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-lg">Bài viết liên quan</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedPosts.map((post) => (
              <div
                key={post.post_id}
                onClick={() => handlePostClick(post.post_id)}
                className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Badge
                    className={`${getSubjectBadgeColor(
                      post.subject_name
                    )} text-white text-xs`}
                  >
                    {post.subject_name}
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                  {post.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{post.author_name}</span>
                  <span>•</span>
                  <span>{post.comment_count} bình luận</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!showRelatedPosts && topPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-lg">Bài viết nổi bật</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPosts.map((post) => (
              <div
                key={post.post_id}
                onClick={() => handlePostClick(post.post_id)}
                className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Badge
                    className={`${getSubjectBadgeColor(
                      post.subject_name
                    )} text-white text-xs`}
                  >
                    {post.subject_name}
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                  {post.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{post.author_name}</span>
                  <span>•</span>
                  <span>{post.comment_count} bình luận</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showRules && rules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-lg">Nội quy diễn đàn</h3>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {rules.map((rule) => (
                <li key={rule.id} className="flex gap-2">
                  <span className="text-sky-600 font-bold flex-shrink-0">
                    {rule.id}.
                  </span>
                  <span className="text-gray-700">{rule.content}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
