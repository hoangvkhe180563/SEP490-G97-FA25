using MongoDB.Bson;
using MongoDB.Driver;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.Infrastructure.MongoDb.Data.Mappers;
using StudyHub.Backend.Infrastructure.MongoDb.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.Infrastructure.MongoDb.Data.Repositories
{
    public class QuestionRepository : IQuestionRepository
    {
        private readonly IMongoCollection<Question> _questionCollection;
        public QuestionRepository(MongoDbContext mongoDbContext)
        {
            _questionCollection = mongoDbContext.GetCollection<Question>("questions");
        }

        public List<Domain.Entities.Exam.Question> GetAllQuestions()
        {
            try
            {
                var questions = _questionCollection.Find(new BsonDocument()).ToList();

                List<Domain.Entities.Exam.Question> mappedQuestions = [];

                foreach (var question in questions)
                {
                    Domain.Entities.Exam.Question questionEntity = question.ToQuestionEntity();
                    mappedQuestions.Add(questionEntity);
                }

                return mappedQuestions;
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "GetAllQuestions failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public Domain.Entities.Exam.Question? GetQuestionById(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return null;
            }
            ObjectId objectId;
            if (!ObjectId.TryParse(id, out objectId))
            {
                Console.WriteLine($"Invalid ObjectId format: {id}");
                return null;
            }
            try
            {
                var question = _questionCollection.Find(q => q.Id == objectId).FirstOrDefault();

                return question.ToQuestionEntity();
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "GetQuestionById failed. Inner error: " + ex.Message).LogError();
            }
            return null;
        }

        public string AddOneQuestion(Domain.Entities.Exam.Question question)
        {
            try
            {
                var newQuestion = question.ToQuestionData();

                _questionCollection.InsertOne(newQuestion);

                return newQuestion.Id.ToString();
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "GetQuestionById failed. Inner error: " + ex.Message).LogError();
            }
            return string.Empty;
        }

        public List<string> AddManyQuestions(List<Domain.Entities.Exam.Question> questions)
        {
            try
            {
                var newQuestions = questions.Select(q => q.ToQuestionData()).ToList();
                _questionCollection.InsertMany(newQuestions);
                return newQuestions.Select(q => q.Id.ToString()).ToList();
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "AddManyQuestions failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public bool UpdateOneQuestion(Domain.Entities.Exam.Question question)
        {
            try
            {
                var questionData = question.ToQuestionData();
                switch (questionData.Type)
                {
                    case "single-choice":
                        {
                            var update = Builders<Question>.Update
                                .Set(q => q.QuestionText, questionData.QuestionText)
                                .Set(q => q.Options, questionData.Options)
                                .Set(q => q.CorrectAnswer, questionData.CorrectAnswer);
                            _questionCollection.UpdateOne(q => q.Id == questionData.Id, update);
                            break;
                        }
                    case "multiple-choice":
                        {
                            var update = Builders<Question>.Update
                                .Set(q => q.QuestionText, questionData.QuestionText)
                                .Set(q => q.Options, questionData.Options)
                                .Set(q => q.CorrectAnswer, questionData.CorrectAnswer);
                            _questionCollection.UpdateOne(q => q.Id == questionData.Id, update);
                            break;
                        }
                    case "text-input":
                        {
                            var update = Builders<Question>.Update
                                .Set(q => q.QuestionText, questionData.QuestionText)
                                .Set(q => q.CorrectAnswer, questionData.CorrectAnswer);
                            _questionCollection.UpdateOne(q => q.Id == questionData.Id, update);
                            break;
                        }
                    case "fill-blank":
                        {
                            var update = Builders<Question>.Update
                                .Set(q => q.QuestionText, questionData.QuestionText)
                                .Set(q => q.CorrectAnswer, questionData.CorrectAnswer);
                            _questionCollection.UpdateOne(q => q.Id == questionData.Id, update);
                            break;
                        }
                    default:
                        return false;
                }
                return true;
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "UpdateOneQuestion failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public bool UpdateManyQuestions(List<Domain.Entities.Exam.Question> questions)
        {
            try
            {
                bool isUpdated = false;
                foreach (var question in questions)
                {
                    isUpdated &= UpdateOneQuestion(question);
                }
                return isUpdated;
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "UpdateManyQuestions failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public bool DeleteQuestion(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return false;
            }
            ObjectId objectId;
            if (!ObjectId.TryParse(id, out objectId))
            {
                Console.WriteLine($"Invalid ObjectId format: {id}");
                return false;
            }
            try
            {
                var result = _questionCollection.DeleteOne(q => q.Id == objectId);
                return result.DeletedCount > 0;
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "DeleteQuestion failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public QuestionType GetQuestionType(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return QuestionType.SingleChoice;
            }
            ObjectId objectId;
            if (!ObjectId.TryParse(id, out objectId))
            {
                Console.WriteLine($"Invalid ObjectId format: {id}");
                return QuestionType.SingleChoice;
            }
            try
            {
                string typeField = "type";

                var projection = Builders<Question>.Projection.Include(typeField).Exclude("_id");

                var question = _questionCollection.Find(q => q.Id == objectId)
                    .Project(projection).FirstOrDefault();

                if (question != null && question.Contains(typeField))
                {
                    switch (question[typeField].AsString)
                    {
                        case "single-choice":
                            return QuestionType.SingleChoice;
                        case "multiple-choice":
                            return QuestionType.MultipleChoice;
                        case "text-input":
                            return QuestionType.TextInput;
                        case "fill-blank":
                            return QuestionType.FillBlank;
                    }
                }
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "GetQuestionType failed. Inner error: " + ex.Message).LogError();
            }
            return QuestionType.SingleChoice;
        }

        public List<Domain.Entities.Exam.Question> GetManyQuestionsById(List<string> ids)
        {
            if (ids.Count == 0)
            {
                return [];
            }
            try
            {
                var objectIds = ids.Select(id => ObjectId.Parse(id)).ToList();
                var questions = _questionCollection.Find(q => objectIds.Contains(q.Id)).ToList();
                return questions.Select(questions => questions.ToQuestionEntity()).ToList();
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "GetManyQuestionsById failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public bool DeleteManyQuestions(List<string> ids)
        {
            try
            {
                var objectIds = ids.Select(id => ObjectId.Parse(id)).ToList();
                var result = _questionCollection.DeleteMany(q => objectIds.Contains(q.Id));
                return result.DeletedCount > 0;
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "DeleteManyQuestions failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }
    }
}
