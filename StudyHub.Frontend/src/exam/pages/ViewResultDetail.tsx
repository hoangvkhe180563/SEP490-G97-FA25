import { useLoading } from '@/common/hooks/useLoading';
import { useEffect, useState, type JSX } from 'react';
import { useParams } from 'react-router-dom';
import { ExamService } from '../services/ExamService';
import type { ExamResult } from '../interfaces/models/ExamResult';
import { BLANK_PLACEHOLDER, DEFAULT_EXAM, DEFAULT_EXAM_RESULT, EXAM_TYPE } from '../constants/Constants';
import type { Question } from '../interfaces/models/Question';
import type { Exam } from '../interfaces/models/Exam';
import { Button } from '@/common/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ViewResultDetail = () => {
  const { id } = useParams();
  const [result, setResult] = useState<ExamResult>(DEFAULT_EXAM_RESULT);
  const [exam, setExam] = useState<Exam>(DEFAULT_EXAM);
  // const [student, setStudent] = useState(null);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string>('');
  const examService = new ExamService();

  useEffect(() => {
    if (!Number(id)) {
      setError('Không thể tải bài kiểm tra.');
      return;
    }
    const fetchResultDetails = async () => {
      try {
        setLoading(true);
        const fetchedResult = await examService.getResultDetail(Number(id));
        if (fetchedResult.examId === 0) {
          setError("Không thể tải chi tiết kết quả.");
          return;
        }
        setResult(fetchedResult);

        const [fetchedExam] = await Promise.all([
          examService.getExamById(fetchedResult.examId),
          // examService.getUserById(fetchedResult.studentId)
        ]);
        setExam(fetchedExam);
        // setStudent(fetchedStudent);

      } catch (err) {
        console.error("Failed to fetch result details:", err);
        setError("Không thể tải chi tiết kết quả.");
      } finally {
        setLoading(false);
      }
    };

    fetchResultDetails();
  }, [id]);

  if (error) {
    return <div className="container mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  if (!result || !exam) { //|| !student
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
    }
    return question.correctAnswer;
  };

  return (
    <div className="container mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      <Button variant='outline' className='flex items-center' onClick={() => history.back()}>
        <ArrowLeft />
        <span>Quay lại</span>
      </Button>

      <h1 className="text-4xl font-bold mb-4 text-gray-800">Chi tiết kết quả</h1>

      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thông tin bài kiểm tra</h2>
        <p className="text-lg text-gray-700"><strong>Tiêu đề:</strong> {exam.title}</p>
        <p className="text-lg text-gray-700"><strong>Mô tả:</strong> {exam.description}</p>
        <p className="text-lg text-gray-700"><strong>Thời lượng:</strong> {exam.duration} phút</p>
        <p className="text-lg text-gray-700"><strong>Tổng số câu hỏi:</strong> {exam.questions.length}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <p className="text-lg text-gray-700"><strong>Học sinh:</strong> [Student.Username]</p>
        <p className="text-lg text-gray-700"><strong>Điểm số:</strong> {result.score}</p>
        <p className="text-lg text-gray-700"><strong>Ngày nộp:</strong> {result.submissionDate?.toLocaleString("vi-VN")}</p>
      </div>

      <h2 className="text-3xl font-bold mb-5 text-gray-800 border-b pb-3">Các câu hỏi và câu trả lời</h2>

      <div className="space-y-8">
        {exam.questions.map((question, index) => {
          const studentAnswerEntry = result.answers.find(ans => ans.questionId === question.id);
          const isCorrect = studentAnswerEntry?.isCorrect;
          const studentAnswer = studentAnswerEntry?.studentAnswer;

          return (
            <div
              key={question.id}
              className={`p-6 rounded-lg shadow-sm border ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }`}
            >
              <p className="text-xl font-semibold mb-3 text-gray-800">
                Câu {index + 1}:
              </p>

              <div className="space-y-3 text-gray-700">
                {question.type === EXAM_TYPE.SINGLE_CHOICE && (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <label key={optIndex} className="flex items-center space-x-2 text-gray-700">
                        <input
                          type="radio"
                          name={`result-question-${question.id}`}
                          value={option}
                          checked={result.answers.find(a => a.questionId === question.id)?.studentAnswer === option}
                          readOnly
                          disabled
                          className="form-radio text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === EXAM_TYPE.MULTI_CHOICE && (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => {
                      const studentAnsArr = Array.isArray(result.answers.find(a => a.questionId === question.id)?.studentAnswer)
                        ? result.answers.find(a => a.questionId === question.id)?.studentAnswer
                        : [];
                      return (
                        <label key={optIndex} className="flex items-center space-x-2 text-gray-700">
                          <input
                            type="checkbox"
                            name={`result-question-${question.id}`}
                            value={option}
                            checked={studentAnsArr.includes(option)}
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
                      value={result.answers.find(a => a.questionId === question.id)?.studentAnswer || ''}
                      readOnly
                      disabled
                    />
                  </div>
                )}

                {question.type === EXAM_TYPE.FILL_IN_BLANK && renderFillBlankQuestionText(question, studentAnswer)}

                <p>
                  <strong>Đáp án đúng:</strong> {renderCorrectAnswer(question)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ViewResultDetail;