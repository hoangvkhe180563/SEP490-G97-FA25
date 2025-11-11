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
        //public static ExamResult ToExamResultEntity(this Result result)
        //{
        //    return new ExamResult
        //    {
        //        Id = result.Id.ToString(),
        //        Answers = result.Answers.Select(ans => new ExamAnswer
        //        {
        //            QuestionId = ans.QuestionId.ToString(),
        //            IsCorrect = ans.IsCorrect,
        //            JsonAnswers = ans.StudentAnswer.ToJson()
        //        }).ToList(),
        //        StudentId = new Guid(),
        //        FinishTime = DateTime.Now,
        //    };
        //}

        //public static Result ToResultData(this ExamResult result)
        //{
        //    Result resultData = new Result();
        //    if (result.Id != string.Empty)
        //    {
        //        resultData.Id = ObjectId.Parse(result.Id);
        //    }

        //    resultData.Answers = result.Answers.Select(res => new Answer
        //    {
        //        QuestionId = ObjectId.Parse(res.QuestionId),
        //        IsCorrect = res.IsCorrect
        //        //answer will be parsed later
        //    }).ToList();

        //    return resultData;
        //}
    }
}
