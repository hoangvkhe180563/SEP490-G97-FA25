using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Infrastructure.Exceptions;

namespace StudyHub.Backend.Infrastructure.Repositories;

public class InteractiveResponseRepository : IInteractiveResponseRepository
{
    private readonly Data.AppDbContext _context;

    public InteractiveResponseRepository(Data.AppDbContext context)
    {
        _context = context;
    }

    public InteractiveResponse Create(InteractiveResponse response)
    {
        try
        {
            var ent = new Data.InteractiveResponse
            {
                LessonId = response.LessonId,
                QuestionId = response.QuestionId,
                AppUserId = response.AppUserId,
                AnswerText = response.AnswerText,
                SelectedIndex = response.SelectedIndex,
                CreatedAt = response.CreatedAt == default ? DateTime.UtcNow : response.CreatedAt
            };
            _context.InteractiveResponses.Add(ent);
            _context.SaveChanges();

            response.Id = ent.Id;
            response.CreatedAt = ent.CreatedAt;
            return response;
        }
        catch (Exception ex)
        {
            new InfrastructureException("InteractiveResponseRepository", "Create failed. " + ex.Message).LogError();
            return response;
        }
    }
}
