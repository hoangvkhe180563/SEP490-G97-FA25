using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using Data = StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class LessonResourceRepository : ILessonResourceRepository
    {
        private readonly Data.AppDbContext _context;

        public LessonResourceRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public LessonResource? GetById(int id)
        {
            try
            {
                var ent = _context.LessonResources.Find(id);
                if (ent == null) return null;
                return MapToDomain(ent);
            }
            catch (Exception ex)
            {
                new InfrastructureException("LessonResourceRepository", "GetById failed: " + ex.Message).LogError();
                return null;
            }
        }
        public LessonResource Create(LessonResource res)
        {
            try
            {
                var ent = new Data.LessonResource { Url = res.Url };
                _context.LessonResources.Add(ent);
                _context.SaveChanges();
                res.Id = ent.Id;
                return res;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LessonResourceRepository", "Create failed: " + ex.Message).LogError();
                throw;
            }
        }

        public LessonResource Update(LessonResource res)
        {
            try
            {
                var ent = _context.LessonResources.Find(res.Id);
                if (ent == null) return res;
                ent.Url = res.Url;
                _context.SaveChanges();
                return MapToDomain(ent);
            }
            catch (Exception ex)
            {
                new InfrastructureException("LessonResourceRepository", "Update failed: " + ex.Message).LogError();
                return new LessonResource();
            }
        }

        public bool Delete(int id)
        {
            try
            {
                var ent = _context.LessonResources.Find(id);
                if (ent == null) return false;
                // detach relationships if any (lessons)
                var lessons = _context.Lessons.Where(l => l.ResourceId == id).ToList();
                foreach (var l in lessons) l.ResourceId = null;
                _context.LessonResources.Remove(ent);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("LessonResourceRepository", "Delete failed: " + ex.Message).LogError();
                return false;
            }
        }

        private static LessonResource MapToDomain(Data.LessonResource r)
        {
            return new LessonResource { Id = r.Id, Url = r.Url };
        }
    }
}
