import { Button } from '@/common/components/ui/button';
import { useLoading } from '@/common/hooks/useLoading';
import { DEFAULT_EXAM } from '@/exam/constants/Constants';
import type { Exam } from '@/exam/interfaces/models/Exam';
import type { ExamResult } from '@/exam/interfaces/models/ExamResult';
import { ExamService } from '@/exam/services/ExamService';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const ViewExamHistory = () => {
  const { id } = useParams();
  const [exam, setExam] = useState<Exam>(DEFAULT_EXAM);
  const [results, setResults] = useState<ExamResult[]>([]);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const examService = new ExamService();

  useEffect(() => {
    if (!Number(id)) {
      setError('Không thể tải dữ liệu.');
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedExam, fetchedResults] = await Promise.all([
          examService.getExamById(Number(id)),
          examService.getResultsByExamId(Number(id)),
        ]);
        setExam(fetchedExam);
        setResults(fetchedResults || []);
      } catch (err) {
        console.error('Failed to load exam results:', err);
        setError('Không thể tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (error) return <div className="container mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  if (!exam) return <p className="container mx-auto mt-8 p-4 text-gray-600">Không tìm thấy bài kiểm tra.</p>;

  return (
    <div className="container mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      <Button variant='outline' className='flex items-center' onClick={() => navigate('/exam/teacher/exams')}>
        <ArrowLeft />
        <span>Quay lại</span>
      </Button>

      <h1 className="text-3xl font-bold mb-3">Chi tiết bài kiểm tra: {exam.title}</h1>
      <p className="text-gray-700 mb-2">{exam.description}</p>
      <p className="text-sm text-gray-500 mb-4">Thời lượng: {exam.duration} phút — Số câu hỏi: {exam.questions.length}</p>
      <p>Cho phép học sinh xem đáp án: <b>{exam.showAnswers ? 'Có' : 'Không'}</b></p>
      <p className='mb-5'>Cho phép học sinh xem câu trả lời đúng/sai: <b>{exam.showCorrectAnswers ? 'Có' : 'Không'}</b></p>

      <div className="mb-6">
        <Link to={`/exam/teacher/exams/${exam.id}/edit`}>
          <Button className='px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600'>
            Sửa bài kiểm tra
          </Button>
        </Link>
      </div>

      <h2 className="text-2xl font-semibold mb-3">Kết quả</h2>
      {results.length === 0 ? (
        <p className="text-gray-600">Chưa có học sinh nộp bài.</p>
      ) : (
        <div className="space-y-4">
          {results.map(r => (
            <div key={r.id} className="p-4 bg-gray-50 border rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">Học sinh: {r.studentId}</p>
                <p className="text-sm text-gray-600">Nộp lúc: {r.submissionDate?.toLocaleString("vi-VN")}</p>
                <p className="text-sm text-gray-700">Điểm: {r.score}</p>
                <p className="text-sm text-gray-700">Số lần chuyển tab/thu nhỏ màn hình: <span className='text-red-600'>{r.cheatTimes}</span></p>
              </div>
              <div>
                <Link to={`/exam/results/${r.id}`}>
                  <Button className='px-3 py-1 bg-green-600 text-white hover:bg-green-700'>
                    Xem chi tiết
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewExamHistory;