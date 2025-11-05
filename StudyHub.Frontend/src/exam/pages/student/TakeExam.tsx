import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Maximize, MinusSquare, PlusSquare, Repeat } from 'lucide-react';
import './TakeExam.css'
import { ExamService } from '@/exam/services/ExamService';
import type { Exam } from '@/exam/interfaces/models/Exam';
import { BLANK_PLACEHOLDER, DEFAULT_EXAM, DEFAULT_EXAM_RESULT, EXAM_TYPE } from '@/exam/constants/Constants';
import { useLoading } from '@/common/hooks/useLoading';
import type { ExamResult } from '@/exam/interfaces/models/ExamResult';
import { Button } from '@/common/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/common/components/ui/radio-group';
import { Checkbox } from '@/common/components/ui/checkbox';
import useDocumentVisibility from '@/exam/hooks/useDocumentVisibility';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/common/components/ui/alert-dialog';
import { useAuthStore } from '@/auth/stores/useAuthStore';
import { calculateFinishTime } from '@/exam/utils/ExamUtils';

const TakeExam = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam>(DEFAULT_EXAM);
  const [examResult, setExamResult] = useState<ExamResult>(DEFAULT_EXAM_RESULT);
  const [studentAnswers, setStudentAnswers] = useState<{
    [key: number]: any;
  }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isVisible = useDocumentVisibility();
  const examService = new ExamService();
  const [cheatTimes, setCheatTimes] = useState<number>(0);
  const [cheatDialogOpen, setCheatDialogOpen] = useState<boolean>(false);

  const examRef = useRef(exam);
  const examResultRef = useRef(examResult);
  const studentAnswersRef = useRef(studentAnswers);
  const cheatTimesRef = useRef(cheatTimes);

  useEffect(() => {
    examRef.current = exam;
  }, [exam]);

  useEffect(() => {
    examResultRef.current = examResult;
  }, [examResult]);

  useEffect(() => {
    studentAnswersRef.current = studentAnswers;
  }, [studentAnswers]);

  useEffect(() => {
    cheatTimesRef.current = cheatTimes;
  }, [cheatTimes]);

  useEffect(() => {
    if (!Number(id) || !user) {
      setError('Không thể tải bài kiểm tra.');
      return;
    }
    const fetchExam = async () => {
      try {
        setLoading(true);
        const fetchedExam = await examService.getExamById(Number(id));
        setExam(fetchedExam);
        setTimeLeft(fetchedExam.duration * 60);

        const examResult: ExamResult = {
          id: 999,
          examId: Number(fetchedExam.id),
          studentId: user.id,
          totalQuestions: fetchedExam.questions.length,
          answers: fetchedExam.questions.map((q) => {
            let initialAnswer;
            switch (q.type) {
              case EXAM_TYPE.SINGLE_CHOICE:
                initialAnswer = -1;
                break;
              case EXAM_TYPE.MULTI_CHOICE:
                initialAnswer = [];
                break;
              case EXAM_TYPE.TEXT_INPUT:
                initialAnswer = '';
                break;
              case EXAM_TYPE.FILL_IN_BLANK:
                const blankCount = (q.questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
                initialAnswer = Array(blankCount).fill('');
            }

            return {
              questionId: q.id,
              studentAnswer: initialAnswer,
              isCorrect: false,
            };
          }),
          cheatTimes: cheatTimes,
          finishDate: calculateFinishTime()
        };
        setExamResult(examResult);
        setStudentAnswers(_ => {
          const newAnswers: { [key: number]: any } = {};
          fetchedExam.questions.forEach((q) => {
            const answerEntry = examResult.answers.find(a => a.questionId === q.id);
            if (answerEntry) {
              newAnswers[q.id] = answerEntry.studentAnswer;
            }
          });
          return newAnswers;
        });
        await examService.backupResult(examResult);
      } catch (err) {
        console.error("Failed to fetch exam:", err);
        setError("Không thể tải bài kiểm tra.");
        setExam(DEFAULT_EXAM);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();

    const backupInterval = setInterval(handleBackupExamResult, 30000);
    return () => clearInterval(backupInterval);
  }, []);

  useEffect(() => {
    if (exam.duration <= 0) return;
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmitExam();
    }
  }, [timeLeft, isSubmitted]);

  useEffect(() => {
    if (isVisible && exam.duration) {
      setCheatTimes(ct => ct + 1);
      setCheatDialogOpen(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (exam.duration <= 0) return;
    handleBackupExamResult(false);
  }, [cheatTimes])

  const handleAnswerChange = (questionId: number, value: any, type: string, blankIndex: number | null = null) => {
    setStudentAnswers((prevAnswers) => {
      if (type === EXAM_TYPE.MULTI_CHOICE) {
        const currentAnswers = prevAnswers[questionId] || [];
        if (currentAnswers.includes(value)) {
          return {
            ...prevAnswers,
            [questionId]: currentAnswers.filter((ans: any) => ans !== value),
          };
        } else {
          return {
            ...prevAnswers,
            [questionId]: [...currentAnswers, value],
          };
        }
      } else if (type === EXAM_TYPE.FILL_IN_BLANK && blankIndex !== null) {
        const currentBlankAnswers = [...(prevAnswers[questionId] || [])];
        currentBlankAnswers[blankIndex] = value;
        return {
          ...prevAnswers,
          [questionId]: currentBlankAnswers,
        };
      }
      return {
        ...prevAnswers,
        [questionId]: value,
      };
    });
  };

  const handleSubmitExam = async () => {
    if (!user) {
      setError("Có gì đó sai sai. Bạn cần đăng nhập để nộp bài.");
      return;
    }

    if (isSubmitted || !exam) return;
    setIsSubmitted(true);

    setExamResult(prev => {
      return {
        ...prev,
        submissionTime: new Date()
      }
    });
    handleBackupExamResult(true);

    try {
      alert('Bạn đã nộp bài thành công!');
      navigate(`/exam/results/${examResult.examId}`);
    } catch (err) {
      console.error("Failed to submit exam:", err);
      setError("Nộp bài thất bại. Vui lòng thử lại.");
      setIsSubmitted(false);
    }
  };

  const handleBackupExamResult = async (isSubmission: boolean) => {
    const currentExam = examRef.current;
    const currentStudentAnswers = studentAnswersRef.current;
    const currentCheatTimes = cheatTimesRef.current;
    const currentExamResult = examResultRef.current;

    const answeredQuestions = currentExam.questions.map((q) => {
      const studentAns = currentStudentAnswers[q.id];

      return {
        questionId: q.id,
        studentAnswer: studentAns,
        isCorrect: false,
      };
    });

    const newResult = {
      ...currentExamResult,
      answers: answeredQuestions,
      cheatTimes: currentCheatTimes
    }
    if (isSubmission) {
      currentExamResult.submissionTime = new Date();
    }
    setExamResult(newResult);

    await examService.backupResult(newResult);
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return <div className="container mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  if (!exam) {
    return <p className="container mx-auto mt-8 p-4 text-gray-600">Không tìm thấy bài kiểm tra hoặc có lỗi khi tải.</p>;
  }

  return (
    <div id="examScreen" className="bg-white w-screen h-screen flex flex-col">
      <div className="w-full bg-blue-900 px-8 py-3 flex justify-between font-black">
        <div className="text-xs text-white">
          <p>{user?.fullname}</p>
          <p className="py-2 line-clamp-1">
            Bài thi: {exam.title} &nbsp;&nbsp;
            Mô tả: {exam.description}
          </p>
        </div>
        <div className="flex items-center text-white gap-3">
          <Clock />
          <span className="text-lg">{formatTime(timeLeft)}</span>
          <Button className="bg-white hover:bg-slate-200 text-blue-800 active:translate-y-[2px] font-bold text-xs" onClick={handleSubmitExam} disabled={isSubmitted || timeLeft === 0}>{isSubmitted ? 'Đã nộp bài' : 'Nộp bài'}</Button>
          <Button variant="ghost" size="icon" asChild className="hover:bg-transparent hover:text-slate-400">
            <Maximize className="size-10" />
          </Button>
        </div>
      </div>

      <div className="px-8 py-3 grid grid-cols-3 w-full border-b border-gray-400">
        <div className="col-start-2 flex justify-center space-x-6 items-center">
          <Button className="border-blue-700" variant="outline">Quay lại</Button>
          <Button className="bg-blue-500 hover:bg-blue-700">Tiếp theo</Button>
        </div>
        <div className="flex justify-end items-center space-x-4">
          <Button className="bg-blue-500 hover:bg-blue-700" onClick={() => handleBackupExamResult(false)}>Lưu</Button>
          <div className="flex space-x-2">
            <Button size="icon" className="bg-blue-800 hover:bg-blue-900 size-6 rounded-sm"><MinusSquare /></Button>
            <Button size="icon" className="bg-blue-800 hover:bg-blue-900 size-6 rounded-sm"><PlusSquare /></Button>
            <Button variant="outline" size="icon" className="size-6 rounded-sm text-blue-600"><Repeat /></Button>
          </div>
        </div>
      </div>
      <div className="px-6 py-6 space-y-3 flex-1 overflow-y-auto">
        {exam.questions.map((question, index) => (
          <div key={question.id} id={`q${question.id}`} tabIndex={0} className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 transition-all focus-within:ring-2 focus-within:ring-blue-500">
            <p className="text-lg font-semibold mb-3 text-gray-800">
              Câu {index + 1}: {question.type !== EXAM_TYPE.FILL_IN_BLANK && <span>{question.questionText}</span>}
            </p>

            {question.type === EXAM_TYPE.SINGLE_CHOICE && (
              <RadioGroup>
                {question.options.map((option, optIndex) => {
                  const id = `q${question.id}-${optIndex}`;

                  return <div key={id} className="flex items-center gap-3">
                    <RadioGroupItem className="data-[state=checked]:bg-blue-800" id={id} value={id} disabled={isSubmitted} onClick={() => handleAnswerChange(question.id, optIndex, question.type)} />
                    <label className="m-0" htmlFor={id}>{option}</label>
                  </div>
                }
                )}
              </RadioGroup>
            )}

            {question.type === EXAM_TYPE.MULTI_CHOICE && (
              <div className='space-y-3'>
                {question.options.map((option, optIndex) => {
                  const id = `q${question.id}-${optIndex}`;

                  return <div key={id} className="flex items-center gap-3">
                    <Checkbox id={id} value={id} className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white" disabled={isSubmitted} onClick={() => handleAnswerChange(question.id, optIndex, question.type)} />
                    <label className="m-0" htmlFor={id}>{option}</label>
                  </div>
                })}
              </div>
            )}

            {question.type === EXAM_TYPE.TEXT_INPUT && (
              <input
                tabIndex={-1}
                type="text"
                placeholder='Nhập câu trả lời...'
                className="w-full border border-gray-300 rounded-lg p-2 mt-2 focus:ring-blue-500 focus:border-blue-500"
                value={studentAnswers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                disabled={isSubmitted}
              />
            )}

            {question.type === EXAM_TYPE.FILL_IN_BLANK && (
              <div className="mb-4 text-lg">
                {question.questionText.split(BLANK_PLACEHOLDER).map((part, blankIndex) => (
                  <React.Fragment key={blankIndex}>
                    {part}
                    {blankIndex < (question.questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length && (
                      <input
                        type="text"
                        className="inline-block w-32 border border-gray-300 rounded-md p-1 mx-2 text-gray-800 text-base"
                        value={studentAnswers[question.id]?.[blankIndex] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type, blankIndex)}
                        disabled={isSubmitted}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-3 py-3 flex gap-3">
        {
          exam.questions.map((q, index) => {
            let hasAnswered = false;
            switch (q.type) {
              case EXAM_TYPE.SINGLE_CHOICE:
                hasAnswered = studentAnswers[q.id] !== -1;
                break;
              case EXAM_TYPE.MULTI_CHOICE:
                hasAnswered = studentAnswers[q.id].length !== 0;
                break;
              case EXAM_TYPE.TEXT_INPUT:
                hasAnswered = studentAnswers[q.id] !== '';
                break;
              case EXAM_TYPE.FILL_IN_BLANK:
                hasAnswered = studentAnswers[q.id].every((ans: string) => ans !== '');
                break;
            }

            if (hasAnswered) {
              return <Button key={index} tabIndex={-1} className="size-9 px-2 py-2 rounded-full text-center bg-green-500 hover:bg-green-700 text-black leading-5" onClick={() => location.hash = `#q${index + 1}`}>
                {index + 1}
              </Button>
            } else {
              return <Button key={index} tabIndex={-1} className="size-9 px-2 py-2 rounded-full text-center bg-gray-300 hover:bg-gray-500 text-black leading-5" onClick={() => location.hash = `#q${index + 1}`}>
                {index + 1}
              </Button>
            }
          })
        }
      </div>
      <AlertDialog open={cheatDialogOpen} onOpenChange={setCheatDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-center'>Bạn đã chuyển tab/thu nhỏ màn hình!</AlertDialogTitle>
            <AlertDialogDescription className='text-center'>
              Vui lòng KHÔNG chuyển tab/thu nhỏ màn hình khi làm bài thi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='mx-auto'>
            <AlertDialogAction onClick={() => setCheatDialogOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TakeExam;