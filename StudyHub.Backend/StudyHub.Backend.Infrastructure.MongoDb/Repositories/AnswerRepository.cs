using MongoDB.Bson;
using MongoDB.Driver;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.Infrastructure.MongoDb.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.Infrastructure.MongoDb.Data.Repositories
{
    public class AnswerRepository : IAnswerRepository
    {
        private readonly IMongoCollection<Result> _resultCollection;
        public AnswerRepository(MongoDbContext mongoDbContext)
        {
            _resultCollection = mongoDbContext.GetCollection<Result>("results");
        }

        public List<ExamAnswer> GetAnswersByResultId(string resultId, bool showAnswers, bool showCorrectAnswers)
        {
            try
            {
                var result = _resultCollection.Find(r => r.Id == ObjectId.Parse(resultId)).FirstOrDefault();
                if (result == null)
                {
                    return [];
                }
                if (showAnswers)
                {
                    return result.Answers.Select(a => new ExamAnswer
                    {
                        QuestionId = a.QuestionId.ToString(),
                        JsonAnswers = a.StudentAnswer.ToJson(),
                        IsCorrect = showCorrectAnswers && a.IsCorrect
                    }).ToList();
                }
                else
                {
                    return [];
                }
            }
            catch (Exception ex)
            {
                new MongoDbException("AnswerRepository", "GetAnswersByResultId failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }
        //public string AddExamResult(ExamResult examResult)
        //{
        //    try
        //    {
        //        var resultData = examResult.ToResultData();
        //        List<Answer> answers = new List<Answer>();
        //        foreach (var answer in examResult.Answers)
        //        {
        //            Answer answerData = new Answer();
        //            answerData.QuestionId = ObjectId.Parse(answer.QuestionId);
        //            answerData.IsCorrect = answer.IsCorrect;
        //            QuestionType type = _questionRepo.GetQuestionType(answer.QuestionId);
        //            switch (type)
        //            {
        //                case QuestionType.SingleChoice:
        //                    answerData.StudentAnswer = BsonValue.Create(int.Parse(answer.JsonAnswers));
        //                    break;
        //                case QuestionType.MultipleChoice:
        //                    answerData.StudentAnswer = BsonValue.Create(JsonSerializer.Deserialize<List<int>>(answer.JsonAnswers));
        //                    break;
        //                case QuestionType.TextInput:
        //                    answerData.StudentAnswer = BsonValue.Create(answer.JsonAnswers);
        //                    break;
        //                case QuestionType.FillBlank:
        //                    answerData.StudentAnswer = BsonValue.Create(JsonSerializer.Deserialize<List<string>>(answer.JsonAnswers));
        //                    break;
        //            }

        //            answers.Add(answerData);
        //        }
        //        resultData.Answers = answers;

        //        _resultCollection.InsertOne(resultData);
        //        return resultData.Id.ToString();
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine(ex.Message);
        //    }
        //    return string.Empty;
        //}
    }
}
