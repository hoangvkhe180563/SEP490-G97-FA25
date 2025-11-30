using System;
using System.Collections.Generic;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Services
{
    public class LlmHistoryService
    {
        private readonly ILlmHistoryRepository _repo;
        private readonly AuthService _authService;

        public LlmHistoryService(ILlmHistoryRepository repo, AuthService authService)
        {
            _repo = repo;
            _authService = authService;
        }

        public LlmHistory CreateEntry(string inputText)
        {
            var current = _authService.GetCurrentUser();
            if (current == null) throw new InvalidOperationException("Không tìm thấy người dùng hiện tại");

            var entry = new LlmHistory
            {
                UserId = current.Id,
                InputText = inputText,
                Llmresponse = null,
                CreatedAt = DateTime.Now
            };
            _repo.Create(entry);
            return entry;
        }

        public void UpdateResponse(int id, string response)
        {
            var current = _authService.GetCurrentUser();
            if (current == null) throw new InvalidOperationException("Không tìm thấy người dùng hiện tại");

            var existing = _repo.GetById(id);
            if (existing == null) throw new InvalidOperationException("Không tìm thấy lịch sử");
            if (existing.UserId != current.Id) throw new UnauthorizedAccessException("Không có quyền cập nhật mục này");

            _repo.UpdateResponse(id, response);
        }

        public LlmHistory? GetByIdForCurrentUser(int id)
        {
            var current = _authService.GetCurrentUser();
            if (current == null) throw new InvalidOperationException("Không tìm thấy người dùng hiện tại");
            var existing = _repo.GetById(id);
            if (existing == null) return null;
            if (existing.UserId != current.Id) throw new UnauthorizedAccessException("Không có quyền truy cập mục này");
            return existing;
        }

        public List<LlmHistory> GetAllForCurrentUser()
        {
            var current = _authService.GetCurrentUser();
            if (current == null) throw new InvalidOperationException("Không tìm thấy người dùng hiện tại");
            return _repo.ListByUser(current.Id);
        }
    }
}
