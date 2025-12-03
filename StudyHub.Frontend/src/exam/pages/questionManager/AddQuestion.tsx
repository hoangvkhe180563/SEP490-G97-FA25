import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { useLoading } from "@/common/hooks/useLoading";
import QuestionTemplate from "@/exam/components/QuestionTemplate";
import type { Question } from "@/exam/interfaces/models/Question";
import type { Subject } from "@/exam/interfaces/models/Subject";
import { QuestionService } from "@/exam/services/QuestionService";
import { ROLES } from "@/common/constants/Roles";
import toast from "react-hot-toast";
import { BLANK_PLACEHOLDER, EXAM_TYPE } from "@/exam/constants/Constants";
import { ArrowLeft } from "lucide-react";

const AddQuestion = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  const [searchParams] = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const questionService = new QuestionService();

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.roles.some(r => [ROLES.QUESTION_MANAGER, ROLES.SCHOOL_ADMIN].includes(r))) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const subjectIdQuery = Number(searchParams.get("subjectId")) || 0;
      const gradeQuery = Number(searchParams.get("grade")) || 0;

      const subjectList = await questionService.getManagerSubjects(user.id);
      if (subjectList.length === 0) {
        toast.error("Bạn chưa được gán môn học nào để quản lý câu hỏi.");
        navigate("/exam/manager/questions");
        return;
      }
      setSubjects(subjectList);

      const defaultSubjectId = subjectIdQuery && subjectList.some(s => s.id === subjectIdQuery)
        ? subjectIdQuery
        : subjectList[0].id;
      setSelectedSubjectId(defaultSubjectId);

      const defaultGrade = gradeQuery && gradeQuery > 0 && gradeQuery <= 12 ? gradeQuery : 0;
      setSelectedGrade(defaultGrade);

      setLoading(false);
    };

    fetchData().catch(console.error).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Chưa đăng nhập vui lòng thử lại!");
      return;
    }

    if (!selectedSubjectId || !selectedGrade) {
      toast.error("Vui lòng chọn môn học và lớp.");
      return;
    }

    if (questions.length === 0) {
      toast.error("Vui lòng thêm ít nhất một câu hỏi.");
      return;
    }

    setLoading(true);

    for (const q of questions) {
      if (!q.questionText.trim()) {
        toast.error("Vui lòng nhập nội dung cho tất cả các câu hỏi.");
        setLoading(false);
        return;
      }
      if (q.type === EXAM_TYPE.SINGLE_CHOICE || q.type === EXAM_TYPE.MULTI_CHOICE) {
        if (q.options.some(opt => !String(opt).trim())) {
          toast.error(`Vui lòng nhập nội dung cho tất cả các lựa chọn hoặc xóa lựa chọn trống cho câu hỏi "${q.questionText}".`);
          setLoading(false);
          return;
        }
      }

      if (q.type === EXAM_TYPE.SINGLE_CHOICE) {
        if (q.correctAnswer === undefined || q.correctAnswer === null || String(q.correctAnswer).trim() === "") {
          toast.error(`Vui lòng chọn đáp án đúng cho câu hỏi "${q.questionText}".`);
          setLoading(false);
          return;
        }
      } else if (q.type === EXAM_TYPE.MULTI_CHOICE) {
        if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0) {
          toast.error(`Vui lòng chọn ít nhất một đáp án đúng cho câu hỏi "${q.questionText}".`);
          setLoading(false);
          return;
        }
      } else if (q.type === EXAM_TYPE.TEXT_INPUT) {
        if (!String(q.correctAnswer).trim()) {
          toast.error(`Vui lòng nhập đáp án đúng cho câu hỏi "${q.questionText}".`);
          setLoading(false);
          return;
        }
      } else if (q.type === EXAM_TYPE.FILL_IN_BLANK) {
        const expectedBlanks = (q.questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
        if (expectedBlanks === 0) {
          toast.error(`Câu hỏi điền khuyết "${q.questionText}" phải chứa ít nhất một placeholder '${BLANK_PLACEHOLDER}'.`);
          setLoading(false);
          return;
        }
        if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length !== expectedBlanks) {
          toast.error(`Vui lòng nhập đầy đủ ${expectedBlanks} đáp án đúng cho câu hỏi điền khuyết "${q.questionText}".`);
          setLoading(false);
          return;
        }
      } else if (q.type === EXAM_TYPE.MATCHING) {
        if (!q.terms || q.terms.length === 0 || q.terms.some(term => !String(term).trim())) {
          toast.error(`Vui lòng nhập đầy đủ các thuật ngữ cho câu hỏi ghép đôi "${q.questionText}".`);
          setLoading(false);
          return;
        }
        if (!q.definitions || q.definitions.length === 0 || q.definitions.some(def => !String(def).trim())) {
          toast.error(`Vui lòng nhập đầy đủ các định nghĩa cho câu hỏi ghép đôi "${q.questionText}".`);
          setLoading(false);
          return;
        }
        if (q.terms.length !== q.definitions.length) {
          toast.error(`Số lượng thuật ngữ và định nghĩa phải bằng nhau cho câu hỏi "${q.questionText}".`);
          setLoading(false);
          return;
        }
      }
    }

    const payloadQuestions: Question[] = questions.map(({ id, ...rest }, index) => {
      return {
        id: index + 1,
        ...rest,
        subjectId: selectedSubjectId,
        grade: selectedGrade
      };
    });

    try {
      const success = await questionService.addCommonQuestions(payloadQuestions);
      if (success) {
        toast.success("Thêm câu hỏi thành công!");
        navigate(`/exam/manager/questions?subjectId=${selectedSubjectId}&grade=${selectedGrade}`);
      } else {
        toast.error("Thêm câu hỏi thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Failed to add questions:", err);
      toast.error("Thêm câu hỏi thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <Button variant="outline" className="flex items-center" onClick={() => history.back()}>
        <ArrowLeft />
        <span>Quay lại</span>
      </Button>

      <h1 className="text-3xl font-bold mb-2 text-gray-800">Thêm câu hỏi mới</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Label>Môn học <span className="text-red-500">*</span></Label>
            <Select
              value={selectedSubjectId ? selectedSubjectId.toString() : ""}
              onValueChange={(val) => setSelectedSubjectId(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn môn học" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 flex-1">
            <Label>Lớp <span className="text-red-500">*</span></Label>
            <Select
              value={selectedGrade ? selectedGrade.toString() : ""}
              onValueChange={(val) => setSelectedGrade(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, index) => (
                  <SelectItem key={`grade-${index}`} value={(index + 1).toString()}>
                    Lớp {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-gray-800">Câu hỏi <span className="text-red-500">*</span></h2>
          <QuestionTemplate questions={questions} setQuestions={setQuestions} />
        </div>

        <div className="mt-10 text-center">
          <Button
            type="submit"
            className="px-8 py-7 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xl font-bold"
          >
            Lưu câu hỏi
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddQuestion;
