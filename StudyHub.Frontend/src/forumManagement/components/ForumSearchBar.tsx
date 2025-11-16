// src/forumManagement/components/ForumSearchBar.tsx
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Search } from "lucide-react";

interface ForumSearchBarProps {
  searchQuery: string;
  sortBy: string;
  totalResults: number;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export const ForumSearchBar = ({
  searchQuery,
  sortBy,
  totalResults,
  onSearchChange,
  onSortChange,
}: ForumSearchBarProps) => {
  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Tìm kiếm bài viết..."
          className="pl-10 hover:border-sky-300 focus:border-sky-500 transition-colors"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Tìm thấy <strong>{totalResults}</strong> bài viết
        </span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48 hover:border-sky-300 transition-colors">
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
            <SelectItem value="mostCommented">Nhiều bình luận nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
