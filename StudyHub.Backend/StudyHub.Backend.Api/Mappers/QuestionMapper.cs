using StudyHub.Backend.Api.Dtos.QuestionDTOS;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.Infrastructure.MongoDb.Data;
using System.Text.Json;

namespace StudyHub.Backend.Api.Mappers
{
    public static class QuestionMapper
    {
        public static Domain.Entities.Exam.Question ToQuestionEntity(this QuestionCreateDto question)
        {
            switch (question.Type)
            {
                default:
                case "single-choice":
                    {
                        if (question.CorrectAnswer is JsonElement jsonElement)
                        {
                            int correctAnswer = jsonElement.Deserialize<int>();
                            return new SingleChoiceQuestion
                            {
                                Options = question.Options,
                                CorrectAnswer = correctAnswer,
                                QuestionText = question.QuestionText,
                                Type = QuestionType.SingleChoice,
                                Grade = question.Grade,
                                SubjectId = question.SubjectId
                            };
                        }
                        break;
                    }
                case "multiple-choice":
                    {
                        if (question.CorrectAnswer is JsonElement jsonElement)
                        {
                            int[] correctAnsArray = jsonElement.Deserialize<int[]>() ?? [];
                            return new MultipleChoiceQuestion
                            {
                                Options = question.Options,
                                CorrectAnswer = correctAnsArray.ToList(),
                                QuestionText = question.QuestionText,
                                Type = QuestionType.MultipleChoice,
                                Grade = question.Grade,
                                SubjectId = question.SubjectId
                            };
                        }
                        break;
                    }
                case "text-input":
                    {
                        if (question.CorrectAnswer is JsonElement jsonElement)
                        {
                            string correctAnswer = jsonElement.Deserialize<string>() ?? string.Empty;
                            return new TextInputQuestion
                            {
                                QuestionText = question.QuestionText,
                                Type = QuestionType.TextInput,
                                CorrectAnswer = correctAnswer,
                                Grade = question.Grade,
                                SubjectId = question.SubjectId
                            };
                        }
                        break;
                    }
                case "fill-blank":
                    {
                        if (question.CorrectAnswer is JsonElement jsonElement)
                        {
                            string[] correctAnsArray = jsonElement.Deserialize<string[]>() ?? [];
                            return new FillBlankQuestion
                            {
                                QuestionText = question.QuestionText,
                                Type = QuestionType.FillBlank,
                                CorrectAnswer = correctAnsArray.ToList(),
                                Grade = question.Grade,
                                SubjectId = question.SubjectId
                            };
                        }
                        break;
                    }
                case "matching":
                    {
                        if (question.CorrectAnswer is JsonElement jsonElement)
                        {
                            Dictionary<int, int> correctMatches = jsonElement.Deserialize<Dictionary<int, int>>() ?? new Dictionary<int, int>();
                            return new MatchingQuestion
                            {
                                QuestionText = question.QuestionText,
                                Type = QuestionType.Matching,
                                Terms = question.Terms,
                                Definitions = question.Definitions,
                                CorrectMatches = correctMatches,
                                Grade = question.Grade,
                                SubjectId = question.SubjectId
                            };
                        }
                        break;
                    }
            }
            throw new InvalidOperationException($"Unsupported question type: {question.Type}");
        }

        public static Domain.Entities.Exam.Question ToQuestionEntity(this QuestionUpdateDto questionDto)
        {
            switch (questionDto.Type)
            {
                case "single-choice":
                    {
                        if (questionDto.CorrectAnswer is JsonElement jsonElement)
                        {
                            int correctAnswer = jsonElement.Deserialize<int>();
                            return new SingleChoiceQuestion
                            {
                                Id = questionDto.QuestionObjectId,
                                Options = questionDto.Options,
                                CorrectAnswer = correctAnswer,
                                QuestionText = questionDto.QuestionText,
                                Type = QuestionType.SingleChoice,
                                Grade = questionDto.Grade,
                                SubjectId = questionDto.SubjectId
                            };
                        }
                        break;
                    }
                case "multiple-choice":
                    {
                        if (questionDto.CorrectAnswer is JsonElement jsonElement)
                        {
                            int[] correctAnsArray = jsonElement.Deserialize<int[]>() ?? Array.Empty<int>();
                            return new MultipleChoiceQuestion
                            {
                                Id = questionDto.QuestionObjectId,
                                Options = questionDto.Options,
                                CorrectAnswer = correctAnsArray.ToList(),
                                QuestionText = questionDto.QuestionText,
                                Type = QuestionType.MultipleChoice,
                                Grade = questionDto.Grade,
                                SubjectId = questionDto.SubjectId
                            };
                        }
                        break;
                    }
                case "text-input":
                    {
                        if (questionDto.CorrectAnswer is JsonElement jsonElement)
                        {
                            string correctAnswer = jsonElement.Deserialize<string>() ?? string.Empty;
                            return new TextInputQuestion
                            {
                                Id = questionDto.QuestionObjectId,
                                QuestionText = questionDto.QuestionText,
                                Type = QuestionType.TextInput,
                                CorrectAnswer = correctAnswer,
                                Grade = questionDto.Grade,
                                SubjectId = questionDto.SubjectId
                            };
                        }
                        break;
                    }
                case "fill-blank":
                    {
                        if (questionDto.CorrectAnswer is JsonElement jsonElement)
                        {
                            string[] correctAnsArray = jsonElement.Deserialize<string[]>() ?? Array.Empty<string>();
                            return new FillBlankQuestion
                            {
                                Id = questionDto.QuestionObjectId,
                                QuestionText = questionDto.QuestionText,
                                Type = QuestionType.FillBlank,
                                CorrectAnswer = correctAnsArray.ToList(),
                                Grade = questionDto.Grade,
                                SubjectId = questionDto.SubjectId
                            };
                        }
                        break;
                    }
                case "matching":
                    {
                        if (questionDto.CorrectAnswer is JsonElement jsonElement)
                        {
                            Dictionary<int, int> correctMatches = jsonElement.Deserialize<Dictionary<int, int>>() ?? new Dictionary<int, int>();
                            return new MatchingQuestion
                            {
                                Id = questionDto.QuestionObjectId,
                                QuestionText = questionDto.QuestionText,
                                Type = QuestionType.Matching,
                                Terms = questionDto.Terms,
                                Definitions = questionDto.Definitions,
                                CorrectMatches = correctMatches,
                                Grade = questionDto.Grade,
                                SubjectId = questionDto.SubjectId
                            };
                        }
                        break;
                    }
            }

            throw new InvalidOperationException($"Unsupported question type: {questionDto.Type}");
        }
    }
}
