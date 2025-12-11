using Microsoft.AspNetCore.Http;
using OfficeOpenXml;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;
using System.Text.RegularExpressions;

namespace StudyHub.Backend.UseCases.Services
{
    public class QuestionService
    {
        private readonly IQuestionRepository _questionRepo;
        private readonly IQuestionManagerRepository _questionManagerRepo;
        public QuestionService(IQuestionRepository questionRepo, IQuestionManagerRepository questionManagerRepo)
        {
            _questionRepo = questionRepo;
            _questionManagerRepo = questionManagerRepo;
        }

        public List<string> AddCommonQuestions(List<Question> questions)
        {
            if (questions.Count == 0)
            {
                return [];
            }
            List<string> questionObjectIds = _questionRepo.AddManyQuestions(questions);
            return questionObjectIds;
        }

        public bool DeleteCommonQuestion(string questionObjectId)
        {
            if (string.IsNullOrWhiteSpace(questionObjectId) || questionObjectId.Length < 24) return false;
            var question = _questionRepo.GetQuestionById(questionObjectId);
            if (question == null)
            {
                new UseCaseException("QuestionService", "DeleteCommonQuestion failed. Question is null").LogError();
            }
            bool result = _questionRepo.DeleteOneQuestion(questionObjectId);
            return result;
        }

        public List<Question> GetCommonQuestions(int subjectId, int grade, int page, int type, string questionText)
        {
            List<Question> questionList = _questionRepo.GetCommonQuestions(subjectId, grade, page, type, questionText);
            return questionList;
        }

        public bool UpdateCommonQuestion(Question questionEntity)
        {
            return _questionRepo.UpdateOneQuestion(questionEntity);
        }

        public List<Subject> GetManagerSubjects(Guid managerId)
        {
            if (managerId == Guid.Empty) return [];
            return _questionManagerRepo.GetSubjectsByManagerId(managerId);
        }

        public Question? GetQuestionById(string id)
        {
            if (string.IsNullOrWhiteSpace(id) || id.Length < 24) return null;
            return _questionRepo.GetQuestionById(id);
        }

        public int GetTotalQuestions(int subjectId, int grade, int type, string questionText)
        {
            return _questionRepo.GetTotalQuestions(subjectId, grade, type, questionText);
        }

