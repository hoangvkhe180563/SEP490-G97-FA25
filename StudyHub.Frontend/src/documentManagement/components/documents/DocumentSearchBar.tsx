// StudyHub.Frontend/src/documentManagement/components/documents/DocumentSearchBar.tsx
import { Input } from "@/common/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select"
import { Search } from "lucide-react"

interface DocumentSearchHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
}

const DocumentSearchHeader = ({ searchQuery, onSearchChange, sortBy, onSortChange }: DocumentSearchHeaderProps) => {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Tìm kiếm tài liệu, người đăng..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sắp xếp theo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Mới nhất</SelectItem>
          <SelectItem value="oldest">Cũ nhất</SelectItem>
          <SelectItem value="name">Tên A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default DocumentSearchHeader