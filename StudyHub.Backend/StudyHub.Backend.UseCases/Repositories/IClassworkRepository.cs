using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IClassworkRepository
    {
        List<Classwork> GetClassworks(int classId);
        Classwork CreateClasswork(Classwork classwork);
        Classwork EditClasswork(Classwork classwork);
        ClassworkSubmission SubmitClasswork(ClassworkSubmission submission, List<SubmissionFile> files);
        ClassworkSubmission ResubmitClasswork(int submissionId, List<SubmissionFile> files);
        Classwork GetClasswork(int classworkId);
        List<ClassworkSubmission> GetSubmissionsByClassworkId(int classworkId);
        ClassworkSubmission GetSubmissionByUserAndClasswork(int classworkId, Guid userId);
        SubmissionFile AddSubmissionFile(SubmissionFile file);
        List<SubmissionFile> GetSubmissionFiles(int submissionId);
        int GetSubmissionCount(int classworkId);
        int GetMemberCount(int classworkId);
        int GetMemberClassCount(int classID);
    }
}
