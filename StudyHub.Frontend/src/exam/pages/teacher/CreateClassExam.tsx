import { useAuthStore } from '@/auth/stores/useAuthStore';
import { Button } from '@/common/components/ui/button';
import { Checkbox } from '@/common/components/ui/checkbox';
import { Label } from '@/common/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/common/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/common/components/ui/tabs';
import { useLoading } from '@/common/hooks/useLoading';
import AIQuestionTemplate from '@/exam/components/AIQuestionTemplate';
import QuestionTemplate from '@/exam/components/QuestionTemplate';
import RandomQuestionTemplate from '@/exam/components/RandomQuestionTemplate';
import { BLANK_PLACEHOLDER, EXAM_TYPE } from '@/exam/constants/Constants';
import type { Exam } from '@/exam/interfaces/models/Exam';
import type { Question } from '@/exam/interfaces/models/Question';
import type { Subject } from '@/exam/interfaces/models/Subject';
import { ExamService } from '@/exam/services/ExamService';
import { QuestionService } from '@/exam/services/QuestionService';
import { isTimeSpanInvalid, getFormattedDateTime } from '@/exam/utils/ExamUtils';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const CreateExam = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState<number>(0);
  const [className, setClassName] = useState<string>('');
  const navigate = useNavigate();
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examDuration, setExamDuration] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const { setLoading } = useLoading();
  const [showAnswers, setShowAnswers] = useState<boolean>(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(false);
  const [isMultipleAttempts, setIsMultipleAttempts] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>('new-questions');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [randomQuestions, setRandomQuestions] = useState<string>('');
  const [openTime, setOpenTime] = useState<string>(getFormattedDateTime(new Date()));
  const [closeTime, setCloseTime] = useState<string>('');
  const examService = new ExamService();
  const questionService = new QuestionService();

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.roles.some(role => role.includes("Teacher"))) {
      navigate("/");
      return;
    }
    const fetchData = async () => {
      const classIdQuery = Number(searchParams.get("classId"));
      if (classIdQuery) {
        setClassId(classIdQuery);
        const className = await examService.getClassName(classIdQuery);
        setClassName(className);
        const grade = await examService.getClassGradeById(classIdQuery);
        setSelectedGrade(grade);
        const userSubjects = await questionService.getManagerSubjects(user.id);
        setSubjects(userSubjects);
      } else {
        toast.error("Chưa có id của lớp để tạo bài kiểm tra!");
        navigate("/");
      }
    }
    fetchData().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Chưa đăng nhập vui lòng thử lại!");
      return;
    }
    setLoading(true);

    if (!examTitle.trim() || !examDescription.trim() || !examDuration) {
      toast.error("Vui lòng điền đầy đủ thông tin và thêm câu hỏi.");
      setLoading(false);
      return;
    }

    if (parseInt(examDuration) <= 0) {
      toast.error("Thời gian làm bài phải > 0!");
      setLoading(false);
      return;
    }

    if (closeTime) {
      if (closeTime < openTime) {
        toast.error("Ngày bắt đầu phải trước ngày kết thúc!");
        setLoading(false);
        return;
      } else if (isTimeSpanInvalid(new Date(openTime), new Date(closeTime), parseInt(examDuration) + 5)) {
        toast.error("Khoảng thời gian bài thi được mở phải lớn hơn thời gian làm bài ít nhất 5 phút!");
        setLoading(false);
        return;
      }
    }

    if (selectedSubjectId === 0) {
      toast.error("Vui lòng chọn môn học!");
      setLoading(false);
      return;
    }

    // Basic validation for questions
    if (selectedTab !== 'bank-questions') {
      if (questions.length === 0) {
        toast.error("Vui lòng điền ít nhất một câu hỏi!");
        setLoading(false);
        return;
      }
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
          if (!String(q.correctAnswer).trim()) {
            toast.error(`Vui lòng chọn đáp án đúng cho câu hỏi "${q.questionText}".`);
            setLoading(false);
            return;
          }
        } else if (q.type === EXAM_TYPE.MULTI_CHOICE) {
          if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0 || q.correctAnswer.some(ans => !String(ans).trim())) {
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
          if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length !== expectedBlanks || q.correctAnswer.some(ans => !String(ans).trim())) {
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
    } else {
      if (!Number(randomQuestions)) {
        toast.error("Vui lòng điền số câu hỏi cần tạo!");
        setLoading(false);
        return;
      } else if (Number(randomQuestions) < 0) {
        toast.error("Số câu hỏi phải > 0!");
        setLoading(false);
        return;
      }
    }

    const newExam: Exam = {
      id: 999,
      title: examTitle,
      description: examDescription,
      duration: parseInt(examDuration),
      createdBy: user.id,
      questions: selectedTab !== 'bank-questions'
        ? questions.map(({ id, ...rest }, index) => {
          return {
            id: index + 1, ...rest
          }
        })
        : [],
      showAnswers: showAnswers,
      showCorrectAnswers: showCorrectAnswers,
      isMultipleAttempts: isMultipleAttempts,
      classId: classId,
      openTime: new Date(openTime),
      closeTime: closeTime ? new Date(closeTime) : undefined,
      subjectId: selectedSubjectId,
      grade: selectedGrade
    };

    if (selectedTab === 'bank-questions') {
      newExam.noRandomQuestions = Number(randomQuestions);
    }

    try {
      const success = await examService.createExam(newExam);
      if (success) {
        toast.success('Tạo bài kiểm tra thành công!');
        navigate(`/class/teacher/${classId}`);
      } else {
        toast.error('Tạo bài kiểm tra thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error("Failed to create exam:", err);
      toast.error("Tạo bài kiểm tra thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-hide">
      <Link to={`/class/teacher/${classId}`}>
        <Button variant='outline' className='flex items-center'>
          <ArrowLeft />
          <span>Quay lại</span>
        </Button>
      </Link>

      {classId !== 0 && <h1 className="text-4xl font-bold mb-6 text-gray-800">Tạo bài kiểm tra mới cho lớp {className}</h1>}

      <div className="mb-6">
        <label htmlFor="examTitle" className="text-gray-700 text-lg font-bold mb-2">
          Tiêu đề bài kiểm tra <span className='text-red-500'>*</span>
        </label>
        <input
          type="text"
          id="examTitle"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="examDescription" className="text-gray-700 text-lg font-bold mb-2">
          Mô tả <span className='text-red-500'>*</span>
        </label>
        <textarea
          id="examDescription"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800 h-24"
          value={examDescription}
          onChange={(e) => setExamDescription(e.target.value)}
          required
        ></textarea>
      </div>

      <div className="mb-6 flex space-x-3">
        <div className='w-1/2 space-x-3 flex items-center'>
          <label htmlFor="openTime" className="text-gray-700 text-lg font-bold">
            Thời gian mở bài thi <span className='text-red-500'>*</span>:
          </label>
          <input
            type="datetime-local"
            id="openTime"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            value={openTime}
            onChange={(e) => {
              setOpenTime(e.target.value)
            }}
            required
          />
        </div>
        <div className='w-1/2 space-x-3 flex items-center'>
          <label htmlFor="closeTime" className="text-gray-700 text-lg font-bold">
            Thời gian đóng bài thi:
          </label>
          <input
            type="datetime-local"
            id="closeTime"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="examDuration" className="block text-gray-700 text-lg font-bold mb-2">
          Thời lượng (phút) <span className='text-red-500'>*</span>
        </label>
        <input
          type="number"
          id="examDuration"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          value={examDuration}
          onChange={(e) => setExamDuration(e.target.value)}
          min="1"
          required
        />
      </div>
      <div className="mb-6">
        <label htmlFor="examDuration" className="block text-gray-700 text-lg font-bold mb-2">
          Môn học <span className='text-red-500'>*</span>
        </label>
        <Select value={selectedSubjectId ? selectedSubjectId.toString() : ""} onValueChange={val => setSelectedSubjectId(Number(val))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn môn học" />
          </SelectTrigger>
          <SelectContent>
            {
              subjects.map((subject, index) => (
                <SelectItem key={index} value={subject.id.toString()}>{subject.name}</SelectItem>
              ))
            }
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 py-3">
        <Checkbox id="multipleTimes" checked={isMultipleAttempts} onCheckedChange={(value: boolean) => setIsMultipleAttempts(value)} />
        <Label htmlFor="multipleTimes">Cho phép thi nhiều lần</Label>
      </div>

      <h2 className="text-3xl font-bold mb-5 text-gray-800 border-b py-3">Khi nộp bài</h2>
      <div className="flex items-center gap-3 py-3">
        <Checkbox id="showAnswers" checked={showAnswers} onCheckedChange={(value: boolean) => {
          setShowAnswers(value);
          if (value === false) {
            setShowCorrectAnswers(false);
          }
        }} />
        <Label htmlFor="showAnswers">Hiện các câu hỏi và câu trả lời</Label>
      </div>
      <div className="flex items-center gap-3 py-3">
        <Checkbox id="showCorrectAnswers" checked={showCorrectAnswers} onCheckedChange={(value: boolean) => setShowCorrectAnswers(value)} disabled={!showAnswers} />
        <Label htmlFor="showCorrectAnswers">Hiện đáp án đúng/sai</Label>
      </div>

      <h2 className="text-3xl font-bold mb-5 text-gray-800 border-b pb-3">Câu hỏi <span className='text-red-500'>*</span></h2>

      <Tabs defaultValue='new-questions' value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className='mx-auto bg-stone-300'>
          <TabsTrigger value='new-questions' className='p-2'>Câu hỏi tự nhập</TabsTrigger>
          <TabsTrigger value='bank-questions' className='p-2'>Câu hỏi từ ngân hàng</TabsTrigger>
          <TabsTrigger value='ai-questions' className='p-2'>Câu hỏi AI</TabsTrigger>
        </TabsList>
        <TabsContent value='new-questions'>
          <QuestionTemplate questions={questions} setQuestions={setQuestions} />
        </TabsContent>
        <TabsContent value='bank-questions'>
          <RandomQuestionTemplate selectedSubjectId={selectedSubjectId} selectedGrade={selectedGrade} selectedRandomQuestions={randomQuestions} setSelectedRandomQuestions={setRandomQuestions} />
        </TabsContent>
        <TabsContent value='ai-questions'>
          {(selectedSubjectId !== 0 && selectedGrade !== 0) ? <AIQuestionTemplate selectedSubjectId={selectedSubjectId} selectedGrade={selectedGrade} questions={questions} setQuestions={setQuestions} /> : <div className='text-center'>Vui lòng nhập môn học!</div>}
        </TabsContent>
      </Tabs>

      <div className="mt-10 text-center">
        <Button
          onClick={handleSubmit}
          className="px-8 py-7 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xl font-bold"
        >
          Lưu bài kiểm tra
        </Button>
      </div>
    </div>
  );
};

export default CreateExam;