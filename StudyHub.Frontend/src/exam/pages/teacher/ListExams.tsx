import { useLoading } from '@/common/hooks/useLoading';
import type { Exam } from '@/exam/interfaces/models/Exam';
import { ExamService } from '@/exam/services/ExamService';
import { MOCK_DATA_USERS } from '@/exam/services/MockData';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ListExams = () => {
  const user = MOCK_DATA_USERS[0];
  const [exams, setExams] = useState<Exam[]>([]);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string>('');
  const examService = new ExamService();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const allExams = await examService.getExams();
        // Filter exams created by the current teacher
        const teacherExams = allExams.filter(exam => exam.createdBy === user.id);
        setExams(teacherExams);
      } catch (err) {
        console.error("Failed to fetch exams:", err);
        setError("Không thể tải danh sách bài kiểm tra.");
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [user]);

  if (error) {
    return <div className="container mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Bài kiểm tra của tôi</h1>
        <Link
          to="/teacher/create-exam"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Tạo bài kiểm tra mới
        </Link>
      </div>

      {exams.length === 0 ? (
        <p className="text-gray-600">Bạn chưa tạo bài kiểm tra nào.</p>
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
                {/* <Link
                  to={`/teacher/exams/${exam.id}/edit`} // Optional: edit exam functionality
                  className="px-4 py-2 mr-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  Sửa
                </Link> */}
                <Link
                  to={`/teacher/exams/${exam.id}/results`} // View results for this specific exam
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                >
                  Xem đáp án
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListExams;