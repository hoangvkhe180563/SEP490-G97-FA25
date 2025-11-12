using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace StudyHub.Backend.Infrastructure.MongoDb.Data
{
    public class Question
    {
        [BsonId]
        public ObjectId Id { get; set; }

        [BsonElement("questionText")]
        public string QuestionText { get; set; } = string.Empty;

        [BsonElement("type")]
        public string Type { get; set; } = string.Empty;

        [BsonElement("options")]
        public List<string> Options { get; set; } = new List<string>();

        [BsonElement("terms")]
        public List<string> Terms { get; set; } = new List<string>();

        [BsonElement("definitions")]
        public List<string> Definitions { get; set; } = new List<string>();

        [BsonElement("correctAnswer")]
        public BsonValue CorrectAnswer { get; set; } = BsonNull.Value;
    }
}
