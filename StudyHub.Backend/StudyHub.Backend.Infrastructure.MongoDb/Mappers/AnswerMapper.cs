using MongoDB.Bson;
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
