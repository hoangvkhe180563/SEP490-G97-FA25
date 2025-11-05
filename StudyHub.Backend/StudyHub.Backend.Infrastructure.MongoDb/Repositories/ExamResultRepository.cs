using MongoDB.Bson;
using MongoDB.Driver;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.Infrastructure.MongoDb.Data.Mappers;
using StudyHub.Backend.UseCases.Repositories.Exam;
using System.Text.Json;

namespace StudyHub.Backend.Infrastructure.MongoDb.Data.Repositories
{
    public class ExamResultRepository
    {
        private readonly IMongoCollection<ExamResult> _resultCollection;
        private readonly IQuestionRepository _questionRepo;
        public ExamResultRepository(MongoDbContext mongoDbContext, IQuestionRepository questionRepo)
        {
            _resultCollection = mongoDbContext.GetCollection<ExamResult>("results");
            _questionRepo = questionRepo; 
        }
        public string AddExamResult(ExamResult examResult)
        {
            try
            {
                var client = new MongoClient("mongodb://localhost:27017");
                var database = client.GetDatabase("StudyHub");
                var collection = database.GetCollection<Result>("results");
                var resultData = examResult.ToResultData();

                using (var session = client.StartSession())
                {
                    session.StartTransaction();
                    List<Answer> answers = new List<Answer>();
                    foreach (var answer in examResult.Answers)
                    {
                        Answer answerData = new Answer();
                        answerData.QuestionId = ObjectId.Parse(answer.QuestionId);
                        answerData.IsCorrect = answer.IsCorrect;
                        QuestionType type = _questionRepo.GetQuestionType(answer.QuestionId);
                        switch (type)
                        {
                            case QuestionType.SingleChoice:
                                answerData.StudentAnswer = BsonValue.Create(int.Parse(answer.JsonAnswers));
                                break;
                            case QuestionType.MultipleChoice:
                                answerData.StudentAnswer = BsonValue.Create(JsonSerializer.Deserialize<List<int>>(answer.JsonAnswers));
                                break;
                            case QuestionType.TextInput:
                                answerData.StudentAnswer = BsonValue.Create(answer.JsonAnswers);
                                break;
                            case QuestionType.FillBlank:
                                answerData.StudentAnswer = BsonValue.Create(JsonSerializer.Deserialize<List<string>>(answer.JsonAnswers));
                                break;
                        }

                        answers.Add(answerData);
                    }
                    resultData.Answers = answers;

                    collection.InsertOne(resultData);
                    session.CommitTransaction();
                }
                return resultData.Id.ToString();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return string.Empty;
        }
    }
}
