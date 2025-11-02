using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ClassworkRepository:IClassworkRepository
    {
        private readonly Data.AppDbContext _context;
        public ClassworkRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public List<Classwork> GetClassworks(int classId)
        {
            var classww = _context.Classworks.Where(c => c.ClassId == classId).Select(a => new Classwork
            {
                Id = a.Id,
                ClassId = a.ClassId,
                Title = a.Title,
                Description = a.Description,
                Deadline = a.Deadline,
            });
            return classww.ToList();
        }
        public Classwork CreateClasswork(Classwork classwork)
        {
            var entity = new Data.Classwork
            {
                ClassId = classwork.ClassId,
                Title = classwork.Title,
                Description = classwork.Description,
                Deadline = classwork.Deadline
            };
            _context.Classworks.Add(entity);
            _context.SaveChanges();
            classwork.Id = entity.Id; // gán lại Id cho domain model
            return classwork;
        }

        public Classwork EditClasswork(Classwork classwork)
        {
            var entity = _context.Classworks.FirstOrDefault(cw => cw.Id == classwork.Id);
            if (entity == null) return null;
            entity.Title = classwork.Title;
            entity.Description = classwork.Description;
            entity.Deadline = classwork.Deadline;
            _context.Classworks.Update(entity);
            _context.SaveChanges();
            return classwork;
        }
        public ClassworkSubmission SubmitClasswork(ClassworkSubmission submission, List<SubmissionFile> files)
        {
            // Tạo mới submission
            var entity = new Data.ClassworkSubmission
            {
                ClassworkId = submission.ClassworkId,
                AppUserId = submission.AppUserId,
                FirstSubmissionTime = DateTime.Now,
                LatestSubmissionTime = DateTime.Now
            };
            _context.ClassworkSubmissions.Add(entity);
            _context.SaveChanges();

            submission.Id = entity.Id;

            // Lưu file nộp bài
            foreach (var file in files)
            {
                var fileEntity = new Data.SubmissionFile
                {
                    SubmissionId = entity.Id,
                    FileName = file.FileName,
                    FileUrl = file.FileUrl
                };
                _context.SubmissionFiles.Add(fileEntity);
            }
            _context.SaveChanges();
            return submission;
        }
        public ClassworkSubmission ResubmitClasswork(int submissionId, List<SubmissionFile> files)
        {
            var entity = _context.ClassworkSubmissions.FirstOrDefault(s => s.Id == submissionId);
            var file = _context.SubmissionFiles.Where(f => f.SubmissionId == submissionId).ToList();
            if (entity == null) return null;
            entity.LatestSubmissionTime = DateTime.Now;
            _context.ClassworkSubmissions.Update(entity);
            _context.SubmissionFiles.RemoveRange(file);
            _context.SaveChanges(true);

            foreach (var fil in files)
            {
                var fileEntity = new Data.SubmissionFile
                {
                    SubmissionId = submissionId,
                    FileName = fil.FileName,
                    FileUrl = fil.FileUrl
                };
                _context.SubmissionFiles.Add(fileEntity);
            }
            _context.SaveChanges();
            return new ClassworkSubmission
            {
                Id = submissionId,
                ClassworkId = entity.ClassworkId,
                AppUserId = entity.AppUserId,
                FirstSubmissionTime = entity.FirstSubmissionTime,
                LatestSubmissionTime = entity.LatestSubmissionTime
            };
        }
        public Classwork GetClasswork(int classworkId)
        {

            var cw = _context.Classworks.FirstOrDefault(c => c.Id == classworkId);
            return new Classwork
            {
                Id = cw.Id,
                ClassId = cw.ClassId,
                Title = cw.Title,
                Description = cw.Description,
                Deadline = cw.Deadline,
            };
        }
        public List<ClassworkSubmission> GetSubmissionsByClassworkId(int classworkId)
        {
            return _context.ClassworkSubmissions.Where(c => c.ClassworkId == classworkId).Select(a =>
              new ClassworkSubmission
              {
                  Id = a.Id,
                  ClassworkId = a.ClassworkId,
                  AppUserId = a.AppUserId,
                  FirstSubmissionTime = a.FirstSubmissionTime,
                  LatestSubmissionTime = a.LatestSubmissionTime
              }).ToList();
        }
        public ClassworkSubmission GetSubmissionByUserAndClasswork(int classworkId, Guid userId)
        {
            var cs = _context.ClassworkSubmissions.FirstOrDefault(c => c.ClassworkId == classworkId && c.AppUserId == userId);
            if (cs == null) return null;
            return new ClassworkSubmission
            {
                Id = cs.Id,
                ClassworkId = cs.ClassworkId,
                AppUserId = cs.AppUserId,
                FirstSubmissionTime = cs.FirstSubmissionTime,
                LatestSubmissionTime = cs.LatestSubmissionTime
            };
        }
        public SubmissionFile AddSubmissionFile(SubmissionFile file)
        {
            var sf = new Data.SubmissionFile
            {
                SubmissionId = file.SubmissionId,
                Id = file.Id,
                FileName = file.FileName,
                FileUrl = file.FileUrl,

            };
            _context.SubmissionFiles.Add(sf);
            _context.SaveChanges();
            file.Id = sf.Id;
            return file;
        }
        public List<SubmissionFile> GetSubmissionFiles(int submissionId)
        {
            var fs = _context.SubmissionFiles.Where(a => a.SubmissionId == submissionId).Select(b => new SubmissionFile
            {
                SubmissionId = b.SubmissionId,
                Id = b.Id,
                FileName = b.FileName,
                FileUrl = b.FileUrl,
            });
            return fs.ToList();
        }
        public int GetSubmissionCount(int classworkId)
        {
            var submit = _context.ClassworkSubmissions.Where(c => c.ClassworkId == classworkId).Count();
            return submit;
        }
        public int GetMemberCount(int classworkId)
        {
            var classworkEntity = _context.Classworks
                .Include(c => c.Class)
                .FirstOrDefault(c => c.Id == classworkId);

            if (classworkEntity == null)
                return 0;
            var classEntity = _context.AppUserSubjectClasses.Include(c => c.Class).Include(c => c.User)
                .Where(c => c.ClassId == classworkEntity.ClassId
                && c.User.Roles.Where(r => r.Name.Contains("Student")).Any()).GroupBy(a => a.UserId).ToList();

            return classEntity.Count();
        }
        public int GetMemberClassCount(int classID)
        {
            var classs = _context.AppUserSubjectClasses.Where(a => a.ClassId == classID).GroupBy(a => a.UserId).Count();
            return classs;
        }

    }
}
