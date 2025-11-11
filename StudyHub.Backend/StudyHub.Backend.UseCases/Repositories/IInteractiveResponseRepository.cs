using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories;

public interface IInteractiveResponseRepository
{
    InteractiveResponse Create(InteractiveResponse response);
}
