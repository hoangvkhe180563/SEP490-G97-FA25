using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Utils
{
    /// <summary>
    /// Rule-based extractor for QuizSpec from free-form user text.
    /// Stores common regexes and heuristic rules to populate a <see cref="QuizSpec"/>.
    /// </summary>
    public static class QuizSpecExtractor
    {
        // ================= QUESTION TYPE =================

        private static readonly (Regex regex, string type)[] QuestionTypePatterns =
        {
            (new Regex(@"\b(điền\s*(đáp\s*án|vào|chỗ\s*trống)|fill\s*(in|blank))\b", RegexOptions.IgnoreCase), "FillBlank"),
            (new Regex(@"\b(chọn\s*1|chọn\s*một|select\s*one|choose\s*one)\b", RegexOptions.IgnoreCase), "SingleChoice"),
            (new Regex(@"\b(chọn\s*nhiều|chọn\s*ít\s*nhất|select\s*multiple|multiple\s*choice)\b", RegexOptions.IgnoreCase), "MultipleChoice"),
            (new Regex(@"\b(nối|ghép|matching|match)\b", RegexOptions.IgnoreCase), "Matching"),
            (new Regex(@"\b(nhập|gõ|type|write|viết|trả\s*lời)\b", RegexOptions.IgnoreCase), "TextInput")
        };

        // Người dùng nói cho có – bỏ hết
        private static readonly HashSet<string> IntentWords = new(StringComparer.OrdinalIgnoreCase)
        {
            "tôi","mình","em","anh","chị","bạn",
            "muốn","cần","hãy","giúp","làm","tạo","viết","cho"
        };

        // Từ điều khiển hệ thống – bỏ hết
        private static readonly HashSet<string> ControlWords = new(StringComparer.OrdinalIgnoreCase)
        {
            "câu","câu hỏi","đề","bài","dạng",
            "điền","điền đáp án","điền vào","ô trống",
            "trắc nghiệm","chọn","nối","ghép",
            "về","theo","đáp án", "nhập", "gõ", "viết", "trả lời", "nhiều", "một"
        };

        private static readonly HashSet<string> Stopwords = new(IntentWords
            .Concat(ControlWords)
            .Concat(new[]
            {
                "là","của","cho","trong",
                "the","a","an","to","for","on","in"
            }),
            StringComparer.OrdinalIgnoreCase);

        private static readonly Regex NumQuestionsRegex =
            new(@"(?i)\b(\d{1,3})\s*(câu\s*hỏi|câu|questions?|ques)\b",
                RegexOptions.Compiled);

        private static readonly Regex NumQuestionsWordRegex =
            new(@"(?i)\b((?:một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|linh|lẻ|\s)+)\s*(câu\s*hỏi|câu)\b",
                RegexOptions.Compiled);

        private static readonly string[] ConjunctionWords =
        {
            "và",
            "hoặc",
            "cũng như",
            "với",
            "and",
            "or",
            "&"
        };
        private static readonly Regex KeywordSplitRegex =
            new Regex(
                @"\s+(" + string.Join("|", ConjunctionWords.Select(Regex.Escape)) + @")\s+",
                RegexOptions.IgnoreCase | RegexOptions.Compiled
            );

        // ================= MAIN =================

        public static QuizSpec Extract(string input)
        {
            var spec = new QuizSpec();
            if (string.IsNullOrWhiteSpace(input)) return spec;

            var text = input.ToLowerInvariant();

            // ---------- 1. NumQuestions (digits, multiple-safe)
            var matches = NumQuestionsRegex.Matches(text);
            if (matches.Count > 0)
            {
                var best = matches[0]; // regex đã gắn chặt "câu hỏi"
                if (int.TryParse(best.Groups[1].Value, out var n))
                    spec.NumQuestions = n;
            }
            else
            {
                // ---------- 1b. NumQuestions (Vietnamese words, unlimited)
                var wm = NumQuestionsWordRegex.Match(text);
                if (wm.Success)
                {
                    spec.NumQuestions = ParseVietnameseNumber(wm.Groups[1].Value);
                }
            }

            // ---------- 2. QuestionType
            foreach (var (regex, type) in QuestionTypePatterns)
            {
                if (regex.IsMatch(text))
                {
                    spec.QuestionType = type;
                    break;
                }
            }

            // ---------- 3. Keywords (FILTER OUT, KEEP REMAINDER)

            // 3.1 Remove numbers & noise
            var cleaned = Regex.Replace(text, @"\b\d+\b", " ");
            cleaned = Regex.Replace(cleaned, @"[^\p{L}\s]", " ");
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();

            // 3.2 Remove intent + control phrases (whole words)
            foreach (var w in Stopwords.OrderByDescending(w => w.Length))
            {
                cleaned = Regex.Replace(
                    cleaned,
                    $@"\b{Regex.Escape(w)}\b",
                    " ",
                    RegexOptions.IgnoreCase);
            }

            // 3.3 Normalize spaces again
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();

            // 3.4 Final keywords
            var keywordParts = KeywordSplitRegex
            .Split(cleaned)
            .Select(p => p.Trim())
            .Where(p =>
                p.Length > 2 &&
                !Stopwords.Contains(p))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

            spec.Keywords = keywordParts
            .Select(CleanKeyword)
            .Where(k => k.Length > 2)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

            return spec;
        }

        // ================= VIETNAMESE NUMBER PARSER =================

        private static int ParseVietnameseNumber(string input)
        {
            var map = new Dictionary<string, int>
            {
                ["không"] = 0,
                ["một"] = 1,
                ["hai"] = 2,
                ["ba"] = 3,
                ["bốn"] = 4,
                ["năm"] = 5,
                ["sáu"] = 6,
                ["bảy"] = 7,
                ["tám"] = 8,
                ["chín"] = 9,
                ["mười"] = 10,
                ["linh"] = 0,
                ["lẻ"] = 0
            };

            var parts = input.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            int total = 0;
            int current = 0;

            foreach (var p in parts)
            {
                if (!map.TryGetValue(p, out var value)) continue;

                if (value == 10)
                {
                    current = current == 0 ? 10 : current * 10;
                }
                else
                {
                    current += value;
                }
            }

            total += current;
            return total;
        }
        private static string CleanKeyword(string keyword)
        {
            var result = keyword;

            foreach (var conj in ConjunctionWords.OrderByDescending(c => c.Length))
            {
                result = Regex.Replace(
                    result,
                    $@"\b{Regex.Escape(conj)}\b",
                    " ",
                    RegexOptions.IgnoreCase);
            }

            result = Regex.Replace(result, @"\s+", " ").Trim();
            return result;
        }
    }

}
