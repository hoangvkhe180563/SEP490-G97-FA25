import { useEffect, useState, type JSX } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Search, Filter, Repeat, Plus } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/common/components/ui/alert-dialog";
import { Input } from "@/common/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { Label } from "@/common/components/ui/label";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ROLES } from "@/common/constants/Roles";
import { QuestionService } from "@/exam/services/QuestionService";
import type { Subject } from "@/exam/interfaces/models/Subject";
import type { Question } from "@/exam/interfaces/models/Question";
import toast from "react-hot-toast";
import { BLANK_PLACEHOLDER, EXAM_TYPE } from "@/exam/constants/Constants";
import { useLoading } from "@/common/hooks/useLoading";
import { getQuestionType } from "@/exam/utils/QuestionUtils";

const TypeBadge = ({ type }: { type: number }) => {
  const styles: Record<number, string> = {
    0: "bg-purple-500 hover:bg-purple-600",
    1: "bg-indigo-500 hover:bg-indigo-600",
    2: "bg-teal-500 hover:bg-teal-600",
    3: "bg-orange-500 hover:bg-orange-600",
    4: "bg-pink-500 hover:bg-pink-600"
  };

  return <Badge className={styles[type]}>{getQuestionType(type)}</Badge>;
};

const renderFillBlankQuestionText = (question: Question) => {
  if (question.type !== EXAM_TYPE.FILL_IN_BLANK) {
    return '';
  }

  let parts = question.questionText.split(BLANK_PLACEHOLDER);
  const displayedContent: JSX.Element[] = [];
  const blankCount = (question.questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;

  parts.forEach((part: string, index: number) => {
    displayedContent.push(<span key={`part-${index}`}>{part}</span>);
    if (index < blankCount) {
      const ans = question.correctAnswer[index];
      displayedContent.push(
        <span
          key={`blank-${index}`}
          className={`font-semibold inline-block px-2 py-1 mx-1 rounded-md`}
        >
          {ans}
        </span>
      );
    }
  });
  return <>{displayedContent}</>;
};

const QuestionDetailContent = ({ question }: { question: Question }) => {
  return (
    <div className="space-y-4">
      <h2>Nội dung câu hỏi: {question.type !== EXAM_TYPE.FILL_IN_BLANK && question.questionText}</h2>

      {question.type === EXAM_TYPE.SINGLE_CHOICE && (
        <div className="space-y-2">
          {question.options.map((option, optIndex) => (
            <label key={optIndex} className={`flex items-center space-x-2 text-gray-700 rounded-md p-2 ${optIndex === question.correctAnswer && 'border border-green-500 bg-green-100/50'}`}>
              <input
                type="radio"
                name={`result-question-${question.questionObjectId}`}
                value={option}
                checked={optIndex === question.correctAnswer}
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
            return (
              <label key={optIndex} className={`flex items-center space-x-2 text-gray-700 rounded-md p-2 ${question.correctAnswer.includes(optIndex) && 'border border-green-500 bg-green-100/50'}`}>
                <input
                  type="checkbox"
                  name={`result-question-${question.questionObjectId}`}
                  value={option}
                  checked={question.correctAnswer.includes(optIndex)}
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
            value={question.correctAnswer}
            readOnly
            disabled
          />
        </div>
      )}

      {question.type === EXAM_TYPE.FILL_IN_BLANK && renderFillBlankQuestionText(question)}

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
        </div>
      )}
    </div>
  );
};

export default function ListQuestions() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  const [searchParams] = useSearchParams();
  const [subjectData, setSubjectData] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<number>(-1);
  const [subjectFilter, setSubjectFilter] = useState<number>(0);
  const [gradeFilter, setGradeFilter] = useState<number>(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const questionService = new QuestionService();

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.roles.some(r => [ROLES.QUESTION_MANAGER, ROLES.SCHOOL_ADMIN].includes(r))) {
      navigate("/");
    }

    setLoading(true);
    const fetchData = async () => {
      const questionText = searchParams.get("questionText") ?? "";
      const questionType = searchParams.get("questionType") !== null ? (Number(searchParams.get("questionType")) ?? -1) : -1;
      const subjectId = Number(searchParams.get("subjectId")) ?? 0;
      const grade = Number(searchParams.get("grade")) ?? 0;
      const page = searchParams.get("page") !== null ? Number(searchParams.get("page")) : 1;

      setSearchQuery(questionText);
      setTypeFilter(questionType);
      setGradeFilter(grade);
      setPage(page);

      const subjectList = await questionService.getManagerSubjects(user.id);
      if (subjectList.length === 0) {
        return;
      }
      setSubjectData(subjectList);

      const subjectToFind = subjectId === 0 ? subjectList[0].id : subjectId;
      setSubjectFilter(subjectToFind);
      const questionResponse = await questionService.getCommonQuestions(subjectToFind, grade, questionType, page, questionText);
      if (questionResponse) {
        setPage(questionResponse.page);
        setTotalPages(questionResponse.totalPages);
        setTotalQuestions(questionResponse.totalQuestions);
        setQuestions(questionResponse.questions);
      }
    }

    fetchData().catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const handleFilter = (pageOverride?: number) => {
    const currentUrl = location.href.split("?")[0];
    const url = new URL(currentUrl);
    if (searchQuery) {
      url.searchParams.set('questionText', searchQuery);
    }
    if (typeFilter && typeFilter !== -1) {
      url.searchParams.set('questionType', typeFilter.toString());
    }
    if (subjectFilter && subjectFilter !== 0) {
      url.searchParams.set('subjectId', subjectFilter.toString());
    }
    if (gradeFilter && gradeFilter !== 0) {
      url.searchParams.set('grade', gradeFilter.toString());
    }
    const pageToUse = pageOverride ?? 1;
    url.searchParams.set('page', pageToUse.toString());
    window.location.href = url.href;
  }

  const handleDelete = async () => {
    const isDeleted = await questionService.deleteCommonQuestion(selectedQuestionId);
    if (!isDeleted) {
      toast.error("Xóa câu hỏi thất bại!");
    } else {
      toast.success("Xóa câu hỏi thành công!");
      setQuestions((prev) => prev.filter((q) => q.questionObjectId !== selectedQuestionId));
    }
    setSelectedQuestionId('');
  };

  return (
    <div className="p-6 h-full space-y-4 overflow-y-scroll">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ngân hàng câu hỏi</h2>
          <p className="text-sm text-muted-foreground">Các câu hỏi để cho vào bài kiểm tra.</p>
          <p className="text-sm text-muted-foreground">Các môn học của bạn: <b>{subjectData.map(subject => subject.name).join(", ")}</b>.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-sm">
          Tổng số câu hỏi: {totalQuestions}
        </Badge>
      </div>

      <div className="space-x-3">
        <Link to="/exam/manager/questions/create">
          <Button>
            <Plus /> Thêm câu hỏi
          </Button>
        </Link>

        <Button variant="outline" onClick={() => setFilterOpen(prev => !prev)}>
          <Filter />
          Bộ lọc
        </Button>
      </div>

      <div className={`space-y-3 ${filterOpen ? '' : 'hidden'}`}>
        <div className="flex gap-2">
          <Label htmlFor="questionText">Nội dung câu hỏi:</Label>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm câu hỏi..."
              id="questionText"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Label htmlFor="questionType">Loại câu hỏi</Label>
          <div className="w-full sm:w-48">
            <Select value={typeFilter.toString()} onValueChange={(val) => setTypeFilter(Number(val))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">Tất cả</SelectItem>
                <SelectItem value="0">Trắc nghiệm 1 đ.án</SelectItem>
                <SelectItem value="1">Trắc nghiệm nhiều đ.án</SelectItem>
                <SelectItem value="2">Điền từ</SelectItem>
                <SelectItem value="3">Điền khuyết</SelectItem>
                <SelectItem value="4">Nối từ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Label>Môn học</Label>
          <div>
            <Select defaultValue={subjectFilter.toString()} value={subjectFilter.toString()} onValueChange={(val) => setSubjectFilter(Number(val))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjectData.map((subject, index) => (
                  <SelectItem key={`subject-${index}`} value={subject.id.toString()}>{subject.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Label>Lớp</Label>
          <div>
            <Select value={gradeFilter.toString()} onValueChange={(val) => setGradeFilter(Number(val))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Tất cả</SelectItem>
                {Array.from({ length: 12 }, (_, index) => (
                  <SelectItem key={`grade-${index}`} value={(index + 1).toString()}>Lớp {index + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="px-8" onClick={() => handleFilter()}>Tìm</Button>
          <Button className="px-8" variant='outline' onClick={() => location.href = location.href.split("?")[0]}><Repeat /> Đặt lại</Button>
        </div>
      </div>

      <div>
        {questions.length === 0 ? (
          <h2 className="text-xl text-center text-muted-foreground">Không có dữ liệu</h2>
        ) : (
          <div>
            <Table className="rounded-md border">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Nội dung câu hỏi</TableHead>
                  <TableHead className="w-[25%]">Loại</TableHead>
                  <TableHead className="w-[25%] text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.questionObjectId}>
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[350px]" title={question.questionText}>
                        {question.questionText}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={question.type} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Chi tiết câu hỏi</DialogTitle>
                              <DialogDescription>
                                Loại: <TypeBadge type={question.type} />
                              </DialogDescription>
                            </DialogHeader>
                            <QuestionDetailContent question={question} />
                          </DialogContent>
                        </Dialog>

                        <Link to={`/exam/manager/questions/edit/${question.questionObjectId}`}>
                          <Button variant="ghost" size="icon" className="text-amber-500 hover:text-amber-700 hover:bg-amber-50">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Button variant="ghost" size="icon" onClick={() => {
                          setDeleteDialogOpen(true);
                          setSelectedQuestionId(question.questionObjectId ?? '');
                        }} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-end space-x-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  handleFilter(newPage);
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Trước
              </Button>

              {
                Array.from({ length: totalPages }, (_, index) => (
                  <Button
                    key={`page-${index}`}
                    variant="outline"
                    size="sm"
                    className={(index + 1) === page ? 'bg-gray-400 select-none' : ''}
                    onClick={() => {
                      const newPage = index + 1;
                      if (newPage !== page) {
                        setPage(newPage);
                        handleFilter(newPage);
                      }
                    }}
                  >
                    {index + 1}
                  </Button>
                ))
              }
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  handleFilter(newPage);
                }}
              >
                Tiếp <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">Xóa câu hỏi</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Bạn có chắc chắn xóa câu hỏi này?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={() => {
                if (selectedQuestionId) {
                  handleDelete();
                  setDeleteDialogOpen(false);
                }
              }}>
                Xóa
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}