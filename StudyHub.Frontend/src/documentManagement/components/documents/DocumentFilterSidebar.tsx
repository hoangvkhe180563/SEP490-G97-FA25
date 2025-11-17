// src/documentManagement/components/documents/DocumentFilterSidebar.tsx
import { Button } from "@/common/components/ui/button";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Label } from "@/common/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/common/components/ui/collapsible";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DocumentFilterSidebarProps {
  showSchoolDocs: boolean;
  onSchoolDocsChange: (checked: boolean) => void;
  selectedGrades: number[];
  onGradeChange: (gradeId: number) => void;
  selectedSubjects: string[];
  onSubjectChange: (subject: string) => void;
  selectedCategories: number[];
  onCategoryChange: (categoryId: number) => void;
  selectedDocumentLengths: string[];
  onDocumentLengthChange: (length: string) => void;
  selectedDocumentLevels: string[];
  onDocumentLevelChange: (level: string) => void;
  hasSchoolAccess: boolean;
}

const GRADES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `${i + 1}`,
}));

const DocumentFilterSidebar = ({
  showSchoolDocs,
  onSchoolDocsChange,
  selectedGrades,
  onGradeChange,
  selectedSubjects,
  onSubjectChange,
  selectedCategories,
  onCategoryChange,
  selectedDocumentLengths,
  onDocumentLengthChange,
  selectedDocumentLevels,
  onDocumentLevelChange,
  hasSchoolAccess,
}: DocumentFilterSidebarProps) => {
  const { subjects, categories } = useDocumentStore();

  const [openSections, setOpenSections] = useState({
    grades: true,
    subjects: false,
    categories: false,
    documentLength: false,
    documentLevel: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Bộ lọc
        </h3>

        <div className="space-y-3">
          {hasSchoolAccess && (
            <div className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="school-docs"
                  checked={showSchoolDocs}
                  onCheckedChange={(checked) =>
                    onSchoolDocsChange(checked === true)
                  }
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label
                  htmlFor="school-docs"
                  className="text-sm font-medium cursor-pointer text-gray-700"
                >
                  Tài liệu của trường
                </Label>
              </div>
            </div>
          )}

          <Collapsible
            open={openSections.grades}
            onOpenChange={() => toggleSection("grades")}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                <h4 className="font-semibold text-sm text-gray-700 gap-2 flex items-center">
                  Khối lớp
                  {selectedGrades.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                      {selectedGrades.length}
                    </span>
                  )}
                </h4>
                {openSections.grades ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="grid grid-cols-4 gap-2">
                  {GRADES.map((grade) => (
                    <Button
                      key={grade.id}
                      variant={
                        selectedGrades.includes(grade.id)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className={`h-10 font-medium ${
                        selectedGrades.includes(grade.id)
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                          : "hover:bg-blue-50 hover:border-blue-300"
                      }`}
                      onClick={() => onGradeChange(grade.id)}
                    >
                      {grade.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={openSections.subjects}
            onOpenChange={() => toggleSection("subjects")}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors cursor-pointer">
                <h4 className="font-semibold text-sm text-gray-700 gap-2 flex items-center">
                  Môn học
                  {selectedSubjects.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                      {selectedSubjects.length}
                    </span>
                  )}
                </h4>
                {openSections.subjects ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={selectedSubjects.includes(subject.name)}
                        onCheckedChange={() => onSubjectChange(subject.name)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Label
                        htmlFor={`subject-${subject.id}`}
                        className="text-sm cursor-pointer text-gray-700 font-medium flex-1"
                      >
                        {subject.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={openSections.categories}
            onOpenChange={() => toggleSection("categories")}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer">
                <h4 className="font-semibold text-sm text-gray-700 gap-2 flex items-center">
                  Loại tài liệu
                  {selectedCategories.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                      {selectedCategories.length}
                    </span>
                  )}
                </h4>
                {openSections.categories ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => onCategoryChange(category.id)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="text-sm cursor-pointer text-gray-700 font-medium flex-1"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={openSections.documentLength}
            onOpenChange={() => toggleSection("documentLength")}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-amber-300 transition-colors cursor-pointer">
                <h4 className="font-semibold text-sm text-gray-700 gap-2 flex items-center">
                  Độ dài tài liệu
                  {selectedDocumentLengths.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-bold">
                      {selectedDocumentLengths.length}
                    </span>
                  )}
                </h4>
                {openSections.documentLength ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="space-y-2">
                  {["Short", "Medium", "Long"].map((length) => (
                    <div
                      key={length}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`length-${length}`}
                        checked={selectedDocumentLengths.includes(length)}
                        onCheckedChange={() => onDocumentLengthChange(length)}
                        className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                      />
                      <Label
                        htmlFor={`length-${length}`}
                        className="text-sm cursor-pointer text-gray-700 font-medium flex-1"
                      >
                        {length === "Short"
                          ? "Ngắn"
                          : length === "Medium"
                          ? "Trung bình"
                          : "Dài"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={openSections.documentLevel}
            onOpenChange={() => toggleSection("documentLevel")}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 transition-colors cursor-pointer">
                <h4 className="font-semibold text-sm text-gray-700 gap-2 flex items-center">
                  Độ khó
                  {selectedDocumentLevels.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold">
                      {selectedDocumentLevels.length}
                    </span>
                  )}
                </h4>
                {openSections.documentLevel ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="space-y-2">
                  {["Easy", "Medium", "Hard"].map((level) => (
                    <div
                      key={level}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`level-${level}`}
                        checked={selectedDocumentLevels.includes(level)}
                        onCheckedChange={() => onDocumentLevelChange(level)}
                        className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                      <Label
                        htmlFor={`level-${level}`}
                        className="text-sm cursor-pointer text-gray-700 font-medium flex-1"
                      >
                        {level === "Easy"
                          ? "Dễ"
                          : level === "Medium"
                          ? "Trung bình"
                          : "Khó"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default DocumentFilterSidebar;
