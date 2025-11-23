using StudyHub.Backend.Api.Dtos.ExamDTOS;
using StudyHub.Backend.Api.Dtos.QuestionDTOS;
using StudyHub.Backend.Domain.Entities.Exam;
using System.Text.Json;

namespace StudyHub.Backend.Api.Mappers
{
    public static class ExamMapper
    {
        public static Exam ToExamEntity(this ExamCreateDto examDto)
        {
            var examEntity = new Exam
            {
                Title = examDto.Title,
                Description = examDto.Description,
                Duration = examDto.Duration,
                CreatedBy = examDto.CreatedBy,
                ShowAnswers = examDto.ShowAnswers,
                ShowCorrectAnswers = examDto.ShowCorrectAnswers,
                IsMultipleAttempts = examDto.IsMultipleAttempts,
                ClassId = examDto.ClassId ?? 0,
                LessonId = examDto.LessonId ?? 0,
                OpenTime = examDto.OpenTime,
                CloseTime = examDto.CloseTime
            };

            List<Question> questions = new List<Question>();
            foreach (var question in examDto.Questions)
            {
                switch (question.Type)
                {
                    case QuestionType.SingleChoice:
                        {
                            if (question.CorrectAnswer is JsonElement jsonElement)
                            {
                                int correctAnswer = jsonElement.Deserialize<int>();
                                questions.Add(new SingleChoiceQuestion
                                {
                                    Options = question.Options,
                                    CorrectAnswer = correctAnswer,
                                    QuestionText = question.QuestionText,
                                    Type = QuestionType.SingleChoice
                                });
                            }
                            break;
                        }
                    case QuestionType.MultipleChoice:
                        {
                            if (question.CorrectAnswer is JsonElement jsonElement)
                            {
                                int[] correctAnsArray = jsonElement.Deserialize<int[]>() ?? [];
                                questions.Add(new MultipleChoiceQuestion
                                {
                                    Options = question.Options,
                                    CorrectAnswer = correctAnsArray.ToList(),
                                    QuestionText = question.QuestionText,
                                    Type = QuestionType.MultipleChoice
                                });
                            }
                            break;
                        }
                    case QuestionType.TextInput:
                        {
                            if (question.CorrectAnswer is JsonElement jsonElement)
                            {
                                string correctAnswer = jsonElement.Deserialize<string>() ?? string.Empty;
                                questions.Add(new TextInputQuestion
                                {
                                    QuestionText = question.QuestionText,
                                    Type = QuestionType.TextInput,
                                    CorrectAnswer = correctAnswer
                                });
                            }
                            break;
                        }
                    case QuestionType.FillBlank:
                        {
                            if (question.CorrectAnswer is JsonElement jsonElement)
                            {
                                string[] correctAnsArray = jsonElement.Deserialize<string[]>() ?? [];
                                questions.Add(new FillBlankQuestion
                                {
                                    QuestionText = question.QuestionText,
                                    Type = QuestionType.FillBlank,
                                    CorrectAnswer = correctAnsArray.ToList()
                                });
                            }
                            break;
                        }
                    case QuestionType.Matching:
                        {
                            if (question.CorrectAnswer is JsonElement jsonElement)
                            {
                                Dictionary<int, int> correctMatches = jsonElement.Deserialize<Dictionary<int, int>>() ?? new Dictionary<int, int>();
                                questions.Add(new MatchingQuestion
                                {
                                    QuestionText = question.QuestionText,
                                    Type = QuestionType.Matching,
                                    Terms = question.Terms,
                                    Definitions = question.Definitions,
                                    CorrectMatches = correctMatches
                                });
                            }
                            break;
                        }
                }
            }

            examEntity.Questions = questions;

            return examEntity;
        }

        public static Exam ToExamEntity(this ExamUpdateDto examDto)
        {
            var examEntity = new Exam
            {
                Id = examDto.Id,
                Title = examDto.Title,
                Description = examDto.Description,
                Duration = examDto.Duration,
                ShowAnswers = examDto.ShowAnswers,
                ShowCorrectAnswers = examDto.ShowCorrectAnswers,
                IsMultipleAttempts = examDto.IsMultipleAttempts,
                OpenTime = examDto.OpenTime,
                CloseTime = examDto.CloseTime
            };

            return examEntity;
        }

        public static ExamDetailsDto ToDetailsDto(this Exam exam)
        {
            var examDto = new ExamDetailsDto
            {
                Id = exam.Id,
                Title = exam.Title,
                Description = exam.Description,
                Duration = exam.Duration,
                OpenTime = exam.OpenTime,
                CloseTime = exam.CloseTime,
                ShowAnswers = exam.ShowAnswers,
                ShowCorrectAnswers = exam.ShowCorrectAnswers,
                IsMultipleAttempts = exam.IsMultipleAttempts,
                CreatedBy = exam.CreatedBy,
                ClassId = exam.ClassId,
                LessonId = exam.LessonId,
                TotalQuestions = exam.TotalQuestions
            };

            List<QuestionDetailsDto> questionDto = new List<QuestionDetailsDto>();
            foreach (var question in exam.Questions)
            {
                QuestionDetailsDto q = new QuestionDetailsDto();
                q.QuestionObjectId = question.Id;
                q.QuestionText = question.QuestionText;
                q.Type = question.Type;

                switch (question.Type)
                {
                    case QuestionType.SingleChoice:
                        {
                            if (question is SingleChoiceQuestion singleChoice)
                            {
                                q.CorrectAnswer = singleChoice.CorrectAnswer;
                                q.Options = singleChoice.Options;
                            }
                        }
                        break;
                    case QuestionType.MultipleChoice:
                        {
                            if (question is MultipleChoiceQuestion multipleChoice)
                            {
                                q.CorrectAnswer = multipleChoice.CorrectAnswer;
                                q.Options = multipleChoice.Options;
                            }
                        }
                        break;
                    case QuestionType.TextInput:
                        {
                            if (question is TextInputQuestion textInput)
                            {
                                q.CorrectAnswer = textInput.CorrectAnswer;
                            }
                        }
                        break;
                    case QuestionType.FillBlank:
                        {
                            if (question is FillBlankQuestion fillBlank)
                            {
                                q.CorrectAnswer = fillBlank.CorrectAnswer;
                            }
                        }
                        break;
                    case QuestionType.Matching:
                        {
                            if (question is MatchingQuestion matching)
                            {
                                q.Terms = matching.Terms;
                                q.Definitions = matching.Definitions;
                                q.CorrectAnswer = matching.CorrectMatches;
                            }
                        }
                        break;
                }

                questionDto.Add(q);
            }

            examDto.Questions = questionDto;
            return examDto;
        }
    }
}
