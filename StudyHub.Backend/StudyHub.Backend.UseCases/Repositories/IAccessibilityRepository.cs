using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IAccessibilityRepository
    {
        List<Accessibility> GetAllAccessibilities();
        Accessibility? GetAccessibilityById(int id);
        Accessibility CreateAccessibility(Accessibility accessibility);
        Accessibility UpdateAccessibility(Accessibility accessibility);
        bool DeleteAccessibility(int id);

    }
}
