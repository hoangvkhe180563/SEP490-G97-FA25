// .../components/ForumSidebar.tsx
import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Users, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSubjectBadgeColor } from "../utils/colorUtils";
import type { Post } from "../interfaces/forum";
import { useForumStore } from "../stores/useForumStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";

interface ForumSidebarProps {
  totalPosts: number;
  topPosts?: Post[];
}

export const ForumSidebar = ({
  totalPosts,
  topPosts = [],
}: ForumSidebarProps) => {
  const navigate = useNavigate();
  const { rules, loadRules } = useForumStore();
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 1;

  useEffect(() => {
    loadRules(schoolId);
  }, [schoolId, loadRules]);

  return (
    <aside className="col-span-3 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            <h3 className="font-bold text-lg">Thống kê</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
            <span className="text-sm text-gray-600">Tổng bài viết</span>
            <span className="font-bold text-lg text-purple-600">
              {totalPosts}
            </span>
          </div>
        </CardContent>
      </Card>

      {topPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-lg">Bài viết nổi bật</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPosts.map((post) => (
              <button
                key={post.post_id}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() =>
                  navigate(`/forum/student/forums/details/${post.post_id}`)
                }
              >
                <p className="font-medium text-sm mb-2 line-clamp-2">
                  {post.title}
                </p>
                <div className="flex items-center justify-between">
                  <Badge
                    className={`${getSubjectBadgeColor(
                      post.subject_name
                    )} text-white text-xs`}
                  >
                    {post.subject_name}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {post.comment_count} bình luận
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-bold text-lg">Quy tắc Forum</h3>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            {rules.map((rule) => (
              <li key={rule.id} className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>{rule.content}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
};
