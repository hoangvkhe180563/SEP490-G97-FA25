// src/forumManagement/components/ForumHeader.tsx
import { Button } from "@/common/components/ui/button";
import { Plus } from "lucide-react";

interface ForumHeaderProps {
  onCreatePost: () => void;
}

export const ForumHeader = ({ onCreatePost }: ForumHeaderProps) => {
  return (
    <div className="bg-white rounded-2xl p-8 mb-2 border">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600 mb-2">
            Forum Học Tập
          </h1>

          <p className="text-gray-600">
            Nơi học sinh chia sẻ và giải đáp thắc mắc
          </p>
        </div>
        <Button
          onClick={onCreatePost}
          className="bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 hover:brightness-110 transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo bài viết
        </Button>
      </div>
    </div>
  );
};