        public QuestionExcelDto ImportQuestionsFromExcel(IFormFile excelFile)
        {
            List<string> errorMessages = new List<string>();
            List<Question> questions = new List<Question>();
            try
            {
                using (var stream = excelFile.OpenReadStream())
                using (var package = new ExcelPackage(stream))
                {
                    ExcelWorksheet workSheet = package.Workbook.Worksheets[0];

                    if (workSheet.Dimension == null)
                    {
                        throw new Exception("File excel rỗng");
                    }

                    int totalRows = workSheet.Dimension.End.Row;

                    for (int row = 2; row <= totalRows; row++)
                    {
                        int lastColInRow = 0;
                        int totalCols = workSheet.Dimension.End.Column;

                        for (int c = totalCols; c >= 1; c--)
                        {
                            if (!string.IsNullOrWhiteSpace(workSheet.Cells[row, c].Text))
                            {
                                lastColInRow = c;
                                break;
                            }
                        }

                        if (lastColInRow == 0)
                        {
                            continue;
                        }

                        if (lastColInRow < 3)
                        {
                            errorMessages.Add($"Hàng {row}: Không đủ số cột trong 1 dòng.");
                        }

                        string questionType = workSheet.Cells[row, 1].Text.Trim();
                        string questionText = workSheet.Cells[row, 2].Text.Trim();
                        string correctAnswer = workSheet.Cells[row, 3].Text.Trim();

                        if (string.IsNullOrWhiteSpace(questionType) || string.IsNullOrWhiteSpace(questionText) || string.IsNullOrWhiteSpace(correctAnswer))
                        {
                            errorMessages.Add($"Hàng {row}: Thiếu loại câu hỏi, nội dung hoặc đáp án đúng.");
                        }

                        if (questionType == "single-choice" || questionType == "multiple-choice")
                        {
                            List<string> options = new List<string>();
                            for (int col = 4; col <= lastColInRow; col++)
                            {
                                string cellVal = workSheet.Cells[row, col].Text.Trim();

                                if (!string.IsNullOrWhiteSpace(cellVal))
                                {
                                    options.Add(cellVal);
                                }
                                else
                                {
                                    errorMessages.Add($"Hàng {row}: Thiếu lựa chọn.");
                                }
                            }

                            if (options.Count == 0)
                            {
                                errorMessages.Add($"Hàng {row}: Câu hỏi trắc nghiệm phải có ít nhất một lựa chọn.");
                            }

                            if (questionType == "single-choice")
                            {
                                if (!options.Any(option => option.Equals(correctAnswer)))
                                {
                                    errorMessages.Add($"Hàng {row}: Đáp án đúng không nằm trong các lựa chọn.");
                                }
                                questions.Add(new SingleChoiceQuestion
                                {
                                    QuestionText = questionText,
                                    Type = QuestionType.SingleChoice,
                                    Options = options,
                                    CorrectAnswer = options.IndexOf(correctAnswer)
                                });
                            }
                            else if (questionType == "multiple-choice")
                            {
                                List<string> correctAnswerArray = correctAnswer.Split(',')
                                    .Select(ans => ans.Trim())
                                    .Where(ans => !string.IsNullOrWhiteSpace(ans))
                                    .ToList();

                                if (!options.Any(correctAnswerArray.Contains))
                                {
                                    errorMessages.Add($"Hàng {row}: Một hoặc nhiều đáp án đúng không nằm trong các lựa chọn.");
                                }

                                questions.Add(new MultipleChoiceQuestion
                                {
                                    QuestionText = questionText,
                                    Type = QuestionType.MultipleChoice,
                                    Options = options,
                                    CorrectAnswer = correctAnswerArray.Select(ans => options.IndexOf(ans)).ToList()
                                });
                            }
                        }
                        else if (questionType == "text-input")
                        {
                            questions.Add(new TextInputQuestion
                            {
                                QuestionText = questionText,
                                Type = QuestionType.TextInput,
                                CorrectAnswer = correctAnswer
                            });
                        }
                        else if (questionType == "fill-blank")
                        {
                            List<string> options = correctAnswer.Split(",")
                                .Select(o => o.Trim())
                                .Where(o => !string.IsNullOrWhiteSpace(o))
                                .ToList();

                            int expectedBlanks = Regex.Matches(questionText, Regex.Escape("[BLANK]")).Count;
                            if (expectedBlanks == 0)
                            {
                                errorMessages.Add($"Hàng {row}: Câu hỏi điền khuyết phải chứa ít nhất một placeholder [BLANK]");
                            }
                            else if (expectedBlanks != options.Count)
                            {
                                errorMessages.Add($"Hàng {row}: Số lượng đáp án đúng ({options.Count}) không khớp với số chỗ trống ({expectedBlanks})");
                            }

                            questions.Add(new FillBlankQuestion
                            {
                                QuestionText = questionText,
                                Type = QuestionType.FillBlank,
                                CorrectAnswer = options
                            });
                        }
                        else if (questionType == "matching")
                        {
                            // Get value from Column 4 (D)
                            string matchingTermCell = workSheet.Cells[row, 4].Text;

                            List<string> terms = matchingTermCell.Split(",")
                                .Select(o => o.Trim())
                                .Where(o => !string.IsNullOrWhiteSpace(o))
                                .ToList();

                            List<string> definitions = correctAnswer.Split(",")
                                .Select(o => o.Trim())
                                .Where(o => !string.IsNullOrWhiteSpace(o))
                                .ToList();

                            if (terms.Count == 0 || definitions.Count == 0)
                            {
                                errorMessages.Add($"Hàng {row}: Câu hỏi ghép đôi phải có ít nhất một thuật ngữ và một định nghĩa");
                            }

                            if (terms.Count != definitions.Count)
                            {
                                errorMessages.Add($"Hàng {row}: Số lượng thuật ngữ ({terms.Count}) không khớp với số lượng định nghĩa ({definitions.Count}).");
                            }

                            Dictionary<int, int> correctAnswers = new();
                            for (int i = 0; i < terms.Count; i++)
                            {
                                correctAnswers.Add(i, i);
                            }

                            questions.Add(new MatchingQuestion
                            {
                                QuestionText = questionText,
                                Type = QuestionType.Matching,
                                Terms = terms,
                                Definitions = definitions,
                                CorrectAnswer = correctAnswers
                            });
                        }
                        else
                        {
                            errorMessages.Add($"Hàng {row}: Loại câu hỏi không hợp lệ ({questionType}) tại dòng {row}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                new UseCaseException("QuestionService", "ImportQuestionsFromExcel failed. Inner error" + ex.Message).LogError();
                errorMessages.Add("Có lỗi xảy ra!");
            }

            if (errorMessages.Count > 0)
            {
                return new QuestionExcelDto
                {
                    ErrorMessages = errorMessages,
                    Questions = []
                };
            }
            else if (questions.Count == 0)
            {
                return new QuestionExcelDto
                {
                    ErrorMessages = ["Không có câu hỏi hợp lệ nào được tìm thấy trong file Excel"],
                    Questions = []
                };
            }
            else
            {
                return new QuestionExcelDto
                {
                    ErrorMessages = [],
                    Questions = questions
                };
            }
        }

        public QuestionOverviewDto GetQuestionDashboardOverview(Guid managerId)
        {
            QuestionOverviewDto dto = new QuestionOverviewDto();

            List<Subject> subjects = GetManagerSubjects(managerId);
            dto.TotalSubjects = subjects.Count;

            var questions = _questionRepo.GetCommonQuestionsBySubjects(subjects.Select(s => (int)s.Id).ToList());
            dto.TotalQuestions = questions.Count;
            dto.TotalGrades = questions.Select(q => q.Grade).Distinct().Count();

            return dto;
        }

        public List<QuestionDetailOverviewDto> GetQuestionDetailOverview(Guid managerId)
        {
            if (managerId == Guid.Empty) return [];
            List<Subject> subjects = GetManagerSubjects(managerId);
            var questions = _questionRepo.GetCommonQuestionsBySubjects(subjects.Select(s => (int)s.Id).ToList());
            return questions.Select(q => new QuestionDetailOverviewDto
            {
                SubjectId = q.SubjectId!.Value,
                Grade = q.Grade!.Value,
                Type = q.Type,
            }).ToList();
        }
    }
}
