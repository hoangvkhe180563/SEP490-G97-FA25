using StudyHub.Backend.Domain.Entities.ElasticSearch;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Repositories.Exam;
using StudyHub.Backend.Domain.Entities.Exam;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class ElasticQuestionVectorSearchService
    {
        private readonly EmbeddingService _embeddingService;
        private readonly IQuestionRepository _questionRepository;
        private readonly IElasticSearchQuestion _elasticSearchQuestion;

        public ElasticQuestionVectorSearchService(EmbeddingService embeddingService, IQuestionRepository questionRepository, IElasticSearchQuestion elasticSearchQuestion)
        {
            _embeddingService = embeddingService;
            _questionRepository = questionRepository;
            _elasticSearchQuestion = elasticSearchQuestion;
        }

        public async Task<bool> CreateQuestionIndexAsync()
        {
            return await _elasticSearchQuestion.CreateQuestionIndexAsync();
        }

        public async Task<bool> IndexQuestionAsync(UpsertElasticQuestionRequest req)
        {
            if (req == null) return false;

            // derive correct answer text
            var answerText = req.CorrectAnswer ?? string.Empty;
            if (string.IsNullOrWhiteSpace(answerText) && req.CorrectAnswerIndex.HasValue && req.Options != null && req.Options.Count > req.CorrectAnswerIndex.Value)
            {
                answerText = req.Options[req.CorrectAnswerIndex.Value];
            }
            // Normalize question text and detect vagueness same as batch flow
            var qText = req.QuestionText ?? string.Empty;
            var normalized = QuestionTextPatterns.NormalizeAndStrip(qText);
            var tokenCount = QuestionTextPatterns.TokenCount(normalized);

            string finalSearchable;
            string correctAnswerText = string.IsNullOrWhiteSpace(answerText) ? string.Empty : $"Đáp án là {answerText}";

            if (tokenCount <= 1)
            {
                // vague -> use answer anchor when available
                finalSearchable = string.IsNullOrWhiteSpace(answerText) ? string.Empty : correctAnswerText;
            }
            else
            {
                finalSearchable = qText.Trim();
            }

            var vector = await _embeddingService.GetEmbeddingAsync(_embeddingService.ConvertEmbeddingQuestionToText(finalSearchable, ""));

            var doc = new ElasticQuestion
            {
                Id = req.Id,
                QuestionText = req.QuestionText,
                CorrectAnswer = correctAnswerText,
                Grade = req.Grade,
                SubjectId = req.SubjectId,
                QuestionVector = vector,
                SearchableText = finalSearchable,
                SearchableQuality = EstimateQualityForRequest(finalSearchable, answerText)
            };

            return await _elasticSearchQuestion.IndexQuestionAsync(req.Id, doc);
        }

        public async Task<bool> IndexQuestionsBatchAsync(List<Question> questions)
        {
            var texts = new List<string>();
            var correctAnswers = new List<string>();
            var qualities = new List<string>();
            foreach (var q in questions)
            {
                // try to get a textual answer if possible
                string answer = string.Empty;
                switch (q)
                {
                    case SingleChoiceQuestion sc:
                        if (sc.Options != null && sc.Options.Count > sc.CorrectAnswer)
                            answer = sc.Options[sc.CorrectAnswer];
                        break;
                    case MultipleChoiceQuestion mc:
                        if (mc.Options != null && mc.CorrectAnswer != null && mc.CorrectAnswer.Count > 0)
                            answer = string.Join(", ", mc.CorrectAnswer.Where(i => i >= 0 && i < mc.Options.Count).Select(i => mc.Options[i]));
                        break;
                    case TextInputQuestion ti:
                        answer = ti.CorrectAnswer ?? string.Empty;
                        break;
                    case FillBlankQuestion fb:
                        answer = string.Join(", ", fb.CorrectAnswer ?? new List<string>());
                        break;
                    case MatchingQuestion mq:
                        answer = string.Join(", ", mq.CorrectAnswer.Select(kv => $"{kv.Key}->{kv.Value}"));
                        break;
                }
                var searchable = BuildSearchableForQuestion(q, answer);
                texts.Add(_embeddingService.ConvertEmbeddingQuestionToText(searchable, ""));
                correctAnswers.Add(BuildCorrectAnswerText(q, answer));
                qualities.Add(EstimateQuality(q, searchable, answer));
            }

            var vectors = await _embeddingService.GetEmbeddingsBatchAsync(texts);

            return await _elasticSearchQuestion.IndexQuestionsBatchAsync(questions, texts, correctAnswers, qualities, vectors);
        }

        public async Task<bool> DeleteQuestionByIdAsync(string id)
        {
            return await _elasticSearchQuestion.DeleteQuestionByIdAsync(id);
        }

        public async Task<List<StudyHub.Backend.UseCases.Dtos.ExampleQuestionDto>> SearchSimilarQuestionsAsync(List<string> keywords, int topK = 5, int? subjectId = null, int? grade = null)
        {
            if (keywords == null || keywords.Count == 0) return new List<StudyHub.Backend.UseCases.Dtos.ExampleQuestionDto>();

            var query = string.Join(" ", keywords);
            var vector = await _embeddingService.GetEmbeddingAsync(query);
            var results = await _elasticSearchQuestion.SearchByVectorAsync(vector, topK, subjectId, grade);
            return results ?? new List<StudyHub.Backend.UseCases.Dtos.ExampleQuestionDto>();
        }

        public async Task<bool> IndexAllQuestionsFromDbAsync()
        {
            try
            {
                var questions = _questionRepository.GetAllQuestions();
                if (questions == null || questions.Count == 0) return false;

                return await IndexQuestionsBatchAsync(questions);
            }
            catch (Exception)
            {
                return false;
            }
        }

        private string BuildCorrectAnswerText(Question q, string answer)
        {
            if (q is MatchingQuestion mq)
            {
                // Build pairs of term + definition
                var pairs = new List<string>();
                foreach (var kv in mq.CorrectAnswer)
                {
                    var term = (mq.Terms != null && kv.Key >= 0 && kv.Key < mq.Terms.Count) ? mq.Terms[kv.Key] : "";
                    var def = (mq.Definitions != null && kv.Value >= 0 && kv.Value < mq.Definitions.Count) ? mq.Definitions[kv.Value] : "";
                    pairs.Add($"{term} {def}".Trim());
                }
                return pairs.Count > 0 ? $"Đáp án là {string.Join(", ", pairs)}" : string.Empty;
            }

            if (!string.IsNullOrWhiteSpace(answer))
                return $"Đáp án là {answer}";

            return string.Empty;
        }

        private string BuildSearchableForQuestion(Question q, string answer)
        {
            if (q is MatchingQuestion mq)
            {
                // include questionText + the composed answers
                var answerText = BuildCorrectAnswerText(q, answer);

                // Fallback 1: if questionText is vague/empty (e.g., "Nối cho đúng"), omit it
                var qText = mq.QuestionText ?? string.Empty;
                var normalized = QuestionTextPatterns.NormalizeAndStrip(qText);
                var tokenCount = QuestionTextPatterns.TokenCount(normalized);

                // Consider vague if normalized token count <= 1
                bool isVague = tokenCount <= 1;

                if (isVague)
                {
                    // SearchableText becomes composed term-definition pairs only
                    return string.IsNullOrWhiteSpace(answerText) ? string.Empty : answerText;
                }

                // Otherwise include question text and answers
                return string.IsNullOrWhiteSpace(answerText) ? qText.Trim() : $"{qText.Trim()} {answerText}".Trim();
            }

            // For other types, if question text is vague/short, use correct answer as anchor
            var qTextOther = q.QuestionText?.Trim() ?? string.Empty;
            if (IsVagueText(qTextOther))
            {
                // Use the answer as anchor for searchable text
                return string.IsNullOrWhiteSpace(answer) ? qTextOther : $"Đáp án là {answer}";
            }

            // Otherwise searchable text is just the question text (do not include options)
            return qTextOther;
        }

        private bool IsVagueText(string text)
        {
            // Normalize and strip command/answer indicator words first
            var normalized = QuestionTextPatterns.NormalizeAndStrip(text ?? string.Empty);
            var tokens = QuestionTextPatterns.TokenCount(normalized);

            // If remaining tokens <= 1 consider it vague
            return tokens <= 1;
        }

        private string EstimateQuality(Question q, string searchable, string answer)
        {
            // Very simple heuristic: must have searchable text length > 10 and have an answer
            if (string.IsNullOrWhiteSpace(searchable) || searchable.Length < 10)
                return "low";
            if (q is MatchingQuestion mq)
            {
                // Fallback 2: detect poor semantic terms/definitions (e.g., "A - 1")
                if (IsPoorSemantic(mq.Terms, mq.Definitions))
                    return "low";

                // matching should have at least one correct pair
                return string.IsNullOrWhiteSpace(answer) ? "low" : "good";
            }
            // for other types, require an answer
            return string.IsNullOrWhiteSpace(answer) ? "low" : "good";
        }

        private bool IsPoorSemantic(List<string>? terms, List<string>? definitions)
        {
            if ((terms == null || terms.Count == 0) || (definitions == null || definitions.Count == 0))
                return true;

            int total = terms.Count + definitions.Count;
            int poor = 0;

            bool IsPoor(string s)
            {
                if (string.IsNullOrWhiteSpace(s)) return true;
                var t = s.Trim();
                // very short tokens (<=2 chars) are likely poor
                if (t.Length <= 2) return true;
                // single uppercase letter or single digit
                if (System.Text.RegularExpressions.Regex.IsMatch(t, "^[A-Z]$")) return true;
                if (System.Text.RegularExpressions.Regex.IsMatch(t, "^[0-9]+$")) return true;
                // single token that's a single character or punctuation
                if (t.Split(' ', '\t').Length == 1 && t.Length <= 3) return true;
                return false;
            }

            foreach (var s in terms)
                if (IsPoor(s)) poor++;
            foreach (var s in definitions)
                if (IsPoor(s)) poor++;

            // if most entries are poor => low quality
            return total == 0 ? true : (poor / (double)total) >= 0.6;
        }

        private string EstimateQualityForRequest(string searchable, string answer)
        {
            if (string.IsNullOrWhiteSpace(searchable) || searchable.Length < 10)
                return "low";
            return string.IsNullOrWhiteSpace(answer) ? "low" : "good";
        }
    }
}
