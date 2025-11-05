import { useAuthStore } from '@/auth/stores/useAuthStore';
import { Button } from '@/common/components/ui/button';
import { Checkbox } from '@/common/components/ui/checkbox';
import { Label } from '@/common/components/ui/label';
import { useLoading } from '@/common/hooks/useLoading';
import { BLANK_PLACEHOLDER, EXAM_TYPE } from '@/exam/constants/Constants';
import type { Exam } from '@/exam/interfaces/models/Exam';
import type { Question } from '@/exam/interfaces/models/Question';
import { ExamService } from '@/exam/services/ExamService';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

const getFormattedDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const CreateExam = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState<number>(0);
  const [className, setClassName] = useState<string>('');
  const [lessonId, setLessonId] = useState<number>(0);
  const [lessonName, setLessonName] = useState<string>('');
  const navigate = useNavigate();
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examDuration, setExamDuration] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const { setLoading } = useLoading();
  const [excelFileError, setExcelFileError] = useState<string>('');
  const [showAnswers, setShowAnswers] = useState<boolean>(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(false);
  const [openTime, setOpenTime] = useState<string>(getFormattedDateTime(new Date()));
  const [closeTime, setCloseTime] = useState<string>('');
  const examService = new ExamService();

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
      const lessonIdQuery = Number(searchParams.get("lessonId"));
      if (lessonIdQuery) {
        setLessonId(lessonIdQuery);
        const lessonName = await examService.getLessonName(lessonIdQuery);
        setLessonName(lessonName);
      } else if (classIdQuery) {
        setClassId(classIdQuery);
        const className = await examService.getClassName(classIdQuery);
        setClassName(className);
      } else {
        toast.error("Chưa có id của lớp hoặc bài học để tạo bài kiểm tra!");
        navigate("/");
      }
    }
    fetchData().catch(console.error);
  }, [user])

  const handleExcelFileUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files) {
      setExcelFileError("Vui lòng chọn một file Excel.");
      return;
    }
    const file = e.target.files[0];

    setExcelFileError('');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length < 2) {
          setExcelFileError("File Excel không có dữ liệu câu hỏi.");
          return;
        }

        const header: any = json[0]; // Hàng tiêu đề
        const questionRows = json.slice(1); // Dữ liệu câu hỏi

        const newQuestions: Question[] = [];
        let rowErrors: string[] = [];

        questionRows.forEach((row: any, rowIndex) => {
          const question: Question = {
            id: Date.now(),
            type: 'single-choice',
            questionText: '',
            options: [],
            correctAnswer: null
          };
          let isValidRow = true;

          const questionType = String(row[header.indexOf('Loại câu hỏi')] || '').toLowerCase();
          const questionText = String(row[header.indexOf('Tên câu hỏi')] || '').trim();
          const correctAnswerRaw = String(row[header.indexOf('Đáp án đúng')] || '').trim();

          if (!questionType || !questionText || !correctAnswerRaw) {
            rowErrors.push(`Hàng ${rowIndex + 2}: Thiếu loại câu hỏi, nội dung hoặc đáp án đúng.`);
            isValidRow = false;
          }

          if (isValidRow) {
            question.id = Date.now() + rowIndex;
            question.questionText = questionText;
            question.type = questionType as "single-choice" | "multiple-choice" | "text-input" | "fill-blank";
            question.options = [];

            if (questionType === EXAM_TYPE.SINGLE_CHOICE || questionType === EXAM_TYPE.MULTI_CHOICE) {
              const options: string[] = [];
              for (let i = header.indexOf('Các đáp án…'); i < row.length; i++) {
                const optionValue = row[i];
                if (optionValue !== undefined && optionValue !== null && String(optionValue).trim() !== '') {
                  options.push(String(optionValue).trim());
                }
              }
              if (options.length === 0) {
                rowErrors.push(`Hàng ${rowIndex + 2}: Câu hỏi trắc nghiệm phải có ít nhất một lựa chọn.`);
                isValidRow = false;
              }
              question.options = options;

              if (questionType === EXAM_TYPE.SINGLE_CHOICE) {
                question.correctAnswer = correctAnswerRaw;
                if (!options.includes(question.correctAnswer)) {
                  rowErrors.push(`Hàng ${rowIndex + 2}: Đáp án đúng không nằm trong các lựa chọn.`);
                  isValidRow = false;
                }
              } else {
                const correctAnswersArray = correctAnswerRaw.split(',').map(ans => ans.trim()).filter(ans => ans !== '');
                if (correctAnswersArray.length === 0) {
                  rowErrors.push(`Hàng ${rowIndex + 2}: Câu hỏi nhiều đáp án phải có ít nhất một đáp án đúng.`);
                  isValidRow = false;
                }
                if (!correctAnswersArray.every(ans => options.includes(ans))) {
                  rowErrors.push(`Hàng ${rowIndex + 2}: Một hoặc nhiều đáp án đúng không nằm trong các lựa chọn.`);
                  isValidRow = false;
                }
                question.correctAnswer = correctAnswersArray;
              }
            } else if (questionType === EXAM_TYPE.TEXT_INPUT) {
              question.correctAnswer = correctAnswerRaw;
            } else if (questionType === EXAM_TYPE.FILL_IN_BLANK) {
              const expectedBlanks = (questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
              const correctAnswersArray = correctAnswerRaw.split(',').map(ans => ans.trim()).filter(ans => ans !== '');

              if (expectedBlanks === 0) {
                rowErrors.push(`Hàng ${rowIndex + 2}: Câu hỏi điền khuyết phải chứa ít nhất một placeholder '${BLANK_PLACEHOLDER}'.`);
                isValidRow = false;
              } else if (correctAnswersArray.length !== expectedBlanks) {
                rowErrors.push(`Hàng ${rowIndex + 2}: Số lượng đáp án đúng (${correctAnswersArray.length}) không khớp với số chỗ trống (${expectedBlanks}).`);
                isValidRow = false;
              }
              question.correctAnswer = correctAnswersArray;
            } else {
              rowErrors.push(`Hàng ${rowIndex + 2}: Loại câu hỏi không hợp lệ (${questionType}).`);
              isValidRow = false;
            }
          }

          if (isValidRow) {
            newQuestions.push(question);
          }
        });

        if (rowErrors.length > 0) {
          setExcelFileError(`Có lỗi khi đọc file Excel:<br/>${rowErrors.slice(0, 10).join('<br/>')} ${rowErrors.length > 10 && '<br/>(Quá nhiều lỗi, vui lòng nhập đúng cấu trúc trong file mẫu!)'}`);
          return;
        }
        if (newQuestions.length === 0) {
          setExcelFileError("Không có câu hỏi hợp lệ nào được tìm thấy trong file Excel.");
          return;
        }

        setQuestions(prevQuestions => [...prevQuestions, ...newQuestions]);
        toast.success(`Đã nhập thành công ${newQuestions.length} câu hỏi từ file Excel.`, {
          style: { maxWidth: 600 }
        });

      } catch (err) {
        console.error("Error reading Excel file:", err);
        setExcelFileError(`Lỗi khi đọc file Excel.`);
      } finally {
        e.target.value = '';
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      setExcelFileError("Lỗi đọc file. Vui lòng thử lại.");
    };

    reader.readAsArrayBuffer(file);
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Chưa đăng nhập vui lòng thử lại!");
      return;
    }
    setLoading(true);

    if (!examTitle || !examDescription || !examDuration || questions.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin và thêm ít nhất một câu hỏi.");
      setLoading(false);
      return;
    }

    if (closeTime && closeTime < openTime) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc!");
      setLoading(false);
      return;
    }

    // Basic validation for questions
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
        const expectedBlanks = (q.questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
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
      }
    }

    const newExam: Exam = {
      id: 999,
      title: examTitle,
      description: examDescription,
      duration: parseInt(examDuration),
      createdBy: user.id,
      questions: questions.map(({ id, ...rest }, index) => {
        return {
          id: index + 1, ...rest
        }
      }),
      showAnswers: showAnswers,
      showCorrectAnswers: showCorrectAnswers,
      classId: classId,
      lessonId: lessonId,
      openTime: new Date(openTime),
      closeTime: closeTime ? new Date(closeTime) : undefined
    };

    try {
      const success = await examService.createExam(newExam);
      if (success) {
        toast.success('Tạo bài kiểm tra thành công!');
        navigate('/exam/teacher/class/exams');
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

  const addQuestion = (type: string) => {
    let newQuestion: Question = {
      id: Date.now(),
      type: 'single-choice',
      questionText: '',
      options: [],
      correctAnswer: ''
    };
    console.log(newQuestion.id);
    newQuestion.type = type as "single-choice" | "multiple-choice" | "text-input" | "fill-blank";

    if (type === EXAM_TYPE.SINGLE_CHOICE) {
      newQuestion.options = [''];
      newQuestion.correctAnswer = '';
    } else if (type === EXAM_TYPE.MULTI_CHOICE) {
      newQuestion.options = [''];
      newQuestion.correctAnswer = [];
    } else if (type === EXAM_TYPE.FILL_IN_BLANK) {
      newQuestion.questionText = `Câu hỏi có ${BLANK_PLACEHOLDER} thứ nhất và ${BLANK_PLACEHOLDER} thứ hai.`;
      newQuestion.correctAnswer = ['', ''];
    }
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: number, field: string, value: any, optionIndex: number | null = null) => {
    setQuestions(questions.map(q => {
      if (q.id !== id) {
        return q;
      }
      if (field === 'questionText' && q.type === EXAM_TYPE.FILL_IN_BLANK) {
        const placeholderRegex = new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        const expectedBlanks = (String(value).match(placeholderRegex) || []).length;
        const currentAnswers = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [];

        if (currentAnswers.length > expectedBlanks) {
          currentAnswers.length = expectedBlanks;
        } else {
          while (currentAnswers.length < expectedBlanks) {
            currentAnswers.push('');
          }
        }

        return { ...q, questionText: value, correctAnswer: currentAnswers };
      }
      if (field === 'options' && optionIndex !== null) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      if (field === 'addOption') {
        return { ...q, options: [...q.options, ''] };
      }
      if (field === 'removeOption' && optionIndex !== null) {
        const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
        if (q.type === EXAM_TYPE.SINGLE_CHOICE && q.correctAnswer === q.options[optionIndex]) {
          return { ...q, options: newOptions, correctAnswer: '' };
        }
        if (q.type === EXAM_TYPE.MULTI_CHOICE) {
          const newCorrectAnswers = q.correctAnswer.filter((ans: any) => ans !== q.options[optionIndex]);
          return { ...q, options: newOptions, correctAnswer: newCorrectAnswers };
        }
        return { ...q, options: newOptions };
      }
      if (field === 'correctAnswerMulti') {
        const currentAnswers = q.correctAnswer;
        if (currentAnswers.includes(value)) {
          return { ...q, correctAnswer: currentAnswers.filter((ans: any) => ans !== value) };
        } else {
          return { ...q, correctAnswer: [...currentAnswers, value] };
        }
      }
      if (field === 'fillBlankAnswer' && optionIndex !== null) {
        const newCorrectAnswers = [...q.correctAnswer];
        newCorrectAnswers[optionIndex] = value;
        return { ...q, correctAnswer: newCorrectAnswers };
      }
      return { ...q, [field]: value };
    }));
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="container mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      <Button variant='outline' className='flex items-center' onClick={() => navigate("/exam/teacher/class/exams")}>
        <ArrowLeft />
        <span>Quay lại</span>
      </Button>

      {classId !== 0 && <h1 className="text-4xl font-bold mb-6 text-gray-800">Tạo bài kiểm tra mới cho lớp {className}</h1>}
      {lessonId !== 0 && <h1 className="text-4xl font-bold mb-6 text-gray-800">Tạo bài kiểm tra mới cho bài học {lessonName}</h1>}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="examTitle" className="block text-gray-700 text-lg font-bold mb-2">
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

        <div className="mb-6">
          <label htmlFor="examDescription" className="block text-gray-700 text-lg font-bold mb-2">
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

        <h2 className="text-3xl font-bold mb-5 text-gray-800 border-b pb-3">Khi nộp bài</h2>
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

        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-2xl font-semibold mb-3 text-blue-800">Nhập câu hỏi từ File Excel</h3>
          <p className="text-gray-700 mb-4">
            Bạn có thể tải lên file Excel (.xlsx) để tự động thêm câu hỏi.
            Đảm bảo file của bạn có các cột (theo thứ tự): <code className="font-mono bg-gray-200 px-1 rounded">Loại câu hỏi</code>,
            <code className="font-mono bg-gray-200 px-1 rounded">Nội dung câu hỏi</code>,
            <code className="font-mono bg-gray-200 px-1 rounded">Câu trả lời đúng</code>,
            và <code className="font-mono bg-gray-200 px-1 rounded">Các câu trả lời khác</code> (nếu là trắc nghiệm).
            Với câu hỏi điền khuyết, dùng ký hiệu <code className="font-mono bg-gray-200 px-1 rounded">"[BLANK]"</code> trong cột "Nội dung câu hỏi" và liệt kê các đáp án đúng trong cột "Câu trả lời đúng" ngăn cách bởi dấu phẩy.
            Xem <a href="/example.xlsx" download className="text-blue-600 hover:underline">file mẫu</a> để biết định dạng.
          </p>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleExcelFileUpload}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
          />
          {excelFileError && <p className="mt-2 text-red-500 text-sm" dangerouslySetInnerHTML={{ __html: excelFileError }}></p>}
        </div>

        <div className="space-y-8">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 relative">
              <div className="flex justify-between items-center mb-2">
                <strong>Câu hỏi {qIndex + 1}</strong>
                <div>
                  <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-600">Xóa</button>
                </div>
              </div>

              <div className="mb-4">
                <span>Loại câu hỏi: </span>
                {q.type === EXAM_TYPE.SINGLE_CHOICE && <span className='font-bold'>Trắc nghiệm một đáp án</span>}
                {q.type === EXAM_TYPE.MULTI_CHOICE && <span className='font-bold'>Trắc nghiệm nhiều đáp án</span>}
                {q.type === EXAM_TYPE.TEXT_INPUT && <span className='font-bold'>Điền từ/Trả lời ngắn</span>}
                {q.type === EXAM_TYPE.FILL_IN_BLANK && <span className='font-bold'>Điền khuyết</span>}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Nội dung câu hỏi</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg h-20 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  value={q.questionText}
                  onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                  required
                ></textarea>
                {q.type === EXAM_TYPE.FILL_IN_BLANK && (
                  <p className="text-sm text-gray-500 mt-1">Sử dụng <b>{BLANK_PLACEHOLDER}</b> để đánh dấu chỗ trống cần điền.</p>
                )}
              </div>

              {(q.type === EXAM_TYPE.SINGLE_CHOICE || q.type === EXAM_TYPE.MULTI_CHOICE) && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Các lựa chọn</label>
                  {q.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center mb-2">
                      {q.type === EXAM_TYPE.SINGLE_CHOICE && (
                        <input
                          type="radio"
                          name={`correctAnswer-${q.id}`}
                          value={option}
                          checked={q.correctAnswer === optIndex}
                          onChange={() => updateQuestion(q.id, 'correctAnswer', optIndex)}
                          className="mr-2 text-blue-600 form-radio"
                        />
                      )}
                      {q.type === EXAM_TYPE.MULTI_CHOICE && (
                        <input
                          type="checkbox"
                          name={`correctAnswer-${q.id}`}
                          value={option}
                          checked={q.correctAnswer.includes(optIndex)}
                          onChange={() => updateQuestion(q.id, 'correctAnswerMulti', optIndex)}
                          className="mr-2 text-blue-600 form-checkbox rounded"
                        />
                      )}
                      <input
                        type="text"
                        className="grow p-2 border border-gray-300 rounded-lg text-gray-800"
                        value={option}
                        onChange={(e) => updateQuestion(q.id, 'options', e.target.value, optIndex)}
                        required
                      />
                      {q.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => updateQuestion(q.id, 'removeOption', null, optIndex)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateQuestion(q.id, 'addOption', null)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Thêm lựa chọn
                  </button>
                </div>
              )}

              {q.type === EXAM_TYPE.TEXT_INPUT && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Đáp án đúng</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                    required
                  />
                </div>
              )}

              {q.type === EXAM_TYPE.FILL_IN_BLANK && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Các đáp án đúng cho chỗ trống</label>
                  {(q.questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).map((_, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <span className="mr-2 text-gray-600">Chỗ trống {index + 1}:</span>
                      <input
                        type="text"
                        className="grow p-2 border border-gray-300 rounded-lg text-gray-800"
                        value={q.correctAnswer[index] || ''}
                        onChange={(e) => updateQuestion(q.id, 'fillBlankAnswer', e.target.value, index)}
                        required
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 space-x-4">
          <button
            type="button"
            onClick={() => addQuestion(EXAM_TYPE.SINGLE_CHOICE)}
            className="px-5 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Thêm câu trắc nghiệm (1 đáp án)
          </button>
          <button
            type="button"
            onClick={() => addQuestion(EXAM_TYPE.MULTI_CHOICE)}
            className="px-5 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Thêm câu trắc nghiệm (Nhiều đáp án)
          </button>
          <button
            type="button"
            onClick={() => addQuestion(EXAM_TYPE.TEXT_INPUT)}
            className="px-5 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            Thêm câu điền từ/trả lời ngắn
          </button>
          <button
            type="button"
            onClick={() => addQuestion(EXAM_TYPE.FILL_IN_BLANK)}
            className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Thêm câu điền khuyết
          </button>
        </div>

        <div className="mt-10 text-center">
          <button
            type="submit"
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xl font-bold"
          >
            Lưu bài kiểm tra
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;