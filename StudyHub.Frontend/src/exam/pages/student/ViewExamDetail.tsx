import { useAuthStore } from "@/auth/stores/useAuthStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/common/components/ui/alert-dialog";
import { Button } from "@/common/components/ui/button";
import { useLoading } from "@/common/hooks/useLoading";
import {
  BLANK_PLACEHOLDER,
  DEFAULT_EXAM,
  EXAM_TYPE,
} from "@/exam/constants/Constants";
import type { Exam } from "@/exam/interfaces/models/Exam";
import type { ExamResult } from "@/exam/interfaces/models/ExamResult";
import type { Question } from "@/exam/interfaces/models/Question";
import { ExamService } from "@/exam/services/ExamService";
import { calculateFinishTime } from "@/exam/utils/ExamUtils";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams, Link, useNavigate } from "react-router-dom";

const ViewExamDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [exam, setExam] = useState<Exam>(DEFAULT_EXAM);
  const [hasTaken, setHasTaken] = useState<boolean>(false);
  const [results, setResults] = useState<ExamResult[]>([]);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const examService = new ExamService();

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.roles.some((role) => role.includes("Student"))) {
      navigate("/");
      return;
    }
    if (!Number(id)) {
      setError("Không thể tải dữ liệu.");
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedExam, results] = await Promise.all([
          examService.getExamById(Number(id)),
          examService.getResultsByStudentAndExamId(user.id, Number(id)),
        ]);
        setExam(fetchedExam);
        setResults(
          results.sort((a, b) => {
            const dateA = a.submissionTime ? a.submissionTime.getTime() : 0;
            const dateB = b.submissionTime ? b.submissionTime.getTime() : 0;
            return dateB - dateA;
          })
        );
        setHasTaken(!fetchedExam.isMultipleAttempts && results.length >= 1);
      } catch (err) {
        console.error("Failed to load exam results:", err);
        setError("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleStartExam = async () => {
    setLoading(true);
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    const existingResult = await examService.getProcessingResult(Number(id), user.id);
    if (existingResult) {
      navigate(`/exam/student/take-exam/${exam.id}`);
      return;
    }

    let questions: Question[] = exam.questions;
    if (exam.noRandomQuestions) {
      questions = await examService.generateRandomQuestions(Number(id));
    }

    try {
      const examResult: ExamResult = {
        id: "",
        examId: Number(exam.id),
        studentId: user.id,
        answers: questions.map((q) => {
          let initialAnswer;
          switch (q.type) {
            case EXAM_TYPE.SINGLE_CHOICE:
              initialAnswer = -1;
              break;
            case EXAM_TYPE.MULTI_CHOICE:
              initialAnswer = [];
              break;
            case EXAM_TYPE.TEXT_INPUT:
              initialAnswer = "";
              break;
            case EXAM_TYPE.FILL_IN_BLANK: {
              const blankCount = (
                q.questionText.match(
                  new RegExp(
                    BLANK_PLACEHOLDER.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
                    "g"
                  )
                ) || []
              ).length;
              initialAnswer = Array(blankCount).fill("");
              break;
            }
            case EXAM_TYPE.MATCHING: {
              initialAnswer = {};
              const terms = q.terms;
              if (terms) {
                terms.forEach((_, termIndex) => {
                  initialAnswer[termIndex] = -1;
                });
              }
              break;
            }
          }

          return {
            questionId: q.questionObjectId ?? "",
            jsonAnswers:
              q.type === EXAM_TYPE.TEXT_INPUT
                ? initialAnswer
                : JSON.stringify(initialAnswer),
            isCorrect: false,
          };
        }),
        cheatTimes: 0,
        finishTime: calculateFinishTime(),
      };

      await examService.createResult(examResult);
      navigate(`/exam/student/take-exam/${exam.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Không tạo được bài làm!");
    } finally {
      setLoading(false);
    }
  };

  if (error)
    return (
      <div className="container mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  if (!exam)
    return (
      <p className="container mx-auto mt-8 p-4 text-gray-600">
        Không tìm thấy bài kiểm tra.
      </p>
    );

  return (
    <div className="w-full h-full overflow-y-auto p-6 scrollbar-hide">
      <Button
        variant="outline"
        className="flex items-center"
        onClick={() => history.back()}
      >
        <ArrowLeft />
        <span>Quay lại</span>
      </Button>

      <h1 className="text-3xl font-bold mb-3">
        Chi tiết bài kiểm tra: {exam.title}
      </h1>
      <p className="text-gray-700 mb-2">{exam.description}</p>
      <p className="text-sm text-gray-500 mb-4">
        Thời lượng: {exam.duration} phút — Số câu hỏi: {exam.totalQuestions}
      </p>
      <p className="text-gray-700">
        Thời gian mở: {exam.openTime.toLocaleString("vi-VN")}
      </p>
      {exam.closeTime && (
        <p className="text-gray-700">
          Thời gian đóng: {exam.closeTime.toLocaleString("vi-VN")}
        </p>
      )}

      <div className="mb-6">
        {hasTaken ? (
          <Button disabled className="bg-gray-600 text-white space-x-1">
            <Check /> <span>Đã hoàn thành</span>
          </Button>
        ) : (
          <Button
            onClick={() => setConfirmDialogOpen(true)}
            className="bg-blue-600 text-white hover:bg-blue-700 space-x-1"
          >
            <span>Bắt đầu làm bài</span>
          </Button>
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-3">Kết quả</h2>
      {results.length === 0 ? (
        <p className="text-gray-600">Bạn chưa làm bài kiểm tra này.</p>
      ) : (
        <div className="space-y-4">
          {results.map((r) => (
            <div
              key={r.id}
              className="p-4 bg-gray-50 border rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">Học sinh: {r.studentName}</p>
                <p className="text-sm text-gray-600">
                  Nộp lúc: <b>{r.submissionTime ? r.submissionTime.toLocaleString("vi-VN") : "(Chưa nộp)"}</b>
                </p>
                <p className="text-sm text-gray-700">Điểm: {r.submissionTime ? r.score : "(Chưa nộp)"}</p>
                <p className="text-sm text-gray-700">
                  Số lần chuyển tab/thu nhỏ màn hình:{" "}
                  <span className="text-red-600">{r.cheatTimes}</span>
                </p>
              </div>
              <div>
                <Link to={`/exam/results/${r.id}`}>
                  <Button className="px-3 py-1 bg-green-600 text-white hover:bg-green-700">
                    Xem chi tiết
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Bắt đầu làm bài thi
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Bạn có muốn bắt đầu bài thi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-auto">
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartExam}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ViewExamDetail;
