using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace StudyHub.Backend.UseCases.Utils
{
    public static class QuestionTextPatterns
    {
        // Expanded imperative/command words/phrases in Vietnamese and English to remove (~60+ entries)
        public static readonly string[] CommandWords = new[] {
            "chọn", "chọn đáp án", "chọn câu", "chọn câu đúng", "chọn đáp án đúng", "chọn phương án",
            "hãy chọn", "hãy chọn một", "hãy chọn đáp án", "hãy chọn đáp án đúng", "hãy chọn câu", "hãy chọn câu đúng",
            "nối", "nối cho đúng", "nối cặp", "nối các cặp", "ghép đôi", "ghép cặp", "match", "matching",
            "connect", "link", "connect the following", "link the following", "match the following", "match the pairs",
            "select", "select one", "select the correct", "select the correct answer", "select the right answer",
            "pick", "pick one", "pick the answer", "pick the correct", "choose", "choose one", "choose the correct",
            "choose the answer", "choose the right", "tick", "tick the right answer", "tick the correct answer",
            "mark", "mark the correct", "mark the answer", "đặt", "ghi", "viết", "viết đáp án", "điền", "điền vào",
            "điền vào chỗ trống", "điền từ thích hợp", "hoàn thành", "hoàn thành câu", "sắp xếp", "sắp xếp theo thứ tự",
            "liệt kê", "kể tên", "tìm", "tìm đáp án", "xác định", "nhận biết", "identify", "identify the",
            "underline", "underline the", "choose the best", "choose the best answer", "choose the most",
            "select the best", "select the most", "which of the following", "which one is", "which is the",
            "pick the", "choose the most appropriate", "choose the most suitable", "arrange", "arrange the following"
        };

        // Expanded words/phrases that indicate desired answer / answer markers (~40+ entries)
        public static readonly string[] AnswerIndicatorWords = new[] {
            "đáp án", "đáp án là", "đáp án đúng", "câu đúng", "đáp án số", "đáp án thứ", "đáp án thứ",
            "câu trả lời", "câu trả lời là", "đáp án nằm ở", "đáp án nằm ở vị trí", "câu trả lời nằm ở",
            "correct answer", "answer is", "the answer is", "right answer", "true answer", "the correct answer is",
            "correct", "correct one", "đúng là", "sai là", "đúng", "sai", "chính xác", "đúng nhất", "đúng nhất là",
            "hoặc", "hoặc là", "lựa chọn", "lựa chọn đúng", "lựa chọn phù hợp", "điền vào chỗ trống",
            "đáp án/", "kết quả là", "kết luận là", "result is", "answer", "the answer", "the correct",
            "best answer", "most appropriate", "most suitable", "most correct", "most likely", "should be",
            "điền đáp án", "ghi đáp án", "viết đáp án", "trả lời", "trả lời là"
        };

        // Normalize question text: remove punctuation, lowercase, remove command/answer indicator words and extra spaces
        public static string NormalizeAndStrip(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;

            var t = text.ToLowerInvariant();

            // remove punctuation
            t = Regex.Replace(t, "[\\p{P}\"]+", " ");

            // remove command words and answer indicators (as whole phrases)
            foreach (var phrase in CommandWords.Concat(AnswerIndicatorWords).OrderByDescending(s => s.Length))
            {
                if (string.IsNullOrWhiteSpace(phrase)) continue;
                // replace phrase boundaries
                t = Regex.Replace(t, "\\b" + Regex.Escape(phrase) + "\\b", " ");
            }

            // collapse whitespace
            t = Regex.Replace(t, "\\s+", " ").Trim();

            return t;
        }

        // Token count after normalization
        public static int TokenCount(string normalized)
        {
            if (string.IsNullOrWhiteSpace(normalized)) return 0;
            return normalized.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).Length;
        }
    }
}
