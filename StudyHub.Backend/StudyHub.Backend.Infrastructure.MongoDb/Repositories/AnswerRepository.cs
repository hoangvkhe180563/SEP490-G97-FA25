using MongoDB.Bson;
using MongoDB.Driver;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.Infrastructure.MongoDb.Data.Mappers;
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

        public string AddManyAnswers(List<ExamAnswer> answers)
        {
            try
            {
                List<Answer> answerDatas = answers.Select(answer => answer.ToAnswerData()).ToList();
                Result result = new Result
                {
                    Answers = answerDatas
                };
                _resultCollection.InsertOne(result);
                return result.Id.ToString();

            }
            catch (Exception ex)
            {
                new MongoDbException("AnswerRepository", "AddManyAnswers failed. Inner error: " + ex.Message).LogError();
            }
            return string.Empty;
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

        public List<string> GetQuestionIdsByResult(string resultId)
        {
            try
            {
                var result = _resultCollection.Find(r => r.Id == ObjectId.Parse(resultId)).FirstOrDefault();
                if (result == null) return [];

                return result.Answers.Select(a => a.QuestionId.ToString()).ToList();
            }
            catch (Exception ex)
            {
                new MongoDbException("AnswerRepository", "GetQuestionIdsByResult failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public bool UpdateManyAnswers(string resultObjectId, List<ExamAnswer> answers)
        {
            try
            {
                List<Answer> answerList = answers.Select(a => a.ToAnswerData()).ToList();

                var update = Builders<Result>.Update
                                .Set(q => q.Answers, answerList);
                _resultCollection.UpdateOne(r => r.Id == ObjectId.Parse(resultObjectId), update);
                return true;
            }
            catch (Exception ex)
            {
                new MongoDbException("AnswerRepository", "UpdateManyAnswers failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }
    }
}
