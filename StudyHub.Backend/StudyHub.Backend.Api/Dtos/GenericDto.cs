namespace StudyHub.Backend.Api.Dtos
{
    public class GenericDto<T>
    {
        public string Success { get; set; } = "false";
        public string? Error { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public object? Meta { get; set; }
    }
}
