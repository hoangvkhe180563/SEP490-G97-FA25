import { LoaderIcon, X } from "lucide-react";
import { BLANK_PLACEHOLDER, EXAM_TYPE } from "../constants/Constants";
import type { Question } from "../interfaces/models/Question";
import { QuestionService } from "../services/QuestionService";
import { useEffect, useState } from "react";
import { Textarea } from "@/common/components/ui/textarea";
import { Button } from "@/common/components/ui/button";
import toast from "react-hot-toast";

const AIQuestionTemplate = (props: { selectedSubjectId: number, selectedGrade: number, questions: Question[], setQuestions: React.Dispatch<React.SetStateAction<Question[]>> }) => {
  const [subjectName, setSubjectName] = useState<string>('Không có');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const questionService = new QuestionService();

  const handleGenerateQuestions = async () => {
    if (prompt.trim().length === 0) {
      toast.error("Vui lòng nhập nội dung tạo câu hỏi!");
      return;
    }

    setLoading(true);
    const generatedQuestions = await questionService.generateAIQuestions(props.selectedSubjectId, props.selectedGrade, prompt);
    if (generatedQuestions.length === 0) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    } else {
      toast.success("Tạo câu hỏi thành công!");
      props.setQuestions(generatedQuestions);
    }
    setLoading(false);
  }

  useEffect(() => {
    const fetchData = async () => {
      const fetchedSubjects = await questionService.getAllSubjects();
      const selectedSubject = fetchedSubjects.find(s => s.id === props.selectedSubjectId);
      if (selectedSubject) {
        setSubjectName(selectedSubject.name);
      }
    }

    fetchData().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQuestion = (id: number, field: string, value: any, optionIndex: number | null = null) => {
    props.setQuestions(props.questions.map(q => {
      if (q.id !== id) {
        return q;
      }
      if (field === 'questionText' && q.type === EXAM_TYPE.FILL_IN_BLANK) {
        const placeholderRegex = new RegExp(BLANK_PLACEHOLDER.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        const expectedBlanks = (String(value).match(placeholderRegex) || []).length;
        const currentAnswers = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [];

        if (currentAnswers.length > expectedBlanks) {
          currentAnswers.length = expectedBlanks;
        } else {
          while (currentAnswers.length < expectedBlanks) {
            currentAnswers.push('');
          }
        }

        return { ...q, questionText: value, correctAnswer: currentAnswers };
      }
      if (field === 'options' && optionIndex !== null) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      if (field === 'addOption') {
        return { ...q, options: [...q.options, ''] };
      }
      if (field === 'removeOption' && optionIndex !== null) {
        const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
        if (q.type === EXAM_TYPE.SINGLE_CHOICE && q.correctAnswer === q.options[optionIndex]) {
          return { ...q, options: newOptions, correctAnswer: '' };
        }
        if (q.type === EXAM_TYPE.MULTI_CHOICE) {
          const newCorrectAnswers = q.correctAnswer.filter((ans: any) => ans !== q.options[optionIndex]);
          return { ...q, options: newOptions, correctAnswer: newCorrectAnswers };
        }
        return { ...q, options: newOptions };
      }
      if (field === 'correctAnswerMulti') {
        const currentAnswers = q.correctAnswer;
        if (currentAnswers.includes(value)) {
          return { ...q, correctAnswer: currentAnswers.filter((ans: any) => ans !== value) };
        } else {
          return { ...q, correctAnswer: [...currentAnswers, value] };
        }
      }
      if (field === 'fillBlankAnswer' && optionIndex !== null) {
        const newCorrectAnswers = [...q.correctAnswer];
        newCorrectAnswers[optionIndex] = value;
        return { ...q, correctAnswer: newCorrectAnswers };
      }
      if (field === 'terms' && optionIndex !== null) {
        const newTerms = [...(q.terms || [])];
        newTerms[optionIndex] = value;
        return { ...q, terms: newTerms };
      }
      if (field === 'definitions' && optionIndex !== null) {
        const newDefinitions = [...(q.definitions || [])];
        newDefinitions[optionIndex] = value;
        return { ...q, definitions: newDefinitions };
      }
      if (field === 'addTerm') {
        const newTerms = [...(q.terms || []), ''];
        const newCorrectAnswer = { ...q.correctAnswer, [newTerms.length - 1]: 0 };
        return { ...q, terms: newTerms, correctAnswer: newCorrectAnswer };
      }
      if (field === 'addDefinition') {
        return { ...q, definitions: [...(q.definitions || []), ''] };
      }
      if (field === 'removeTerm' && optionIndex !== null) {
        const newTerms = (q.terms || []).filter((_, idx) => idx !== optionIndex);
        const newCorrectAnswer = { ...q.correctAnswer };
        delete newCorrectAnswer[optionIndex];
        // Reindex the correct answers
        const reindexed: any = {};
        Object.keys(newCorrectAnswer).forEach((key) => {
          const oldIndex = parseInt(key);
          const newIndex = oldIndex > optionIndex ? oldIndex - 1 : oldIndex;
          reindexed[newIndex] = newCorrectAnswer[oldIndex];
        });
        return { ...q, terms: newTerms, correctAnswer: reindexed };
      }
      if (field === 'removeDefinition' && optionIndex !== null) {
        const newDefinitions = (q.definitions || []).filter((_, idx) => idx !== optionIndex);
        // Update correct answer mappings
        const newCorrectAnswer = { ...q.correctAnswer };
        Object.keys(newCorrectAnswer).forEach((termIdx) => {
          if (newCorrectAnswer[termIdx] === optionIndex) {
            newCorrectAnswer[termIdx] = 0;
          } else if (newCorrectAnswer[termIdx] > optionIndex) {
            newCorrectAnswer[termIdx] -= 1;
          }
        });
        return { ...q, definitions: newDefinitions, correctAnswer: newCorrectAnswer };
      }
      if (field === 'matchingAnswer') {
        const [termIndex, defIndex] = value;
        return { ...q, correctAnswer: { ...q.correctAnswer, [termIndex]: defIndex } };
      }
      return { ...q, [field]: value };
    }));
  };

  const removeQuestion = (id: number) => {
    props.setQuestions(props.questions.filter(q => q.id !== id));
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  }

  return (
    <div>
      <div className="flex flex-col space-y-4 items-center">
        <p className="text-center font-bold text-lg">Tạo câu hỏi bằng AI cho môn {subjectName} lớp {props.selectedGrade}</p>
        <Textarea placeholder="Nhập nội dung cần tạo..." className="h-30" value={prompt} onChange={handlePromptChange} />
        <Button className="mx-auto" onClick={handleGenerateQuestions} disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-3">
              <LoaderIcon className="stroke-white animate-spin" />
              Đang tạo...
            </div>
          ) : (
            <span>Tạo câu hỏi</span>
          )}
        </Button>
      </div>
      <div className="space-y-8">
        {props.questions.map((q, qIndex) => (
          <div key={q.id} className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 relative">
            <div className="flex justify-between items-center mb-2">
              <strong>Câu hỏi {qIndex + 1}</strong>
              <div>
                <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-600">Xóa</button>
              </div>
            </div>

            <div className="mb-4">
              <span>Loại câu hỏi: </span>
              {q.type === EXAM_TYPE.SINGLE_CHOICE && <span className='font-bold'>Trắc nghiệm một đáp án</span>}
              {q.type === EXAM_TYPE.MULTI_CHOICE && <span className='font-bold'>Trắc nghiệm nhiều đáp án</span>}
              {q.type === EXAM_TYPE.TEXT_INPUT && <span className='font-bold'>Điền từ/Trả lời ngắn</span>}
              {q.type === EXAM_TYPE.FILL_IN_BLANK && <span className='font-bold'>Điền khuyết</span>}
              {q.type === EXAM_TYPE.MATCHING && <span className='font-bold'>Ghép đôi</span>}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Nội dung câu hỏi</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg h-20 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                value={q.questionText}
                onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                required
              ></textarea>
              {q.type === EXAM_TYPE.FILL_IN_BLANK && (
                <p className="text-sm text-gray-500 mt-1">Sử dụng <b>[BLANK]</b> để đánh dấu chỗ trống cần điền.</p>
              )}
            </div>

            {(q.type === EXAM_TYPE.SINGLE_CHOICE || q.type === EXAM_TYPE.MULTI_CHOICE) && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Các lựa chọn</label>
                {q.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center mb-2">
                    {q.type === EXAM_TYPE.SINGLE_CHOICE && (
                      <input
                        type="radio"
                        name={`correctAnswer-${q.id}`}
                        value={option}
                        checked={q.correctAnswer === optIndex}
                        onChange={() => updateQuestion(q.id, 'correctAnswer', optIndex)}
                        className="mr-2 text-blue-600 form-radio"
                      />
                    )}
                    {q.type === EXAM_TYPE.MULTI_CHOICE && (
                      <input
                        type="checkbox"
                        name={`correctAnswer-${q.id}`}
                        value={option}
                        checked={q.correctAnswer.includes(optIndex)}
                        onChange={() => updateQuestion(q.id, 'correctAnswerMulti', optIndex)}
                        className="mr-2 text-blue-600 form-checkbox rounded"
                      />
                    )}
                    <input
                      type="text"
                      className="grow p-2 border border-gray-300 rounded-lg text-gray-800"
                      value={option}
                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value, optIndex)}
                      required
                    />
                    {q.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => updateQuestion(q.id, 'removeOption', null, optIndex)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <X />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateQuestion(q.id, 'addOption', null)}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Thêm lựa chọn
                </button>
              </div>
            )}

            {q.type === EXAM_TYPE.TEXT_INPUT && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Đáp án đúng</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                  required
                />
              </div>
            )}

            {q.type === EXAM_TYPE.FILL_IN_BLANK && (
              <div className="mb-4">
                <label className="text-gray-700 text-sm font-bold mb-2">Các đáp án đúng cho chỗ trống</label>
                {(q.questionText.match(new RegExp("[BLANK]".replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).map((_, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <span className="mr-2 text-gray-600">Chỗ trống {index + 1}:</span>
                    <input
                      type="text"
                      className="grow p-2 border border-gray-300 rounded-lg text-gray-800"
                      value={q.correctAnswer[index] || ''}
                      onChange={(e) => updateQuestion(q.id, 'fillBlankAnswer', e.target.value, index)}
                      required
                    />
                  </div>
                ))}
              </div>
            )}

            {q.type === EXAM_TYPE.MATCHING && (
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Thuật ngữ</label>
                    {(q.terms || []).map((term, termIndex) => (
                      <div key={termIndex} className="flex items-center mb-2">
                        <input
                          type="text"
                          className="grow p-2 border border-gray-300 rounded-lg text-gray-800"
                          value={term}
                          onChange={(e) => updateQuestion(q.id, 'terms', e.target.value, termIndex)}
                          placeholder={`Thuật ngữ ${termIndex + 1}`}
                          required
                        />
                        {(q.terms || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => updateQuestion(q.id, 'removeTerm', null, termIndex)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, 'addTerm', null)}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                      Thêm thuật ngữ
                    </button>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Định nghĩa</label>
                    {(q.definitions || []).map((definition, defIndex) => (
                      <div key={defIndex} className="flex items-center mb-2">
                        <input
                          type="text"
                          className="grow p-2 border border-gray-300 rounded-lg text-gray-800"
                          value={definition}
                          onChange={(e) => updateQuestion(q.id, 'definitions', e.target.value, defIndex)}
                          placeholder={`Định nghĩa ${defIndex + 1}`}
                          required
                        />
                        {(q.definitions || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => updateQuestion(q.id, 'removeDefinition', null, defIndex)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, 'addDefinition', null)}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                      Thêm định nghĩa
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Ghép đúng</label>
                  {(q.terms || []).map((term, termIndex) => (
                    <div key={termIndex} className="flex items-center mb-2">
                      <span className="mr-2 text-gray-600 w-1/3">{term || `Thuật ngữ ${termIndex + 1}`}:</span>
                      <select
                        className="grow p-2 border border-gray-300 rounded-lg text-gray-800"
                        value={q.correctAnswer?.[termIndex] ?? 0}
                        onChange={(e) => updateQuestion(q.id, 'matchingAnswer', [termIndex, parseInt(e.target.value)])}
                        required
                      >
                        {(q.definitions || []).map((def, defIndex) => (
                          <option key={defIndex} value={defIndex}>
                            {def || `Định nghĩa ${defIndex + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AIQuestionTemplate