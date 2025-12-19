using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.ElasticSearch;
using StudyHub.Backend.Domain.Entities.Exam;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IElasticSearchQuestion
    {
        Task<bool> CreateQuestionIndexAsync();
        Task<bool> IndexQuestionAsync(string id, ElasticQuestion question);
        Task<bool> IndexQuestionsBatchAsync(List<Domain.Entities.Exam.Question> questions, List<string> texts, List<string> correctAnswers, List<string> qualities, float[][] vectors);
        Task<List<StudyHub.Backend.UseCases.Dtos.ExampleQuestionDto>> SearchByVectorAsync(float[] vector, int k, int? subjectId, int? grade);
        Task<bool> DeleteQuestionByIdAsync(string id);
    }
}
