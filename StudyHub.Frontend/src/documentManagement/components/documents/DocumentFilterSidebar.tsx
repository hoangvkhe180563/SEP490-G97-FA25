import { useEffect, useState } from "react"
import { Button } from "@/common/components/ui/button"
import { Checkbox } from "@/common/components/ui/checkbox"
import { Label } from "@/common/components/ui/label"
import type { DocumentCategoryDto, SubjectDto } from "@/documentManagement/interfaces/documentApi"
import { documentService } from "@/documentManagement/services/documentService"

interface DocumentFilterSidebarProps {
  showSchoolDocs: boolean
  onSchoolDocsChange: (checked: boolean) => void
  selectedGrades: number[]
  onGradeChange: (gradeId: number) => void
  selectedSubjects: string[]
  onSubjectChange: (subject: string) => void
  selectedCategories: number[]
  onCategoryChange: (categoryId: number) => void
  hasSchoolAccess: boolean
}

const GRADES = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `${i + 1}` }))

const DocumentFilterSidebar = ({
  showSchoolDocs,
  onSchoolDocsChange,
  selectedGrades,
  onGradeChange,
  selectedSubjects,
  onSubjectChange,
  selectedCategories,
  onCategoryChange,
  hasSchoolAccess,
}: DocumentFilterSidebarProps) => {
  const [subjects, setSubjects] = useState<SubjectDto[]>([])
  const [categories, setCategories] = useState<DocumentCategoryDto[]>([])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [subjectsData, categoriesData] = await Promise.all([
          documentService.getSubjects(),
          documentService.getDocumentCategories(),
        ])
        setSubjects(subjectsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Failed to fetch filters:", error)
      }
    }
    fetchFilters()
  }, [])

  return (
    <div className="w-72 flex-shrink-0">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-xl mb-6 text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Bộ lọc
        </h3>

        {hasSchoolAccess && (
          <div className="mb-6 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="school-docs"
                checked={showSchoolDocs}
                onCheckedChange={(checked) => onSchoolDocsChange(checked === true)}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor="school-docs" className="text-sm font-medium cursor-pointer text-gray-700">
                🏫 Tài liệu của trường
              </Label>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
            <span className="text-blue-600">📖</span>
            Khối lớp
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((grade) => (
              <Button
                key={grade.id}
                variant={selectedGrades.includes(grade.id) ? "default" : "outline"}
                size="sm"
                className={`h-10 font-medium transition-all ${
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

        <div className="mb-6">
          <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
            <span className="text-green-600">📚</span>
            Môn học
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white transition-colors"
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

        <div>
          <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
            <span className="text-purple-600">📁</span>
            Loại tài liệu
          </h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white transition-colors"
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
  )
}

export default DocumentFilterSidebar