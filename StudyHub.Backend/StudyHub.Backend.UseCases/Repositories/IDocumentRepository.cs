using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IDocumentRepository
    {
        Document? GetDocumentById(int id);

        (List<Document> documents, int totalCount) GetPublicDocuments(
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            int? pageNumber = null,
            int? pageSize = null);

        (List<Document> documents, int totalCount) GetSchoolDocuments(
            int schoolId,
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            int? pageNumber = null,
            int? pageSize = null);

        (List<Document> documents, int totalCount) GetOwnedDocuments(
            Guid creatorId,
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            int? pageNumber = null,
            int? pageSize = null);

        (List<Document> documents, int totalCount) GetManagerPublicDocuments(
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            bool? isApproved = null,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null);

        (List<Document> documents, int totalCount) GetManagerSchoolDocuments(
            int schoolId,
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            bool? isApproved = null,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null);
        List<Document> GetDocumentsBySubject(int subjectId);
        Document CreateDocument(Document document);
        Document UpdateDocument(Document document);
        bool DeleteDocument(int id);
    }
}