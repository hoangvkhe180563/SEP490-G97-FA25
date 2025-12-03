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
import { Eye, Pencil, Trash2, Search, Filter, Repeat, Plus, X } from "lucide-react";
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
import { Paging } from "@/common/components/Paging";

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

// Add helper to count BLANK_PLACEHOLDER occurrences in a given text
const getBlankCount = (text: string) => {
  if (!text) return 0;
  const escaped = BLANK_PLACEHOLDER.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const matches = text.match(new RegExp(escaped, 'g')) || [];
  return matches.length;
};

const renderFillBlankQuestionText = (question: Question) => {
  if (question.type !== EXAM_TYPE.FILL_IN_BLANK) {
    return '';
  }

  const parts = question.questionText.split(BLANK_PLACEHOLDER);
  const displayedContent: JSX.Element[] = [];
  const blankCount = getBlankCount(question.questionText);

  parts.forEach((part: string, index: number) => {
    displayedContent.push(<span key={`part-${index}`}>{part}</span>);
    if (index < blankCount) {
      const ans = question.correctAnswer[index];
      displayedContent.push(
        <span
          key={`blank-${index}`}
          className={`font-semibold inline-block px-2 py-2 bg-gray-200 mx-1 my-0 rounded-md`}
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
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
      const questionTypeRaw = searchParams.get("questionType");
      const questionType = questionTypeRaw !== null ? Number(questionTypeRaw) : -1;
      const subjectIdRaw = searchParams.get("subjectId");
      const subjectId = subjectIdRaw !== null ? Number(subjectIdRaw) : 0;
      const gradeRaw = searchParams.get("grade");
      const grade = gradeRaw !== null ? Number(gradeRaw) : 0;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleOpenEditDialog = (question: Question) => {
    setEditingQuestion({ ...question });
    setEditDialogOpen(true);
  };

  const handleChangeOption = (index: number, value: string) => {
    if (!editingQuestion) return;
    const newOptions = [...editingQuestion.options];
    newOptions[index] = value;
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  // Add new handler to append an empty option to the current editing question
  const handleAddOption = () => {
    if (!editingQuestion) return;
    const opts = editingQuestion.options ? [...editingQuestion.options] : [];
    opts.push('');
    // Ensure multi-choice correctAnswer is an array (leave single-choice correctAnswer unchanged)
    const correct = editingQuestion.type === EXAM_TYPE.MULTI_CHOICE
      ? (Array.isArray(editingQuestion.correctAnswer) ? [...editingQuestion.correctAnswer] : [])
      : editingQuestion.correctAnswer;
    setEditingQuestion({ ...editingQuestion, options: opts, correctAnswer: correct as any });
  };

  // Implement removal of an option and adjust correctAnswer indices accordingly
  const handleRemoveOption = (index: number) => {
    if (!editingQuestion) return;
    const opts = [...(editingQuestion.options || [])];
    if (index < 0 || index >= opts.length) return;
    opts.splice(index, 1);

    let updatedCorrect: any = editingQuestion.correctAnswer;

    if (editingQuestion.type === EXAM_TYPE.SINGLE_CHOICE) {
      const curr = typeof editingQuestion.correctAnswer === 'number' ? editingQuestion.correctAnswer : -1;
      if (curr === index) {
        // If the removed option was selected, choose the first option if exists
        updatedCorrect = opts.length > 0 ? 0 : 0;
      } else if (curr > index) {
        updatedCorrect = curr - 1;
      } else {
        updatedCorrect = curr;
      }
    } else if (editingQuestion.type === EXAM_TYPE.MULTI_CHOICE) {
      const curr = Array.isArray(editingQuestion.correctAnswer) ? [...editingQuestion.correctAnswer] as number[] : [];
      // Remove any occurrence of the removed index, then decrement indices greater than removed index
      const filtered = curr
        .filter(i => i !== index)
        .map(i => (i > index ? i - 1 : i));
      updatedCorrect = filtered;
    }

    setEditingQuestion({ ...editingQuestion, options: opts, correctAnswer: updatedCorrect });
  }

  const handleToggleCorrectAnswer = (index: number) => {
    if (!editingQuestion) return;
    if (editingQuestion.type === EXAM_TYPE.SINGLE_CHOICE) {
      setEditingQuestion({ ...editingQuestion, correctAnswer: index });
      return;
    }
    if (editingQuestion.type === EXAM_TYPE.MULTI_CHOICE) {
      const current = Array.isArray(editingQuestion.correctAnswer) ? editingQuestion.correctAnswer as number[] : [];
      const exists = current.includes(index);
      const updated = exists ? current.filter(i => i !== index) : [...current, index];
      setEditingQuestion({ ...editingQuestion, correctAnswer: updated });
    }
  };

  const handleChangeBlankAnswer = (index: number, value: string) => {
    if (!editingQuestion) return;
    const current = Array.isArray(editingQuestion.correctAnswer) ? [...editingQuestion.correctAnswer] as string[] : [];
    current[index] = value;
    setEditingQuestion({ ...editingQuestion, correctAnswer: current });
  };

  const handleChangeTextAnswer = (value: string) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, correctAnswer: value });
  };

  const handleChangeTerm = (index: number, value: string) => {
    if (!editingQuestion) return;
    const terms = editingQuestion.terms ? [...editingQuestion.terms] : [];
    terms[index] = value;
    setEditingQuestion({ ...editingQuestion, terms });
  };

  const handleChangeDefinition = (index: number, value: string) => {
    if (!editingQuestion) return;
    const definitions = editingQuestion.definitions ? [...editingQuestion.definitions] : [];
    definitions[index] = value;
    setEditingQuestion({ ...editingQuestion, definitions });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;
    setLoading(true);

    if (!editingQuestion.questionText.trim()) {
      toast.error("Vui lòng nhập nội dung cho tất cả các câu hỏi.");
      setLoading(false);
      return;
    }
    if (editingQuestion.type === EXAM_TYPE.SINGLE_CHOICE || editingQuestion.type === EXAM_TYPE.MULTI_CHOICE) {
      if (editingQuestion.options.some(opt => !String(opt).trim())) {
        toast.error(`Vui lòng nhập nội dung cho tất cả các lựa chọn hoặc xóa lựa chọn trống cho câu hỏi "${editingQuestion.questionText}".`);
        setLoading(false);
        return;
      }
    }

    if (editingQuestion.type === EXAM_TYPE.SINGLE_CHOICE) {
      if (!String(editingQuestion.correctAnswer).trim()) {
        toast.error(`Vui lòng chọn đáp án đúng cho câu hỏi "${editingQuestion.questionText}".`);
        setLoading(false);
        return;
      }
    } else if (editingQuestion.type === EXAM_TYPE.MULTI_CHOICE) {
      if (!Array.isArray(editingQuestion.correctAnswer) || editingQuestion.correctAnswer.length === 0 || editingQuestion.correctAnswer.some(ans => !String(ans).trim())) {
        toast.error(`Vui lòng chọn ít nhất một đáp án đúng cho câu hỏi "${editingQuestion.questionText}".`);
        setLoading(false);
        return;
      }
    } else if (editingQuestion.type === EXAM_TYPE.TEXT_INPUT) {
      if (!String(editingQuestion.correctAnswer).trim()) {
        toast.error(`Vui lòng nhập đáp án đúng cho câu hỏi "${editingQuestion.questionText}".`);
        setLoading(false);
        return;
      }
    } else if (editingQuestion.type === EXAM_TYPE.FILL_IN_BLANK) {
      const expectedBlanks = getBlankCount(editingQuestion.questionText);
      if (expectedBlanks === 0) {
        toast.error(`Câu hỏi điền khuyết "${editingQuestion.questionText}" phải chứa ít nhất một placeholder '${BLANK_PLACEHOLDER}'.`);
        setLoading(false);
        return;
      }
      if (!Array.isArray(editingQuestion.correctAnswer) || editingQuestion.correctAnswer.length !== expectedBlanks || editingQuestion.correctAnswer.some(ans => !String(ans).trim())) {
        toast.error(`Vui lòng nhập đầy đủ ${expectedBlanks} đáp án đúng cho câu hỏi điền khuyết "${editingQuestion.questionText}".`);
        setLoading(false);
        return;
      }
    } else if (editingQuestion.type === EXAM_TYPE.MATCHING) {
      if (!editingQuestion.terms || editingQuestion.terms.length === 0 || editingQuestion.terms.some(term => !String(term).trim())) {
        toast.error(`Vui lòng nhập đầy đủ các thuật ngữ cho câu hỏi ghép đôi "${editingQuestion.questionText}".`);
        setLoading(false);
        return;
      }
      if (!editingQuestion.definitions || editingQuestion.definitions.length === 0 || editingQuestion.definitions.some(def => !String(def).trim())) {
        toast.error(`Vui lòng nhập đầy đủ các định nghĩa cho câu hỏi ghép đôi "${editingQuestion.questionText}".`);
        setLoading(false);
        return;
      }
      if (editingQuestion.terms.length !== editingQuestion.definitions.length) {
        toast.error(`Số lượng thuật ngữ và định nghĩa phải bằng nhau cho câu hỏi "${editingQuestion.questionText}".`);
        setLoading(false);
        return;
      }
    }

    const isUpdated = await questionService.updateCommonQuestion(editingQuestion);
    if (!isUpdated) {
      toast.error("Cập nhật câu hỏi thất bại!");
    } else {
      toast.success("Cập nhật câu hỏi thành công!");
      setQuestions(prev => prev.map(q => q.questionObjectId === editingQuestion.questionObjectId ? editingQuestion : q));
      setEditDialogOpen(false);
      setEditingQuestion(null);
    }
    setLoading(false);
  };

  // Add handler to update question text and sync blanks -> answers for FILL_IN_BLANK
  const handleChangeQuestionText = (text: string) => {
    if (!editingQuestion) return;
    if (editingQuestion.type === EXAM_TYPE.FILL_IN_BLANK) {
      const expected = getBlankCount(text);
      const currentAnswers = Array.isArray(editingQuestion.correctAnswer) ? [...editingQuestion.correctAnswer] as string[] : [];
      let adjustedAnswers = [...currentAnswers];

      if (adjustedAnswers.length < expected) {
        while (adjustedAnswers.length < expected) adjustedAnswers.push('');
      } else if (adjustedAnswers.length > expected) {
        adjustedAnswers = adjustedAnswers.slice(0, expected);
      }

      setEditingQuestion({ ...editingQuestion, questionText: text, correctAnswer: adjustedAnswers });
      return;
    }

    setEditingQuestion({ ...editingQuestion, questionText: text });
  };

  return (
    <div className="p-6 h-full space-y-4 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ngân hàng câu hỏi</h2>
          <p className="text-sm text-muted-foreground">Các câu hỏi để cho vào bài kiểm tra.</p>
          <p className="text-sm text-muted-foreground">Các môn học của bạn: <b>{subjectData.map(subject => subject.name).join(", ")}</b>.</p>
          <p className="text-sm text-muted-foreground">Đang hiển thị danh sách câu hỏi môn: <b>{subjectData.find(subject => subject.id === Number(searchParams.get("subjectId") ?? subjectData[0].id))?.name}</b></p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-sm">
          Tổng số câu hỏi: {totalQuestions}
        </Badge>
      </div>

      <div className="space-x-3">
        <Link to={`/exam/manager/questions/create?subjectId=${subjectFilter}&grade=${gradeFilter}`}>
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
                      <div className="truncate max-w-[550px]" title={question.questionText}>
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

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => handleOpenEditDialog(question)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

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

            <Paging
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                handleFilter(newPage);
              }}
            />
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

        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingQuestion(null);
          }
        }}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa câu hỏi</DialogTitle>
              {editingQuestion && (
                <DialogDescription>
                  Loại: <TypeBadge type={editingQuestion.type} />
                </DialogDescription>
              )}
            </DialogHeader>

            {editingQuestion && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-question-text">Nội dung câu hỏi</Label>
                  <Input
                    id="edit-question-text"
                    value={editingQuestion.questionText}
                    onChange={(e) => handleChangeQuestionText(e.target.value)}
                  />
                </div>

                {editingQuestion.type === EXAM_TYPE.SINGLE_CHOICE && (
                  <div className="space-y-2">
                    <Label>Phương án trả lời</Label>
                    {editingQuestion.options.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="edit-single-correct"
                          checked={editingQuestion.correctAnswer === index}
                          onChange={() => handleToggleCorrectAnswer(index)}
                        />
                        <Input
                          value={opt}
                          onChange={(e) => handleChangeOption(index, e.target.value)}
                        />
                        <Button variant="ghost" onClick={() => handleRemoveOption(index)}>
                          <X className="stroke-red-500"/>
                        </Button>
                      </div>
                    ))}
                    <Button onClick={handleAddOption}>Thêm lựa chọn</Button>
                  </div>
                )}

                {editingQuestion.type === EXAM_TYPE.MULTI_CHOICE && (
                  <div className="space-y-2">
                    <Label>Phương án trả lời</Label>
                    {editingQuestion.options.map((opt, index) => {
                      const current = Array.isArray(editingQuestion.correctAnswer) ? editingQuestion.correctAnswer as number[] : [];
                      const checked = current.includes(index);
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleCorrectAnswer(index)}
                          />
                          <Input
                            value={opt}
                            onChange={(e) => handleChangeOption(index, e.target.value)}
                          />
                          <Button variant="ghost" onClick={() => handleRemoveOption(index)}>
                            <X className="stroke-red-500" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button onClick={handleAddOption}>Thêm lựa chọn</Button>
                  </div>
                )}

                {editingQuestion.type === EXAM_TYPE.TEXT_INPUT && (
                  <div className="space-y-2">
                    <Label>Đáp án đúng</Label>
                    <Input
                      value={editingQuestion.correctAnswer ?? ''}
                      onChange={(e) => handleChangeTextAnswer(e.target.value)}
                    />
                  </div>
                )}

                {editingQuestion.type === EXAM_TYPE.FILL_IN_BLANK && (
                  <div className="space-y-2">
                    <Label>Đáp án các chỗ trống</Label>
                    {Array.isArray(editingQuestion.correctAnswer) && (editingQuestion.correctAnswer as string[]).map((ans, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-22">Ô trống {index + 1}</span>
                        <Input
                          value={ans}
                          onChange={(e) => handleChangeBlankAnswer(index, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {editingQuestion.type === EXAM_TYPE.MATCHING && (
                  <div className="space-y-4">
                    <div>
                      <Label>Thuật ngữ</Label>
                      {(editingQuestion.terms || []).map((term, index) => (
                        <div key={index} className="flex items-center gap-2 mt-1">
                          <span className="w-6">{index + 1}.</span>
                          <Input
                            value={term}
                            onChange={(e) => handleChangeTerm(index, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <Label>Định nghĩa</Label>
                      {(editingQuestion.definitions || []).map((definition, index) => (
                        <div key={index} className="flex items-center gap-2 mt-1">
                          <span className="w-6">{String.fromCharCode(65 + index)}.</span>
                          <Input
                            value={definition}
                            onChange={(e) => handleChangeDefinition(index, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => {
                    setEditDialogOpen(false);
                    setEditingQuestion(null);
                  }}>
                    Hủy
                  </Button>
                  <Button onClick={handleUpdateQuestion}>Lưu thay đổi</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
