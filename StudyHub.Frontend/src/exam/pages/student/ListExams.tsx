import { useLoading } from '@/common/hooks/useLoading';
import type { Exam } from '@/exam/interfaces/models/Exam';
import type { ExamResult } from '@/exam/interfaces/models/ExamResult';
import { ExamService } from '@/exam/services/ExamService';
import { MOCK_DATA_USERS } from '@/exam/services/MockData';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ListExams = () => {
  const user = MOCK_DATA_USERS[1];
  const [exams, setExams] = useState<Exam[]>([]);
  const [userResults, setUserResults] = useState<ExamResult[]>([]);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string>('');
  const examService = new ExamService();

  //phân quyền?

  useEffect(() => {
    const fetchExamsAndResults = async () => {
      try {
        setLoading(true);
        const [allExams, results] = await Promise.all([
          examService.getExams(),
          examService.getResultsByStudent(user.id)
        ]);
        setExams(allExams);
        setUserResults(results);
      } catch (err) {
        console.error("Failed to fetch exams or results:", err);
        setError("Không thể tải danh sách bài kiểm tra.");
      } finally {
        setLoading(false);
      }
    };

    fetchExamsAndResults();
  }, [user]);

  const hasTakenExam = (examId: number) => {
    return userResults.some(result => result.examId == examId);
  };

  if (error) {
    return <div className="container mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Các bài kiểm tra có sẵn</h1>

      {exams.length === 0 ? (
        <p className="text-gray-600">Hiện chưa có bài kiểm tra nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
              <h2 className="text-2xl font-semibold mb-2 text-gray-800">{exam.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{exam.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>{exam.questions.length} câu hỏi</span>
                <span>{exam.duration} phút</span>
              </div>
              <div className="flex justify-end">
                {hasTakenExam(exam.id) ? (
                  <span className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm cursor-not-allowed">
                    Đã hoàn thành
                  </span>
                ) : (
                  <Link
                    to={`/exam/student/take-exam/${exam.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Bắt đầu làm bài
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListExams;