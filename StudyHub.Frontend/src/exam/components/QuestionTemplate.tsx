import { useState } from "react";
import * as XLSX from 'xlsx';
import toast from "react-hot-toast";
import { BLANK_PLACEHOLDER, EXAM_TYPE } from "../constants/Constants";
import type { Question } from "../interfaces/models/Question";
import { Plus } from "lucide-react";

const QuestionTemplate = (props: { questions: Question[], setQuestions: React.Dispatch<React.SetStateAction<Question[]>> }) => {
  const [excelFileError, setExcelFileError] = useState<string>('');

  const handleExcelFileUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files) {
      setExcelFileError("Vui lòng chọn một file Excel.");
      return;
    }
    const file = e.target.files[0];

    setExcelFileError('');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

        if (json.length < 2) {
          setExcelFileError("File Excel không có dữ liệu câu hỏi.");
          return;
        }

        const header: any = json[0]; // Hàng tiêu đề
        const questionRows = json.slice(1); // Dữ liệu câu hỏi

        const newQuestions: Question[] = [];
        let rowErrors: string[] = [];

        questionRows.forEach((row: any, rowIndex) => {
          const question: Question = {
            id: Date.now(),
            type: 'single-choice',
            questionText: '',
            options: [],
            correctAnswer: null
          };
          let isValidRow = true;

          const questionType = String(row[header.indexOf('Loại câu hỏi')] || '').toLowerCase();
          const questionText = String(row[header.indexOf('Tên câu hỏi')] || '').trim();
          const correctAnswerRaw = String(row[header.indexOf('Đáp án đúng')] || '').trim();

          if (!questionType || !questionText || !correctAnswerRaw) {
            rowErrors.push(`Hàng ${rowIndex + 2}: Thiếu loại câu hỏi, nội dung hoặc đáp án đúng.`);
            isValidRow = false;
          }

          if (isValidRow) {
            question.id = Date.now() + rowIndex;
            question.questionText = questionText;
            question.type = questionType as "single-choice" | "multiple-choice" | "text-input" | "fill-blank";
            question.options = [];

            if (questionType === EXAM_TYPE.SINGLE_CHOICE || questionType === EXAM_TYPE.MULTI_CHOICE) {
              const options: string[] = [];
              for (let i = header.indexOf('Các đáp án…'); i < row.length; i++) {
                const optionValue = row[i];
                if (optionValue !== undefined && optionValue !== null && String(optionValue).trim() !== '') {
                  options.push(String(optionValue).trim());
                }
              }
              if (options.length === 0) {
                rowErrors.push(`Hàng ${rowIndex + 2}: Câu hỏi trắc nghiệm phải có ít nhất một lựa chọn.`);
                isValidRow = false;
              }
              question.options = options;

              if (questionType === EXAM_TYPE.SINGLE_CHOICE) {
                question.correctAnswer = options.findIndex(o => o === correctAnswerRaw);
                if (!options.includes(correctAnswerRaw)) {
                  rowErrors.push(`Hàng ${rowIndex + 2}: Đáp án đúng không nằm trong các lựa chọn.`);
                  isValidRow = false;
                }
              } else {
                const correctAnswersArray = correctAnswerRaw.split(',').map(ans => ans.trim()).filter(ans => ans !== '');
                if (correctAnswersArray.length === 0) {
                  rowErrors.push(`Hàng ${rowIndex + 2}: Câu hỏi nhiều đáp án phải có ít nhất một đáp án đúng.`);
                  isValidRow = false;
                }
                if (!correctAnswersArray.every(ans => options.includes(ans))) {
                  rowErrors.push(`Hàng ${rowIndex + 2}: Một hoặc nhiều đáp án đúng không nằm trong các lựa chọn.`);
                  isValidRow = false;
                }
                const correctAnswersIndex = correctAnswersArray.map(ans => options.findIndex(o => o === ans));
                question.correctAnswer = correctAnswersIndex;
              }
            } else if (questionType === EXAM_TYPE.TEXT_INPUT) {
              question.correctAnswer = correctAnswerRaw;
            } else if (questionType === EXAM_TYPE.FILL_IN_BLANK) {
              const expectedBlanks = (questionText.match(new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
              const correctAnswersArray = correctAnswerRaw.split(',').map(ans => ans.trim()).filter(ans => ans !== '');

              if (expectedBlanks === 0) {
                rowErrors.push(`Hàng ${rowIndex + 2}: Câu hỏi điền khuyết phải chứa ít nhất một placeholder '${BLANK_PLACEHOLDER}'.`);
                isValidRow = false;
              } else if (correctAnswersArray.length !== expectedBlanks) {
                rowErrors.push(`Hàng ${rowIndex + 2}: Số lượng đáp án đúng (${correctAnswersArray.length}) không khớp với số chỗ trống (${expectedBlanks}).`);
                isValidRow = false;
              }
              question.correctAnswer = correctAnswersArray;
            } else if (questionType === EXAM_TYPE.MATCHING) {
              const termsRaw = String(row[header.indexOf('Các đáp án…')] || '').trim();
              const definitionsRaw = correctAnswerRaw;

              if (!termsRaw) {
                rowErrors.push(`Hàng ${rowIndex + 2}: Câu hỏi ghép đôi phải có thuật ngữ trong cột "Các đáp án".`);
                isValidRow = false;
              }

              const terms = termsRaw.split(',').map(t => t.trim()).filter(t => t !== '');
              const definitions = definitionsRaw.split(',').map(d => d.trim()).filter(d => d !== '');

              if (terms.length === 0 || definitions.length === 0) {
                rowErrors.push(`Hàng ${rowIndex + 2}: Câu hỏi ghép đôi phải có ít nhất một thuật ngữ và một định nghĩa.`);
                isValidRow = false;
              }

              if (terms.length !== definitions.length) {
                rowErrors.push(`Hàng ${rowIndex + 2}: Số lượng thuật ngữ (${terms.length}) và định nghĩa (${definitions.length}) phải bằng nhau.`);
                isValidRow = false;
              }

              question.terms = terms;
              question.definitions = definitions;
              // Create default 1-to-1 mapping (term index -> definition index)
              const correctMatches: any = {};
              for (let i = 0; i < terms.length; i++) {
                correctMatches[i] = i;
              }
              question.correctAnswer = correctMatches;
            } else {
              rowErrors.push(`Hàng ${rowIndex + 2}: Loại câu hỏi không hợp lệ (${questionType}).`);
              isValidRow = false;
            }
          }

          if (isValidRow) {
            newQuestions.push(question);
          }
        });

        if (rowErrors.length > 0) {
          setExcelFileError(`Có lỗi khi đọc file Excel:<br/>${rowErrors.slice(0, 10).join('<br/>')} ${rowErrors.length > 10 ? '<br/>(Quá nhiều lỗi, vui lòng nhập đúng cấu trúc trong file mẫu!)' : ''}`);
          return;
        }
        if (newQuestions.length === 0) {
          setExcelFileError("Không có câu hỏi hợp lệ nào được tìm thấy trong file Excel.");
          return;
        }

        props.setQuestions(prevQuestions => [...prevQuestions, ...newQuestions]);
        toast.success(`Đã nhập thành công ${newQuestions.length} câu hỏi từ file Excel.`, {
          style: { maxWidth: 600 }
        });

      } catch (err) {
        console.error("Error reading Excel file:", err);
        setExcelFileError(`Lỗi khi đọc file Excel.`);
      } finally {
        e.target.value = '';
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      setExcelFileError("Lỗi đọc file. Vui lòng thử lại.");
    };

    reader.readAsArrayBuffer(file);
  }

  const addQuestion = (type: string) => {
    let newQuestion: Question = {
      id: Date.now(),
      type: 'single-choice',
      questionText: '',
      options: [],
      correctAnswer: ''
    };
    newQuestion.type = type as "single-choice" | "multiple-choice" | "text-input" | "fill-blank";

    if (type === EXAM_TYPE.SINGLE_CHOICE) {
      newQuestion.options = [''];
      newQuestion.correctAnswer = '';
    } else if (type === EXAM_TYPE.MULTI_CHOICE) {
      newQuestion.options = [''];
      newQuestion.correctAnswer = [];
    } else if (type === EXAM_TYPE.FILL_IN_BLANK) {
      newQuestion.questionText = `Câu hỏi có ${BLANK_PLACEHOLDER} thứ nhất và ${BLANK_PLACEHOLDER} thứ hai.`;
      newQuestion.correctAnswer = ['', ''];
    } else if (type === EXAM_TYPE.MATCHING) {
      newQuestion.terms = [''];
      newQuestion.definitions = [''];
      newQuestion.correctAnswer = { 0: 0 }; // Term index -> Definition index
    }
    props.setQuestions([...props.questions, newQuestion]);
  };

  const updateQuestion = (id: number, field: string, value: any, optionIndex: number | null = null) => {
    props.setQuestions(props.questions.map(q => {
      if (q.id !== id) {
        return q;
      }
      if (field === 'questionText' && q.type === EXAM_TYPE.FILL_IN_BLANK) {
        const placeholderRegex = new RegExp(BLANK_PLACEHOLDER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
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

  return (
    <div>
      <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-xl font-semibold mb-3 text-blue-800">Nhập câu hỏi từ File Excel</h3>
        <p className="text-gray-700 mb-4">
          Bạn có thể tải lên file Excel (.xlsx) để tự động thêm câu hỏi.
          Đảm bảo file của bạn có các cột (theo thứ tự): <code className="font-mono bg-gray-200 px-1 rounded">Loại câu hỏi</code>,
          <code className="font-mono bg-gray-200 px-1 rounded">Nội dung câu hỏi</code>,
          <code className="font-mono bg-gray-200 px-1 rounded">Câu trả lời đúng</code>,
          và <code className="font-mono bg-gray-200 px-1 rounded">Các câu trả lời khác</code> (nếu là trắc nghiệm).
          Với câu hỏi điền khuyết, dùng ký hiệu <code className="font-mono bg-gray-200 px-1 rounded">[BLANK]</code> trong cột "Nội dung câu hỏi" và liệt kê các đáp án đúng trong cột "Câu trả lời đúng" ngăn cách bởi dấu phẩy.
          Xem <a href="/example.xlsx" download className="text-blue-600 hover:underline">file mẫu</a> để biết định dạng.
        </p>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleExcelFileUpload}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
        />
        {excelFileError && <p className="mt-2 text-red-500 text-sm" dangerouslySetInnerHTML={{ __html: excelFileError }}></p>}
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
                        &times;
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
                {(q.questionText.match(new RegExp("[BLANK]".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).map((_, index) => (
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
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => addQuestion(EXAM_TYPE.SINGLE_CHOICE)}
          className="px-5 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex justify-center items-center"
        >
          <Plus size={16} className='mr-3' /> Trắc nghệm 1 đ.án
        </button>
        <button
          type="button"
          onClick={() => addQuestion(EXAM_TYPE.MULTI_CHOICE)}
          className="px-5 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex justify-center items-center"
        >
          <Plus size={16} className='mr-3' /> Trắc nghệm nhiều đ.án
        </button>
        <button
          type="button"
          onClick={() => addQuestion(EXAM_TYPE.TEXT_INPUT)}
          className="px-5 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex justify-center items-center"
        >
          <Plus size={16} className='mr-3' /> Điền từ/trả lời ngắn
        </button>
        <button
          type="button"
          onClick={() => addQuestion(EXAM_TYPE.FILL_IN_BLANK)}
          className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex justify-center items-center"
        >
          <Plus size={16} className='mr-3' /> Điền khuyết
        </button>
        <button
          type="button"
          onClick={() => addQuestion(EXAM_TYPE.MATCHING)}
          className="px-5 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex justify-center items-center"
        >
          <Plus size={16} className='mr-3' /> Ghép đôi
        </button>
      </div>
    </div>
  )
}

export default QuestionTemplate