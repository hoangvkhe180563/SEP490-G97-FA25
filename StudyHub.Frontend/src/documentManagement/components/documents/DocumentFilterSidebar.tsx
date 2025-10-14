import { useEffect, useState } from "react"
import { Button } from "@/common/components/ui/button"
import { Checkbox } from "@/common/components/ui/checkbox"
import { Label } from "@/common/components/ui/label"
import type { DocumentCategoryDto, GradeDto, SubjectDto } from "@/documentManagement/interfaces/documentApi"
import { documentService } from "@/documentManagement/services/documentService"

interface DocumentFilterSidebarProps {
  showSchoolDocs: boolean
  onSchoolDocsChange: (checked: boolean) => void
  selectedGrades: number[]
  onGradeChange: (gradeId: number) => void
  selectedSubjects: number[]
  onSubjectChange: (subjectId: number) => void
  selectedCategories: number[]
  onCategoryChange: (categoryId: number) => void
}

const DocumentFilterSidebar = ({
  showSchoolDocs,
  onSchoolDocsChange,
  selectedGrades,
  onGradeChange,
  selectedSubjects,
  onSubjectChange,
  selectedCategories,
  onCategoryChange,
}: DocumentFilterSidebarProps) => {
  const [grades, setGrades] = useState<GradeDto[]>([])
  const [subjects, setSubjects] = useState<SubjectDto[]>([])
  const [categories, setCategories] = useState<DocumentCategoryDto[]>([])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [gradesData, subjectsData, categoriesData] = await Promise.all([
          documentService.getGrades(),
          documentService.getSubjects(),
          documentService.getDocumentCategories(),
        ])
        setGrades(gradesData)
        setSubjects(subjectsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Failed to fetch filters:", error)
      }
    }
    fetchFilters()
  }, [])

  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">Bộ lọc</h3>

        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="school-docs"
              checked={showSchoolDocs}
              onCheckedChange={(checked) => onSchoolDocsChange(checked === true)}
            />
            <Label htmlFor="school-docs" className="text-sm cursor-pointer">
              Tài liệu của trường
            </Label>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3">Lớp</h4>
          <div className="grid grid-cols-3 gap-2">
            {grades.map((grade) => (
              <Button
                key={grade.id}
                variant={selectedGrades.includes(grade.id) ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => onGradeChange(grade.id)}
              >
                {grade.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3">Môn học</h4>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`subject-${subject.id}`}
                  checked={selectedSubjects.includes(subject.id)}
                  onCheckedChange={() => onSubjectChange(subject.id)}
                />
                <Label htmlFor={`subject-${subject.id}`} className="text-sm cursor-pointer">
                  {subject.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-3">Loại Tài liệu</h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => onCategoryChange(category.id)}
                />
                <Label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentFilterSidebar