using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Infrastructure.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace StudyHub.Backend.Infrastructure.Repositories;

public class InteractiveQuestionRepository : IInteractiveQuestionRepository
{
    private readonly Data.AppDbContext _context;

    public InteractiveQuestionRepository(Data.AppDbContext context)
    {
        _context = context;
    }

    public List<InteractiveQuestion> GetByLessonId(int lessonId)
    {
        try
        {
            return _context.InteractiveQuestions
                .Where(q => q.LessonId == lessonId)
                .OrderBy(q => q.TimeSec)
                .Select(q => new InteractiveQuestion
                {
                    Id = q.Id,
                    LessonId = q.LessonId,
                    TimeSec = q.TimeSec,
                    QuestionText = q.QuestionText,
                    Type = q.Type,
                    OptionsJson = q.Options,
                    CorrectIndex = q.CorrectIndex,
                    CorrectAnswer = q.CorrectAnswer,
                    CreatedAt = q.CreatedAt
                }).ToList();
        }
        catch (Exception ex)
        {
            new InfrastructureException("InteractiveQuestionRepository", "GetByLessonId failed. " + ex.Message).LogError();
            return new List<InteractiveQuestion>();
        }
    }

    public List<InteractiveQuestion> CreateForLesson(int lessonId, List<InteractiveQuestion> questions)
    {
        try
        {
            var created = new List<InteractiveQuestion>();
            foreach (var q in questions)
            {
                var ent = new Data.InteractiveQuestion
                {
                    LessonId = lessonId,
                    TimeSec = q.TimeSec,
                    QuestionText = q.QuestionText,
                    Type = q.Type,
                    Options = q.OptionsJson,
                    CorrectIndex = q.CorrectIndex,
                    CorrectAnswer = q.CorrectAnswer,
                    CreatedAt = q.CreatedAt == default ? DateTime.UtcNow : q.CreatedAt
                };
                _context.InteractiveQuestions.Add(ent);
                _context.SaveChanges();

                q.Id = ent.Id;
                created.Add(q);
            }
            return created;
        }
        catch (Exception ex)
        {
            new InfrastructureException("InteractiveQuestionRepository", "CreateForLesson failed. " + ex.Message).LogError();
            return questions;
        }
    }

    public List<InteractiveQuestion> ReplaceForLesson(int lessonId, List<InteractiveQuestion> questions)
    {
        try
        {
            // delete existing
            var existing = _context.InteractiveQuestions.Where(x => x.LessonId == lessonId).ToList();
            if (existing.Any())
            {
                _context.InteractiveQuestions.RemoveRange(existing);
                _context.SaveChanges();
            }

            // create new ones
            var created = new List<InteractiveQuestion>();
            foreach (var q in questions)
            {
                var ent = new Data.InteractiveQuestion
                {
                    LessonId = lessonId,
                    TimeSec = q.TimeSec,
                    QuestionText = q.QuestionText,
                    Type = q.Type,
                    Options = q.OptionsJson,
                    CorrectIndex = q.CorrectIndex,
                    CorrectAnswer = q.CorrectAnswer,
                    CreatedAt = q.CreatedAt == default ? DateTime.UtcNow : q.CreatedAt
                };
                _context.InteractiveQuestions.Add(ent);
                _context.SaveChanges();

                q.Id = ent.Id;
                created.Add(q);
            }
            return created;
        }
        catch (Exception ex)
        {
            new InfrastructureException("InteractiveQuestionRepository", "ReplaceForLesson failed. " + ex.Message).LogError();
            return questions;
        }
    }
}
