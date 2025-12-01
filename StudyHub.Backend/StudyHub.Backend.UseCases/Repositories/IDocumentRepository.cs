using StudyHub.Backend.Domain.Entities;
using System;
using System.Collections.Generic;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IDocumentRepository
    {
        Document? GetDocumentById(int id);
        List<Document> GetDocuments();
        (List<Document> documents, int totalCount) GetPublicDocuments(
            string? query = null, int? categoryId = null, int? grade = null,
            string? subject = null, int? classId = null, string? documentLengthType = null,
            string? documentLevel = null, int? pageNumber = null, int? pageSize = null);
        (List<Document> documents, int totalCount) GetSchoolDocuments(
            int schoolId, string? query = null, int? categoryId = null, int? grade = null,
            string? subject = null, int? classId = null, string? documentLengthType = null,
            string? documentLevel = null, int? pageNumber = null, int? pageSize = null);
        (List<Document> documents, int totalCount) GetOwnedDocuments(
            Guid creatorId, string? query = null, int? categoryId = null, int? grade = null,
            string? subject = null, int? classId = null, string? documentLengthType = null,
            string? documentLevel = null, int? pageNumber = null, int? pageSize = null);
        (List<Document> documents, int totalCount) GetManagerPublicDocuments(
       string? query = null,
       int? categoryId = null,
       int? grade = null,
       string? subject = null,
       int? classId = null,
       bool? isApproved = null,
       bool? status = null,
       bool? hasEditRequest = null,
       DateTime? createdFrom = null,
       DateTime? createdTo = null,
       DateTime? updatedFrom = null,
       DateTime? updatedTo = null,
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
            bool? hasEditRequest = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            DateTime? updatedFrom = null,
            DateTime? updatedTo = null,
            int? pageNumber = null,
            int? pageSize = null);
        (List<Document> documents, int totalCount) GetEditRequestDocuments(bool? isRequested = null, int? pageNumber = null, int? pageSize = null);
        List<Document> GetDocumentsBySubject(int subjectId);
        List<Document> GetDocumentsBySubjectForPublic(int subjectId);
        List<Document> GetDocumentsBySubjectForSchool(int subjectId, int schoolId);
        Document CreateDocument(Document document);
        Document UpdateDocument(Document document);
        List<Document> GetDocumentsByClass(int classId);
        List<Class> GetClassesByDocument(int documentId);
        bool DeleteDocument(int id);
    }
}