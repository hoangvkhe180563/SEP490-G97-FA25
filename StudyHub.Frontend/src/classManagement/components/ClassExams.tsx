import { useEffect, useState } from "react";
import type { Exam } from "../interfaces/Exam";
import useClassStore from "../stores/useClassStore";
import { Link } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { Eye } from "lucide-react";

const ClassExams = (props: { classId: string, isTeacher: boolean }) => {
  console.log(props.isTeacher);
  const [classExams, setClassExams] = useState<Exam[]>([]);

  const { getClassExams } = useClassStore();

  useEffect(() => {
    const classIdNumber = Number(props.classId)
    if (!classIdNumber) {
      return;
    }
    
    const fetchData = async () => {
      const examData = await getClassExams(classIdNumber);
      setClassExams(examData);
    }

    fetchData().catch(console.error);
  }, []);

  if (!Number(props.classId)) {
    return <p className="text-gray-600">Không thể tải bài kiểm tra.</p>
  }

  return (
    <div className="space-y-6">
      {props.isTeacher && (
        <Link
          to={`/exam/teacher/create-exam?classId=${props.classId}`}
        >
          <Button>Tạo bài kiểm tra</Button>
        </Link>
      )}

      {classExams.length === 0 ? (
        <div className="text-gray-600">Hiện chưa có bài kiểm tra nào.</div>
      ) : classExams.map((exam) => (
        <div key={exam.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">{exam.title}</h2>
          <p className="text-gray-600 mb-4 line-clamp-2">{exam.description}</p>
          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span>{exam.totalQuestions} câu hỏi - {exam.duration} phút</span>
            <Link
              to={`/exam/student/exams/${exam.id}`}
            >
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700 space-x-1">
                <Eye /> <span>Xem chi tiết</span>
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ClassExams