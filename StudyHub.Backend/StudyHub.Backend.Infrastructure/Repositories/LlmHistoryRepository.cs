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

        public List<DomainEnt.LlmHistory> ListByUser(Guid userId)
        {
            return _context.LlmHistories.Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).Select(x => ToDomain(x)).ToList();
        }
    }
}
