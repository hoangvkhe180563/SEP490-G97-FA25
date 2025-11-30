using System.Linq;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using DomainEnt = StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class LlmHistoryRepository : ILlmHistoryRepository
    {
        private readonly AppDbContext _context;

        public LlmHistoryRepository(AppDbContext context)
        {
            _context = context;
        }

        private static DomainEnt.LlmHistory ToDomain(Data.LlmHistory d)
        {
            return new DomainEnt.LlmHistory
            {
                Id = d.Id,
                UserId = d.UserId,
                InputText = d.InputText,
                Llmresponse = d.Llmresponse,
                Status = d.Status,
                InputTokens = d.InputTokens,
                OutputTokens = d.OutputTokens,
                CreatedAt = d.CreatedAt
            };
        }

        private static Data.LlmHistory ToData(DomainEnt.LlmHistory d)
        {
            return new Data.LlmHistory
            {
                Id = d.Id,
                UserId = d.UserId,
                InputText = d.InputText,
                Llmresponse = d.Llmresponse,
                Status = d.Status,
                InputTokens = d.InputTokens,
                OutputTokens = d.OutputTokens,
                CreatedAt = d.CreatedAt
            };
        }

        public void Create(DomainEnt.LlmHistory entry)
        {
            var d = ToData(entry);
            _context.LlmHistories.Add(d);
            _context.SaveChanges();
            entry.Id = d.Id;
        }

        public DomainEnt.LlmHistory? GetById(int id)
        {
            var d = _context.LlmHistories.FirstOrDefault(x => x.Id == id);
            return d == null ? null : ToDomain(d);
        }

        public void UpdateResponse(int id, string response)
        {
            var d = _context.LlmHistories.FirstOrDefault(x => x.Id == id);
            if (d == null) return;
            d.Llmresponse = response;
            _context.LlmHistories.Update(d);
            _context.SaveChanges();
        }

        public void UpdateTokens(int id, int? inputTokens, int? outputTokens)
        {
            var d = _context.LlmHistories.FirstOrDefault(x => x.Id == id);
            if (d == null) return;
            if (inputTokens.HasValue) d.InputTokens = inputTokens.Value;
            if (outputTokens.HasValue) d.OutputTokens = outputTokens.Value;
            _context.LlmHistories.Update(d);
            _context.SaveChanges();
        }

        public void UpdateStatus(int id, string status)
        {
            var d = _context.LlmHistories.FirstOrDefault(x => x.Id == id);
            if (d == null) return;
            d.Status = status;
            _context.LlmHistories.Update(d);
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var d = _context.LlmHistories.FirstOrDefault(x => x.Id == id);
            if (d == null) return;
            _context.LlmHistories.Remove(d);
            _context.SaveChanges();
        }

        public List<DomainEnt.LlmHistory> ListByUser(Guid userId)
        {
            // Exclude soft-deleted entries (Status == "Đã xoá") from user list
            // Prioritize pinned items (Status == "Đã ghim") first, then order by CreatedAt desc
            return _context.LlmHistories
                .Where(x => x.UserId == userId && x.Status != "Đã xoá")
                .OrderByDescending(x => x.Status == "Đã ghim")
                .ThenByDescending(x => x.CreatedAt)
                .Select(x => ToDomain(x))
                .ToList();
        }
    }
}
