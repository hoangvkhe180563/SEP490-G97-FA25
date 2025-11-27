using Nest;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.ElasticSearch;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IElasticSearchDocument
    {
        public Task<bool> CreateDocumentIndexAsync();
        public Task<bool> IndexDocumentAsync(Document doc, string searchableText, float[] vector);
        public Task<bool> IndexDocumentsBatchAsync(List<Document> docs, List<string> texts, float[][] vectors);
        public Task<bool> DeleteDocumentByIdAsync(int id);
        public Task<bool> UpdateDocumentStatusAsync(int id, bool status);
        public Task<bool> UpdateDocumentIsInClassAsync(int id, bool status);
        public Task<bool> UpdateDocumentUpdatedAtAsync(int id, DateTime updatedAt);
        public Task<ISearchResponse<ElasticDocument>> RecommendDocumentsAsync(
            List<Func<QueryContainerDescriptor<ElasticDocument>, QueryContainer>> filters,
            List<Func<QueryContainerDescriptor<ElasticDocument>, QueryContainer>> shouldQueries,
            float[] userVector,
            int topK = 30);
        public Task<ISearchResponse<ElasticDocument>> SearchDocumentWithLLMProfileAsync(
            float[] denseVector,
            UserPreferenceProfile profile,
            List<Func<QueryContainerDescriptor<ElasticDocument>, QueryContainer>> filters,
            string targetDifficulty,
            string targetLength,
            int topK = 30);

    }
}
