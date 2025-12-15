import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Maximize } from 'lucide-react';
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
import toast from 'react-hot-toast';
import type { Question } from '@/exam/interfaces/models/Question';
import Matching from '@/exam/components/Matching';

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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isVisible = useDocumentVisibility();
  const examService = new ExamService();
  const [cheatTimes, setCheatTimes] = useState<number>(0);
  const [cheatDialogOpen, setCheatDialogOpen] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const examRef = useRef(exam);
  const examResultRef = useRef(examResult);
  const studentAnswersRef = useRef(studentAnswers);
  const cheatTimesRef = useRef(cheatTimes);
  const questionsRef = useRef(questions);

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
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.roles.some(role => role.includes("Student"))) {
      navigate("/");
      return;
    }
    if (!Number(id)) {
      toast.error('Không thể tải bài kiểm tra.');
      navigate(-1);
      return;
    }

    let backupInterval = 0;
    const fetchExam = async () => {
      try {
        setLoading(true);
        const fetchedExam = await examService.getExamById(Number(id));
        const fetchedResult = await examService.getProcessingResult(Number(id), user.id);
        if (fetchedResult === null) {
          toast.error("Không tải được bài làm!");
          return;
        }
        const fetchedQuestions = await examService.getExamQuestionsByResultId(fetchedResult.id);
        setExam(fetchedExam);
        setTimeLeft(fetchedExam.duration * 60);
        const timeLeftInMilliseconds = new Date(fetchedResult.finishTime).getTime() - new Date().getTime();
        setTimeLeft(Math.round(timeLeftInMilliseconds / 1000));
        setQuestions(fetchedQuestions);

        setStudentAnswers(_ => {
          const newAnswers: { [key: number]: any } = {};
          fetchedQuestions.forEach((q, index) => {
            const answerEntry = fetchedResult.answers.find(a => a.questionId === q.questionObjectId);
            if (answerEntry) {
              newAnswers[index + 1] = JSON.parse(answerEntry.jsonAnswers);
            }
          });
          return newAnswers;
        });

        setExamResult(fetchedResult);
        backupInterval = setInterval(() => {
          if (!location.href.includes("/exam/student/take-exam")) {
            clearInterval(backupInterval);
          }
          handleBackupExamResult(false);
        }, 30000);
      } catch (err) {
        console.error("Failed to fetch exam:", err);
        toast.error("Không thể tải bài kiểm tra.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
    return () => clearInterval(backupInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitted]);

  useEffect(() => {
    if (isVisible && exam.duration && !isSubmitted) {
      setCheatTimes(ct => ct + 1);
      setCheatDialogOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    if (exam.duration <= 0) return;
    handleBackupExamResult(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cheatTimes])

  const handleAnswerChange = (questionId: number, value: any, type: number, blankIndex: number | null = null) => {
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
      } else if (type === EXAM_TYPE.MATCHING) {
        const [termIndex, defIndex] = value;
        return {
          ...prevAnswers,
          [questionId]: { ...(prevAnswers[questionId] || {}), [termIndex]: defIndex },
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
      toast.error("Có gì đó sai sai. Bạn cần đăng nhập để nộp bài.");
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
  };

  const handleBackupExamResult = async (isSubmission: boolean) => {
    if (isSubmitted) return;
    const currentStudentAnswers = studentAnswersRef.current;
    const currentCheatTimes = cheatTimesRef.current;
    const currentExamResult = examResultRef.current;
    const currentQuestions = questionsRef.current;

    const answeredQuestions = currentQuestions.map((q, index) => {
      const studentAns = currentStudentAnswers[index + 1];

      return {
        questionId: q.questionObjectId ?? '',
        jsonAnswers: q.type === EXAM_TYPE.TEXT_INPUT ? studentAns : JSON.stringify(studentAns),
        isCorrect: false,
      };
    });

    const newResult = {
      ...currentExamResult,
      answers: answeredQuestions,
      cheatTimes: currentCheatTimes,
    }
    setExamResult(newResult);

    const backupSuccess = await examService.updateResult(newResult);
    if (!backupSuccess) {
      toast.error("Không lưu được bài làm!");
      return;
    }
    if (isSubmission) {
      setLoading(true);
      const submitSuccess = await examService.submitResult(newResult.id);
      if (submitSuccess) {
        toast.success('Bạn đã nộp bài thành công!');
        navigate(`/exam/results/${newResult.id}`);
      } else {
        toast.error("Nộp bài thất bại. Vui lòng thử lại.");
        setIsSubmitted(false);
      }
      setLoading(false);
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!exam) {
    return <p className="container mx-auto mt-8 p-4 text-gray-600">Không tìm thấy bài kiểm tra hoặc có lỗi khi tải.</p>;
  }

  return (
    <div id="examScreen" className="bg-white w-full h-full flex flex-col">
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
          <Button variant="ghost" size="icon" asChild className="hover:bg-transparent hover:text-slate-400" onClick={() => document.body.requestFullscreen()}>
            <Maximize className="size-10" />
          </Button>
        </div>
      </div>

      <div className="px-8 py-3 w-full border-b border-gray-400">
        <div className="flex justify-end items-center space-x-4">
          <Button className="bg-blue-500 hover:bg-blue-700" onClick={() => handleBackupExamResult(false)}>Lưu</Button>
        </div>
      </div>
      <div className="px-6 py-6 space-y-3 flex-1 overflow-y-auto">
        {questions.map((question, index) => (
          <div key={question.questionObjectId} id={`q${index + 1}`} tabIndex={0} className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 transition-all focus-within:ring-2 focus-within:ring-blue-500">
            <p className="text-lg font-semibold mb-3 text-gray-800">
              Câu {index + 1}: {question.type !== EXAM_TYPE.FILL_IN_BLANK && <span>{question.questionText}</span>}
            </p>

            {question.type === EXAM_TYPE.SINGLE_CHOICE && (
              <RadioGroup>
                {question.options.map((option, optIndex) => {
                  const id = `q${index + 1}-${optIndex}`;

                  return <div key={id} className="flex items-center gap-3">
                    <RadioGroupItem className="data-[state=checked]:bg-blue-800" id={id} value={id} disabled={isSubmitted} onClick={() => handleAnswerChange(index + 1, optIndex, question.type)} />
                    <label className="m-0" htmlFor={id}>{option}</label>
                  </div>
                }
                )}
              </RadioGroup>
            )}

            {question.type === EXAM_TYPE.MULTI_CHOICE && (
              <div className='space-y-3'>
                {question.options.map((option, optIndex) => {
                  const id = `q${index + 1}-${optIndex}`;

                  return <div key={id} className="flex items-center gap-3">
                    <Checkbox id={id} value={id} className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white" disabled={isSubmitted} onClick={() => handleAnswerChange(index + 1, optIndex, question.type)} />
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
                value={studentAnswers[index + 1] || ''}
                onChange={(e) => handleAnswerChange(index + 1, e.target.value, question.type)}
                disabled={isSubmitted}
              />
            )}

            {question.type === EXAM_TYPE.FILL_IN_BLANK && (
              <div className="mb-4 text-lg">
                {question.questionText.split(BLANK_PLACEHOLDER).map((part, blankIndex) => (
                  <React.Fragment key={blankIndex}>
                    {part}
                    {blankIndex < (question.questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length && (
                      <input
                        type="text"
                        className="inline-block w-32 border border-gray-300 rounded-md p-1 mx-2 text-gray-800 text-base"
                        value={studentAnswers[index + 1]?.[blankIndex] || ''}
                        onChange={(e) => handleAnswerChange(index + 1, e.target.value, question.type, blankIndex)}
                        disabled={isSubmitted}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {question.type === EXAM_TYPE.MATCHING && (
              <div className="space-y-3">
                <Matching
                  initialTerms={question.terms ?? []}
                  initialDefinitions={question.definitions ?? []}
                  currentMatches={studentAnswers[index + 1]}
                  questionNumber={index + 1}
                  handleChange={(key, value) => {
                    handleAnswerChange(index + 1, [key, value], question.type);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-3 py-3 flex gap-3">
        {
          Object.keys(studentAnswers).length > 0 && questions.map((q, index) => {
            let hasAnswered = false;
            switch (q.type) {
              case EXAM_TYPE.SINGLE_CHOICE:
                hasAnswered = studentAnswers[index + 1] !== -1;
                break;
              case EXAM_TYPE.MULTI_CHOICE:
                hasAnswered = studentAnswers[index + 1].length !== 0;
                break;
              case EXAM_TYPE.TEXT_INPUT:
                hasAnswered = studentAnswers[index + 1] !== '';
                break;
              case EXAM_TYPE.FILL_IN_BLANK:
                hasAnswered = studentAnswers[index + 1].every((ans: string) => ans !== '');
                break;
              case EXAM_TYPE.MATCHING: {
                const matchingAnswers = studentAnswers[index + 1] || {};
                const termsCount = q.terms?.length || 0;
                hasAnswered = Object.keys(matchingAnswers).length === termsCount &&
                  Object.values(matchingAnswers).every((val: any) => val !== -1);
                break;
              }
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