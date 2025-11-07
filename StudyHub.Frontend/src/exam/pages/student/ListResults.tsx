import { useAuthStore } from '@/auth/stores/useAuthStore';
import { useLoading } from '@/common/hooks/useLoading';
import type { ExamResult } from '@/exam/interfaces/models/ExamResult';
import { ExamService } from '@/exam/services/ExamService';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ListResults = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string>('');
  const [examTitles, setExamTitles] = useState<any>({});
  const examService = new ExamService();

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.roles.some(role => role.includes("Student"))) {
      navigate("/");
      return;
    }
    
    const fetchResults = async () => {
      try {
        setLoading(true);
        let fetchedResults = [];
        fetchedResults = await examService.getResultsByStudentAndExamId(user.id);
        fetchedResults = fetchedResults.filter(res => res.studentId == user.id);

        const examIds = [...new Set(fetchedResults.map(r => r.examId))];

        const examTitlePromises = examIds.map(id => examService.getExamById(id).then(exam => ({ id, title: exam.title })));

        const fetchedExamTitles = await Promise.all(examTitlePromises);
        const examTitleMap = fetchedExamTitles.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.title }), {});

        setExamTitles(examTitleMap);
        setResults(fetchedResults);

      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError("Không thể tải danh sách kết quả.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]);

  if (error) {
    return <div className="container mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Lịch sử làm bài (Học sinh [Student.Username])
      </h1>

      {results.length === 0 ? (
        <p className="text-gray-600">Chưa có kết quả nào.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài kiểm tra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm số</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nộp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{examTitles[result.examId] || 'Đang tải...'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.score}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.submissionTime?.toLocaleString("vi-VN")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/results/${result.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListResults;