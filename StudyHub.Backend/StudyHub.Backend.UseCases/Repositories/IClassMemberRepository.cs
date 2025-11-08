using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IClassMemberRepository
    {
        List<AppUserSubjectClass> GetClassMembers(int classId);
        bool InviteMember(Guid userId, int classId);
        bool ConfirmMember(Guid userId, int classId);
        bool KickMember(Guid userId, int classId);
    }
}
