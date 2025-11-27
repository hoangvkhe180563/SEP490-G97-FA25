using Elasticsearch.Net;
using Nest;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.ElasticSearch;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IElasticSearchCourse
    {
        Task<bool> CreateCourseIndexAsync();
        Task<bool> IndexCourseAsync(Course course, string searchableText, float[] vector);
        Task<bool> IndexCoursesBatchAsync(List<Course> courses, List<string> texts, float[][] vectors);
        Task<bool> UpdateCourseStatusAsync(int id, string status);
        Task<bool> DeleteCourseByIdAsync(int id);
        Task<ISearchResponse<ElasticCourse>> RecommendCoursesAsync(
            List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>> filters,
            List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>> shouldQueries,
            float[] userVector,
            int topK = 30);

        Task<ISearchResponse<ElasticCourse>> SearchCourseWithLLMProfileAsync(
            float[] denseVector,
            UserPreferenceProfile profile,
            List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>> filters,
            string targetDifficulty,
            string targetLength,
            int topK = 30);
    }
}
