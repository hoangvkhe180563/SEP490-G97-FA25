using MongoDB.Bson;
using MongoDB.Driver;
using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.Infrastructure.MongoDb.Data.Mappers;
using StudyHub.Backend.Infrastructure.MongoDb.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;
using System.Diagnostics;

namespace StudyHub.Backend.Infrastructure.MongoDb.Data.Repositories
{
    public class QuestionRepository : IQuestionRepository
    {
        private readonly IMongoCollection<Question> _questionCollection;
        public QuestionRepository(MongoDbContext mongoDbContext)
        {
            _questionCollection = mongoDbContext.GetCollection<Question>("questions");
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
                    case 0:
                        {
                            var update = Builders<Question>.Update
                                .Set(q => q.QuestionText, questionData.QuestionText)
                                .Set(q => q.Options, questionData.Options)
                                .Set(q => q.CorrectAnswer, questionData.CorrectAnswer)
                                .Set(q => q.SubjectId, questionData.SubjectId)
                                .Set(q => q.Grade, questionData.Grade);
                            _questionCollection.UpdateOne(q => q.Id == questionData.Id, update);
                            break;
                        }
                    case 1:
                        {
                            var update = Builders<Question>.Update
                                .Set(q => q.QuestionText, questionData.QuestionText)
                                .Set(q => q.Options, questionData.Options)
                                .Set(q => q.CorrectAnswer, questionData.CorrectAnswer)
                                .Set(q => q.SubjectId, questionData.SubjectId)
                                .Set(q => q.Grade, questionData.Grade);
                            _questionCollection.UpdateOne(q => q.Id == questionData.Id, update);
                            break;
                        }
                    case 2:
                        {
                            var update = Builders<Question>.Update
                                .Set(q => q.QuestionText, questionData.QuestionText)
                                .Set(q => q.CorrectAnswer, questionData.CorrectAnswer)
                                .Set(q => q.SubjectId, questionData.SubjectId)
                                .Set(q => q.Grade, questionData.Grade);
                            _questionCollection.UpdateOne(q => q.Id == questionData.Id, update);
                            break;
                        }
                    case 3:
                        {
                            var update = Builders<Question>.Update
                                .Set(q => q.QuestionText, questionData.QuestionText)
                                .Set(q => q.CorrectAnswer, questionData.CorrectAnswer)
                                .Set(q => q.SubjectId, questionData.SubjectId)
                                .Set(q => q.Grade, questionData.Grade);
                            _questionCollection.UpdateOne(q => q.Id == questionData.Id, update);
                            break;
                        }
                    case 4:
                        {
                            var update = Builders<Question>.Update
                                .Set(q => q.QuestionText, questionData.QuestionText)
                                .Set(q => q.Terms, questionData.Terms)
                                .Set(q => q.Definitions, questionData.Definitions)
                                .Set(q => q.CorrectAnswer, questionData.CorrectAnswer)
                                .Set(q => q.SubjectId, questionData.SubjectId)
                                .Set(q => q.Grade, questionData.Grade);
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

        public bool DeleteOneQuestion(string id)
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
                var update = Builders<Question>.Update
                    .Set(q => q.Status, false);
                
                var result = _questionCollection.UpdateOne(q => q.Id == objectId, update);
                return result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "DeleteQuestion failed. Inner error: " + ex.Message).LogError();
            }
            return false;
        }

        public List<Domain.Entities.Exam.Question> GetManyQuestionsById(List<string> ids)
        {
            if (ids.Count == 0)
            {
                return [];
            }
            try
            {
                var objectIds = ids.Select(ObjectId.Parse).ToList();
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

        public List<Domain.Entities.Exam.Question> GetCommonQuestions(int subjectId, int grade, int page, int type, string questionText)
        {
            try
            {
                int pageSize = 10;
                var questions = _questionCollection.Find(q => q.SubjectId == subjectId && q.Status == true).ToList();
                List<Domain.Entities.Exam.Question> mappedQuestions = [];
                foreach (var question in questions)
                {
                    Domain.Entities.Exam.Question questionEntity = question.ToQuestionEntity();
                    mappedQuestions.Add(questionEntity);
                }
                if (!string.IsNullOrWhiteSpace(questionText))
                {
                    mappedQuestions = mappedQuestions.Where(q => q.QuestionText.Contains(questionText, StringComparison.OrdinalIgnoreCase)).ToList();
                }
                if (grade > 0)
                {
                    mappedQuestions = mappedQuestions.Where(q => q.Grade == grade).ToList();
                }
                if (type > -1)
                {
                    mappedQuestions = mappedQuestions.Where(q => q.Type == (QuestionType)type).ToList();
                }
                return mappedQuestions.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "GetCommonQuestions failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public int GetTotalQuestions(int subjectId, int grade, int type, string questionText)
        {
            try
            {
                var questions = _questionCollection.Find(q => q.SubjectId == subjectId && q.Status == true).ToList();
                if (!string.IsNullOrWhiteSpace(questionText))
                {
                    questions = questions.Where(q => q.QuestionText.Contains(questionText, StringComparison.OrdinalIgnoreCase)).ToList();
                }
                if (grade > 0)
                {
                    questions = questions.Where(q => q.Grade == grade).ToList();
                }
                if (type > -1)
                {
                    questions = questions.Where(q => q.Type == type).ToList();
                }
                return questions.Count;
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "GetTotalQuestions failed. Inner error: " + ex.Message).LogError();
            }
            return 0;
        }

        public List<Domain.Entities.Exam.Question> GenerateRandomQuestions(sbyte noRandomQuestions, short subjectId, sbyte grade)
        {
            try
            {
                var questions = _questionCollection.Find(q => q.SubjectId == subjectId && q.Grade == grade && q.Status == true).ToList();
                var random = new Random();
                var randomQuestions = questions.OrderBy(x => random.Next()).Take(noRandomQuestions).ToList();
                List<Domain.Entities.Exam.Question> mappedQuestions = [];
                foreach (var question in randomQuestions)
                {
                    Domain.Entities.Exam.Question questionEntity = question.ToQuestionEntity();
                    mappedQuestions.Add(questionEntity);
                }
                return mappedQuestions;
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "GenerateRandomQuestions failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }

        public List<Domain.Entities.Exam.Question> GetCommonQuestionsBySubjects(List<int> subjectIds)
        {
            try
            {
                var questions = _questionCollection.Find(q => q.SubjectId != null && subjectIds.Contains(q.SubjectId.Value) && q.Status == true).ToList();
                return questions.Select(q => q.ToQuestionEntity()).ToList();
            }
            catch (Exception ex)
            {
                new MongoDbException("QuestionRepository", "GetCommonQuestionsBySubjects failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }
    }
}
