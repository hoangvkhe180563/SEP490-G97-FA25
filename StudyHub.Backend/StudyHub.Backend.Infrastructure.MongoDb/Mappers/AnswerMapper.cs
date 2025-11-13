using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.Infrastructure.MongoDb.Data.Mappers
{
    public static class AnswerMapper
    {
        public static ExamAnswer ToExamAnswerEntity(this Answer answer)
        {
            return new ExamAnswer
            {
                QuestionId = answer.QuestionId.ToString(),
                JsonAnswers = answer.StudentAnswer.ToJson(),
                IsCorrect = answer.IsCorrect,
            };
        }

        public static Answer ToAnswerData(this ExamAnswer answer)
        {
            return new Answer
            {
                QuestionId = ObjectId.Parse(answer.QuestionId),
                IsCorrect = answer.IsCorrect,
                StudentAnswer = answer.JsonAnswers.ToBsonValue()
            };
        }

        public static BsonValue ToBsonValue(this string jsonString)
        {
            bool toArray = TryDeserialize(jsonString, out BsonArray array);
            if (toArray) return array;

            bool toObject = TryDeserialize(jsonString, out BsonValue value);
            if (toObject) return value;

            bool toInt = int.TryParse(jsonString, out int intValue);
            if (toInt) return intValue;

            return jsonString;
        }

        public static bool TryDeserialize<T>(string jsonString, out T result)
        {
            try
            {
                result = BsonSerializer.Deserialize<T>(jsonString);
                return true;
            }
            catch (BsonException)
            {
                result = default!;
                return false;
            }
            catch (Exception)
            {
                result = default!;
                return false;
            }
        }
    }
}
