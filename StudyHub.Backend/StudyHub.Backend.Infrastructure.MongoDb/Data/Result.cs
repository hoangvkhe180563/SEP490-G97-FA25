using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace StudyHub.Backend.Infrastructure.MongoDb.Data
{
    public class Result
    {
        [BsonId]
        public ObjectId Id { get; set; }

        [BsonElement("answers")]
        public List<Answer> Answers { get; set; } = new List<Answer>();
    }

    public class Answer
    {
        [BsonElement("questionId")]
        public ObjectId QuestionId { get; set; }

        [BsonElement("studentAnswer")]
        public BsonValue StudentAnswer { get; set; } = BsonNull.Value;

        [BsonElement("isCorrect")]
        public bool IsCorrect { get; set; }
    }
}
