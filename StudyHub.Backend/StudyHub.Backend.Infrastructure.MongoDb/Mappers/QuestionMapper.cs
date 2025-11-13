using MongoDB.Bson;
using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.Infrastructure.MongoDb.Data.Mappers
{
    public static class QuestionMapper
    {
        public static Domain.Entities.Exam.Question ToQuestionEntity(this Question question)
        {
            switch (question.Type)
            {
                default:
                case "single-choice":
                    return new SingleChoiceQuestion
                    {
                        Id = question.Id.ToString(),
                        QuestionText = question.QuestionText,
                        Type = QuestionType.SingleChoice,
                        Options = question.Options,
                        CorrectAnswer = question.CorrectAnswer.AsInt32
                    };
                case "multiple-choice":
                    {
                        BsonArray correctAnswerArray = question.CorrectAnswer.AsBsonArray;
                        List<int> correctAnswerIndexes = [];
                        foreach (BsonValue index in correctAnswerArray)
                        {
                            correctAnswerIndexes.Add(index.AsInt32);
                        }

                        return new MultipleChoiceQuestion
                        {
                            Id = question.Id.ToString(),
                            QuestionText = question.QuestionText,
                            Type = QuestionType.MultipleChoice,
                            Options = question.Options,
                            CorrectAnswer = correctAnswerIndexes
                        };
                    }
                case "text-input":
                    return new TextInputQuestion
                    {
                        Id = question.Id.ToString(),
                        QuestionText = question.QuestionText,
                        Type = QuestionType.TextInput,
                        CorrectAnswer = question.CorrectAnswer.AsString
                    };
                case "fill-blank":
                    return new FillBlankQuestion
                    {
                        Id = question.Id.ToString(),
                        QuestionText = question.QuestionText,
                        Type = QuestionType.FillBlank,
                        CorrectAnswer = question.CorrectAnswer.AsBsonArray.Select(a => a.AsString).ToList()
                    };
                case "matching":
                    {
                        BsonDocument correctMatchesDoc = question.CorrectAnswer.AsBsonDocument;
                        Dictionary<int, int> correctMatches = new Dictionary<int, int>();
                        foreach (var element in correctMatchesDoc)
                        {
                            if (int.TryParse(element.Name, out int key))
                            {
                                correctMatches[key] = element.Value.AsInt32;
                            }
                        }

                        return new MatchingQuestion
                        {
                            Id = question.Id.ToString(),
                            QuestionText = question.QuestionText,
                            Type = QuestionType.Matching,
                            Terms = question.Terms,
                            Definitions = question.Definitions,
                            CorrectMatches = correctMatches
                        };
                    }
            }
        }

        public static Question ToQuestionData(this Domain.Entities.Exam.Question question)
        {
            Question questionData = new Question();
            if (question.Id != string.Empty)
            {
                questionData.Id = ObjectId.Parse(question.Id);
            }
            questionData.QuestionText = question.QuestionText;
            switch (question.Type)
            {
                case QuestionType.SingleChoice:
                    questionData.Type = "single-choice";
                    questionData.Options = question is SingleChoiceQuestion scq ? scq.Options : [];
                    questionData.CorrectAnswer = question is SingleChoiceQuestion scq2 ? scq2.CorrectAnswer : string.Empty;
                    break;
                case QuestionType.MultipleChoice:
                    questionData.Type = "multiple-choice";
                    questionData.Options = question is MultipleChoiceQuestion mcq ? mcq.Options : [];
                    questionData.CorrectAnswer = question is MultipleChoiceQuestion mcq2 ? [.. mcq2.CorrectAnswer] : new BsonArray();
                    break;
                case QuestionType.TextInput:
                    questionData.Type = "text-input";
                    questionData.CorrectAnswer = question is TextInputQuestion tiq ? tiq.CorrectAnswer : string.Empty;
                    break;
                case QuestionType.FillBlank:
                    questionData.Type = "fill-blank";
                    questionData.CorrectAnswer = question is FillBlankQuestion fbq ? [.. fbq.CorrectAnswer] : new BsonArray();
                    break;
                case QuestionType.Matching:
                    questionData.Type = "matching";
                    if (question is MatchingQuestion mq)
                    {
                        questionData.Terms = mq.Terms;
                        questionData.Definitions = mq.Definitions;
                        BsonDocument correctMatchesDoc = new BsonDocument();
                        foreach (var kvp in mq.CorrectMatches)
                        {
                            correctMatchesDoc[kvp.Key.ToString()] = kvp.Value;
                        }
                        questionData.CorrectAnswer = correctMatchesDoc;
                    }
                    break;
            }

            return questionData;
        }
    }
}
