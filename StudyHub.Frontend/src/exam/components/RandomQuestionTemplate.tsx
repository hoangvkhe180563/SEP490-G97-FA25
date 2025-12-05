import { Label } from "@/common/components/ui/label"
import { useEffect, useState } from "react"
import { QuestionService } from "../services/QuestionService"
import type { Subject } from "../interfaces/models/Subject"
import { Input } from "@/common/components/ui/input"

interface RandomQuestionTemplateProps {
  selectedSubjectId: number,
  selectedGrade: number,
  selectedRandomQuestions: string,
  setSelectedRandomQuestions: React.Dispatch<React.SetStateAction<string>>,
  isLesson?: boolean
}

const RandomQuestionTemplate = (props: RandomQuestionTemplateProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const questionService = new QuestionService();

  useEffect(() => {
    const fetchData = async () => {
      const fetchedSubjects = await questionService.getAllSubjects();
      setSubjects(fetchedSubjects);
    }

    fetchData().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (props.selectedSubjectId === 0 || props.selectedGrade === 0) {
      return;
    }
    questionService.getTotalQuestions(props.selectedSubjectId, props.selectedGrade).then(result => setTotalQuestions(result));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedSubjectId, props.selectedGrade]);

  return (
    <div>
      <div className="flex">
        <div className="flex items-center gap-3 flex-1">
          <Label>Môn học: <b>{subjects.find(subject => subject.id === props.selectedSubjectId)?.name ?? 'Không có'}</b></Label>
        </div>

        <div className="flex items-center gap-3 flex-1">
          <Label>Lớp: <b>{props.selectedGrade}</b></Label>
        </div>
      </div>
      {
        props.selectedSubjectId === 0 || props.selectedGrade === 0 ? (
          <div className="italic text-lg">Vui lòng chọn môn học và lớp...</div>
        ) : totalQuestions === 0 ? (
          <div className="italic text-lg">Không có câu hỏi trong ngân hàng!</div>
        ) : (
          <div className="flex gap-3 items-center">
            <Label htmlFor="randomQuestions">Số câu hỏi cần lấy ngẫu nhiên: </Label>
            <Input id="randomQuestions" className="w-16" type="number" value={props.selectedRandomQuestions} onChange={(e) => props.setSelectedRandomQuestions(e.target.value)} max={totalQuestions} min={totalQuestions === 0 ? 0 : 1} disabled={totalQuestions === 0} />
            <span>/ {totalQuestions}</span>
          </div>
        )
      }
    </div>
  )
}

export default RandomQuestionTemplate