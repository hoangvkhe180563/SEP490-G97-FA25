import { useLoading } from '@/common/hooks/useLoading';
import { useEffect, useState, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExamService } from '../services/ExamService';
import type { ExamResult } from '../interfaces/models/ExamResult';
import { BLANK_PLACEHOLDER, DEFAULT_EXAM, DEFAULT_EXAM_RESULT, EXAM_TYPE } from '../constants/Constants';
import type { Question } from '../interfaces/models/Question';
import type { Exam } from '../interfaces/models/Exam';
import { Button } from '@/common/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/auth/stores/useAuthStore';

const ViewResultDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResult>(DEFAULT_EXAM_RESULT);
  const [exam, setExam] = useState<Exam>(DEFAULT_EXAM);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string>('');
  const examService = new ExamService();
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(false);
  const [returnCourseId, setReturnCourseId] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!id) {
      setError("Không thể tải bài kiểm tra.");
      return;
    }
    const fetchResultDetails = async () => {
      try {
        setLoading(true);
        const fetchedResult = await examService.getResultDetail(id);
        if (fetchedResult.examId === 0) {
          setError("Không thể tải chi tiết kết quả.");
          return;
        }
        setResult(fetchedResult);

        const fetchedExam = await examService.getExamById(fetchedResult.examId, true);
        setExam(fetchedExam);
        setShowAnswers(fetchedExam.showAnswers);
        setShowCorrectAnswers(fetchedExam.showCorrectAnswers);

        if (fetchedExam.lessonId) {
          const courseId = await examService.getCourseIdByLessonId(fetchedExam.lessonId);

          if (courseId == 0) {
            setError("Bài kiểm tra theo bài học phải có id!");
            return;
          }
          setReturnCourseId(courseId);
        }
      } catch (err) {
        console.error("Failed to fetch result details:", err);
        setError("Không thể tải chi tiết kết quả.");
      } finally {
        setLoading(false);
      }
    };

    fetchResultDetails();
  }, [id, user]);

  if (error) {
    return <div className="container mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  if (!result || !exam) {
    return <p className="container mx-auto mt-8 p-4 text-gray-600">Không tìm thấy chi tiết kết quả.</p>;
  }

  const renderFillBlankQuestionText = (question: Question, studentAnswersArray: string[]) => {
    if (question.type !== EXAM_TYPE.FILL_IN_BLANK) {
      return '';
    }

    let parts = question.questionText.split(BLANK_PLACEHOLDER);
    const displayedContent: JSX.Element[] = [];
    const blankCount = (question.questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;

    parts.forEach((part: string, index: number) => {
      displayedContent.push(<span key={`part-${index}`}>{part}</span>);
      if (index < blankCount) {
        const studentAns = studentAnswersArray?.[index] || 'Không trả lời';
        const correctAns = question.correctAnswer?.[index] || 'N/A';
        const isBlankCorrect = (String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase());

        displayedContent.push(
          <span
            key={`blank-${index}`}
            className={`font-semibold inline-block px-2 py-1 mx-1 rounded-md ${isBlankCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
              }`}
          >
            {studentAns}
          </span>
        );
      }
    });
    return <>{displayedContent}</>;
  };

  const renderCorrectAnswer = (question: Question) => {
    if (question.type === EXAM_TYPE.SINGLE_CHOICE) {
      return question.options[question.correctAnswer];
    } else if (question.type === EXAM_TYPE.MULTI_CHOICE) {
      return question.options.filter((_, index) => question.correctAnswer.includes(index)).join(", ");
    } else if (question.type === EXAM_TYPE.FILL_IN_BLANK) {
      return Array.isArray(question.correctAnswer)
        ? question.correctAnswer.join(', ')
        : 'Không có đáp án đúng';
    } else if (question.type === EXAM_TYPE.MATCHING) {
      const correctMatches = question.correctAnswer as Record<number, number>;
      const matchPairs: string[] = [];
      Object.entries(correctMatches).forEach(([termIdx, defIdx]) => {
        const term = question.terms?.[parseInt(termIdx)] || `Term ${parseInt(termIdx) + 1}`;
        const definition = question.definitions?.[defIdx] || `Definition ${String.fromCharCode(65 + defIdx)}`;
        matchPairs.push(`${term} → ${definition}`);
      });
      return matchPairs.join('; ');
    }
    return question.correctAnswer;
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <Button variant='outline' className='flex items-center' onClick={() => {
        if (user?.roles.some(role => role.includes("Student"))) {
          if (exam.classId) {
            navigate(`/class/student/${exam.classId}`);
            return;
          } else if (exam.lessonId) {
            navigate(`/course/student/courses/${returnCourseId}/lecture/${exam.lessonId}`)
            return;
          }
        } else if (user?.roles.some(role => role.includes("Teacher"))) {
          if (exam.classId) {
            navigate('/exam/teacher/class-exams/' + exam.classId);
            return;
          }
        }
        navigate("/")
      }}>
        <ArrowLeft />
        <span>Quay lại</span>
      </Button>

      <h1 className="text-4xl font-bold mb-4 text-gray-800">Chi tiết kết quả</h1>

      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thông tin bài kiểm tra</h2>
        <p className="text-lg text-gray-700"><strong>Tiêu đề:</strong> {exam.title}</p>
        <p className="text-lg text-gray-700"><strong>Mô tả:</strong> {exam.description}</p>
        <p className="text-lg text-gray-700"><strong>Thời lượng:</strong> {exam.duration} phút</p>
        <p className="text-lg text-gray-700"><strong>Tổng số câu hỏi:</strong> {exam.totalQuestions}</p>
        <p className="text-lg text-gray-700"><strong>Cho phép thi nhiều lần:</strong> {exam.isMultipleAttempts ? 'Có' : 'Không'}</p>
      </div>

      <div className="flex justify-between gap-4 mb-6">
        <div>
          <p className="text-lg text-gray-700"><strong>Học sinh:</strong> {result.studentName}</p>
          {/* <p className="text-lg text-gray-700"><strong>Điểm số:</strong> {result.score}</p> */}
          <p className="text-lg text-gray-700"><strong>Ngày nộp:</strong> {result.submissionTime?.toLocaleString("vi-VN")}</p>
          <p className='text-lg text-gray-700'><strong>Số lần chuyển tab/thu nhỏ màn hình: <span className='text-red-500'>{result.cheatTimes}</span></strong></p>
        </div>
        <div className='mx-10'>
          <p className='text-center'>Điểm:</p>
          <div className='text-3xl w-15 h-15 flex justify-center items-center text-center p-4 rounded-lg bg-blue-100 text-blue-500'>{result.score}</div>
        </div>
      </div>

      {showAnswers ? (
        <>
          <h2 className="text-3xl font-bold mb-5 text-gray-800 border-b pb-3">Các câu hỏi và câu trả lời</h2>

          <div className="space-y-8">
            {exam.questions.map((question, index) => {
              const studentAnswerEntry = result.answers.find(ans => ans.questionId === question.questionObjectId);
              const isCorrect = studentAnswerEntry?.isCorrect;
              const studentAnswer = studentAnswerEntry?.jsonAnswers;

              return (
                <div
                  key={question.questionObjectId}
                  className={`p-6 rounded-lg shadow-sm border ${!showCorrectAnswers ? 'border-gray-300 bg-gray-50' : isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                    }`}
                >
                  <p className="text-xl font-semibold mb-3 text-gray-800">
                    Câu {index + 1}: {question.type !== EXAM_TYPE.FILL_IN_BLANK && question.questionText}
                  </p>

                  <div className="space-y-3 text-gray-700">
                    {question.type === EXAM_TYPE.SINGLE_CHOICE && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center space-x-2 text-gray-700">
                            <input
                              type="radio"
                              name={`result-question-${question.questionObjectId}`}
                              value={option}
                              checked={result.answers.find(a => a.questionId === question.questionObjectId)?.jsonAnswers === optIndex}
                              readOnly
                              disabled
                              className="form-radio text-blue-600"
                            />
                            <span>{option}</span>
                          </label>
                        ))
                        }
                      </div>
                    )}

                    {question.type === EXAM_TYPE.MULTI_CHOICE && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const studentAnsArr = Array.isArray(result.answers.find(a => a.questionId === question.questionObjectId)?.jsonAnswers)
                            ? result.answers.find(a => a.questionId === question.questionObjectId)?.jsonAnswers
                            : [];
                          return (
                            <label key={optIndex} className="flex items-center space-x-2 text-gray-700">
                              <input
                                type="checkbox"
                                name={`result-question-${question.questionObjectId}`}
                                value={option}
                                checked={studentAnsArr.includes(optIndex)}
                                readOnly
                                disabled
                                className="form-checkbox text-blue-600 rounded"
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {question.type === EXAM_TYPE.TEXT_INPUT && (
                      <div>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg p-2 mt-1 bg-gray-100"
                          value={result.answers.find(a => a.questionId === question.questionObjectId)?.jsonAnswers || ''}
                          readOnly
                          disabled
                        />
                      </div>
                    )}

                    {question.type === EXAM_TYPE.FILL_IN_BLANK && renderFillBlankQuestionText(question, studentAnswer)}

                    {question.type === EXAM_TYPE.MATCHING && (
                      <div className="mt-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Thuật ngữ</h4>
                            {(question.terms || []).map((term, termIndex) => (
                              <div key={termIndex} className="p-2 bg-blue-50 border border-blue-200 rounded mb-2">
                                {termIndex + 1}. {term}
                              </div>
                            ))}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Định nghĩa</h4>
                            {(question.definitions || []).map((definition, defIndex) => (
                              <div key={defIndex} className="p-2 bg-green-50 border border-green-200 rounded mb-2">
                                {String.fromCharCode(65 + defIndex)}. {definition}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Các cặp ghép của bạn</h4>
                          {(() => {
                            const studentMatches = studentAnswer;
                            const correctMatches = question.correctAnswer as Record<number, number>;
                            
                            return (question.terms || []).map((term, termIndex) => {
                              const studentDefIdx = studentMatches[termIndex];
                              const correctDefIdx = correctMatches[termIndex];
                              const isMatch = studentDefIdx === correctDefIdx;
                              const studentDef = question.definitions?.[studentDefIdx] || 'Không trả lời';
                              
                              return (
                                <div key={termIndex} className={`flex items-center mb-2 p-2 rounded ${
                                  showCorrectAnswers 
                                    ? (isMatch ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300')
                                    : 'bg-gray-100'
                                }`}>
                                  <span className="w-1/3 font-medium">{termIndex + 1}. {term}</span>
                                  <span className="text-gray-500 mx-2">→</span>
                                  <span className="flex-1">
                                    {studentDefIdx !== undefined && studentDefIdx !== -1 
                                      ? `${String.fromCharCode(65 + studentDefIdx)}. ${studentDef}`
                                      : 'Không trả lời'
                                    }
                                  </span>
                                  {showCorrectAnswers && !isMatch && (
                                    <span className="ml-2 text-sm text-red-600">
                                      (Đúng: {String.fromCharCode(65 + correctDefIdx)}. {question.definitions?.[correctDefIdx]})
                                    </span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {
                      showCorrectAnswers && question.type !== EXAM_TYPE.MATCHING && (
                        <p>
                          <strong>Đáp án đúng:</strong> {renderCorrectAnswer(question)}
                        </p>
                      )
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className='text-lg italic'>Bạn không được phép xem nội dung của bài kiểm tra này.</div>
      )}
    </div>
  );
};

export default ViewResultDetail;