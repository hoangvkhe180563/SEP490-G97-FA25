using StudyHub.Backend.Api.Dtos.ExamDTOS;
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
                case QuestionType.SingleChoice:
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
                case QuestionType.MultipleChoice:
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
                case QuestionType.TextInput:
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
                case QuestionType.FillBlank:
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
                case QuestionType.Matching:
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
                                CorrectAnswer = correctMatches,
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
                case QuestionType.SingleChoice:
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
                case QuestionType.MultipleChoice:
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
                case QuestionType.TextInput:
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
                case QuestionType.FillBlank:
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
                case QuestionType.Matching:
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
                                CorrectAnswer = correctMatches,
                                Grade = questionDto.Grade,
                                SubjectId = questionDto.SubjectId
                            };
                        }
                        break;
                    }
            }

            throw new InvalidOperationException($"Unsupported question type: {questionDto.Type}");
        }

        public static QuestionDetailsDto ToDetailDto(this Domain.Entities.Exam.Question question)
        {
            QuestionDetailsDto dto = new QuestionDetailsDto();
            dto.QuestionObjectId = question.Id;
            dto.QuestionText = question.QuestionText;
            dto.Type = question.Type;
            dto.SubjectId = question.SubjectId;
            dto.Grade = question.Grade;

            switch (question.Type)
            {
                case QuestionType.SingleChoice:
                    {
                        if (question is SingleChoiceQuestion singleChoice)
                        {
                            dto.CorrectAnswer = singleChoice.CorrectAnswer;
                            dto.Options = singleChoice.Options;
                        }
                    }
                    break;
                case QuestionType.MultipleChoice:
                    {
                        if (question is MultipleChoiceQuestion multipleChoice)
                        {
                            dto.CorrectAnswer = multipleChoice.CorrectAnswer;
                            dto.Options = multipleChoice.Options;
                        }
                    }
                    break;
                case QuestionType.TextInput:
                    {
                        if (question is TextInputQuestion textInput)
                        {
                            dto.CorrectAnswer = textInput.CorrectAnswer;
                        }
                    }
                    break;
                case QuestionType.FillBlank:
                    {
                        if (question is FillBlankQuestion fillBlank)
                        {
                            dto.CorrectAnswer = fillBlank.CorrectAnswer;
                        }
                    }
                    break;
                case QuestionType.Matching:
                    {
                        if (question is MatchingQuestion matching)
                        {
                            dto.Terms = matching.Terms;
                            dto.Definitions = matching.Definitions;
                            dto.CorrectAnswer = matching.CorrectAnswer;
                        }
                    }
                    break;
            }
            return dto;
        }
    }
}
