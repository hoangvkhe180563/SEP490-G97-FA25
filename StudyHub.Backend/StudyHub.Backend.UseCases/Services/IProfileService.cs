using StudyHub.Backend.UseCases.Dtos;
using System;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Services
{
    public interface IProfileService
    {
        UserLearningProfile GetUserLearningProfile(Guid userId);
    }
}
