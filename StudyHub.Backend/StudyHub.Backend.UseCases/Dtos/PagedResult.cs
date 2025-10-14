using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int TotalPages { get; set; }
    }
}
