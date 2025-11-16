// src/forumManagement/components/ForumFilterSidebar.tsx
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { Filter, ChevronDown, X } from "lucide-react";
import type { Subject, Flair } from "../interfaces/forum";
import { getSubjectBadgeColor, getFlairColor } from "../utils/colorUtils";

interface ForumFilterSidebarProps {
  subjects: Subject[];
  flairs: Flair[];
  selectedSubjects: number[];
  selectedFlairs: number[];
  onToggleSubject: (subjectId: number) => void;
  onToggleFlair: (flairId: number) => void;
  onClearFilters: () => void;
}

export const ForumFilterSidebar = ({
  subjects,
  flairs,
  selectedSubjects,
  selectedFlairs,
  onToggleSubject,
  onToggleFlair,
  onClearFilters,
}: ForumFilterSidebarProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-sky-600" />
          <h3 className="font-bold text-lg text-sky-400">Bộ lọc</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">
                  Môn học{" "}
                  {selectedSubjects.length > 0 &&
                    `(${selectedSubjects.length})`}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {subjects.map((subject) => (
                <DropdownMenuCheckboxItem
                  key={subject.id}
                  checked={selectedSubjects.includes(subject.id)}
                  onCheckedChange={() => onToggleSubject(subject.id)}
                >
                  {subject.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedSubjects.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedSubjects.map((subjectId) => {
                const subject = subjects.find((s) => s.id === subjectId);
                return (
                  <Badge
                    key={subjectId}
                    className={`${getSubjectBadgeColor(
                      subject?.name || ""
                    )} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => onToggleSubject(subjectId)}
                  >
                    {subject?.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">
                  Loại bài viết{" "}
                  {selectedFlairs.length > 0 && `(${selectedFlairs.length})`}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {Array.isArray(flairs) &&
                flairs.map((flair) => (
                  <DropdownMenuCheckboxItem
                    key={flair.id}
                    checked={selectedFlairs.includes(flair.id)}
                    onCheckedChange={() => onToggleFlair(flair.id)}
                  >
                    {flair.name}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedFlairs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedFlairs.map((flairId) => {
                const flair = flairs.find((f) => f.id === flairId);
                return (
                  <Badge
                    key={flairId}
                    variant="outline"
                    className={`${getFlairColor(
                      flair?.name || ""
                    )} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => onToggleFlair(flairId)}
                  >
                    {flair?.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {(selectedSubjects.length > 0 || selectedFlairs.length > 0) && (
          <Button
            variant="ghost"
            className="w-full text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors"
            onClick={onClearFilters}
          >
            Xóa tất cả bộ lọc
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
