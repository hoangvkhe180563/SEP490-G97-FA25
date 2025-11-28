using StudyHub.Backend.Domain.Entities.Exam;
using StudyHub.Backend.UseCases.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;
using System.Text.Json;

namespace StudyHub.Backend.UseCases.Services
{
    public class ExamService
    {
        private readonly IQuestionRepository _questionRepo;
        private readonly IAnswerRepository _answerRepo;
        private readonly IExamRepository _examRepo;
        private readonly IExamResultRepository _examResultRepo;
        public ExamService(IQuestionRepository questionRepo, IExamRepository examRepo, IExamResultRepository examResultRepo, IAnswerRepository answerRepo)
        {
            _questionRepo = questionRepo;
            _examRepo = examRepo;
            _examResultRepo = examResultRepo;
            _answerRepo = answerRepo;
        }

        public List<Exam> GetAllClassExamsByStudent(Guid studentId)
        {
            return _examRepo.GetAllClassExamsByStudent(studentId);
        }

        public List<Exam> GetAllClassExams(int classId)
        {
            return _examRepo.GetAllClassExams(classId);
        }

        public Exam? GetLessonExam(int lessonId)
        {
            var exam = _examRepo.GetLessonExam(lessonId);
            if (exam != null)
            {
                var questionObjectIds = _examRepo.GetExamQuestionObjectIds(exam.Id);
                var questions = _questionRepo.GetManyQuestionsById(questionObjectIds);
                exam.Questions = questions;
            }
            return exam;
        }

        public string GetClassName(int classId)
        {
            return _examRepo.GetClassName(classId);
        }

        public Exam? GetExamById(int id, bool retrieveQuestions)
        {
            var exam = _examRepo.GetExamById(id);
            if (exam == null)
            {
                return null;
            }
            if (retrieveQuestions && exam.NoRandomQuestions == null)
            {
                var questionObjectIds = _examRepo.GetExamQuestionObjectIds(id);
                var questions = _questionRepo.GetManyQuestionsById(questionObjectIds);
                exam.Questions = questions;
            }
            return exam;
        }

        public bool CreateExam(Exam examEntity)
        {
            List<string> questionObjectIds = [];
            if (examEntity.Questions.Count != 0)
            {
                questionObjectIds = _questionRepo.AddManyQuestions(examEntity.Questions);
            }
            bool success = _examRepo.CreateExam(examEntity, questionObjectIds);
            return success;
        }

        public bool UpdateExam(Exam examEntity)
        {
            return _examRepo.UpdateExam(examEntity);
        }

        public bool UpdateExamQuestions(int examId, List<string> questionObjectIds)
        {
            return _examRepo.UpdateExamQuestions(examId, questionObjectIds);
        }

        public List<string> UpdateExamQuestions(int examId, List<Question> questions)
        {
            List<string> objectIdsFromDb = _examRepo.GetExamQuestionObjectIds(examId);
            List<string> objectIdsFromApi = questions.Select(x => x.Id).ToList();

            if (objectIdsFromApi.Count == 0 || objectIdsFromApi.Count == 0)
            {
                return [];
            }

            List<string> removeObjectIds = objectIdsFromDb.Except(objectIdsFromApi).ToList();
            List<string> updateObjectIds = objectIdsFromApi.Where(id => id != string.Empty).Intersect(objectIdsFromDb).ToList();

            var questionsToAdd = questions.Where(q => q.Id == string.Empty).ToList();
            List<string> addObjectIds = [];
            if (questionsToAdd.Count > 0)
            {
                addObjectIds = _questionRepo.AddManyQuestions(questionsToAdd);
            }

            bool isDeleted = false, isUpdated = false;

            if (removeObjectIds.Count > 0)
            {
                isDeleted = _questionRepo.DeleteManyQuestions(removeObjectIds);
            }

            if (updateObjectIds.Count > 0)
            {
                var questionsToUpdate = questions.Where(q => updateObjectIds.Contains(q.Id)).ToList();
                isUpdated = _questionRepo.UpdateManyQuestions(questionsToUpdate);
            }

            return addObjectIds.Concat(updateObjectIds).ToList();
        }

        public List<ExamResult> GetExamResultsByExamId(int examId)
        {
            var result = _examResultRepo.GetExamResultsByExamId(examId);
            return result;
        }

        public ExamResult? GetExamResultById(string resultId, bool isTeacher)
        {
            var result = _examResultRepo.GetExamResultById(resultId);
            if (result == null) return null;

            var exam = _examRepo.GetExamById(result.ExamId);

            if (exam == null) return null;

            var resultObjectId = result.Id;

            bool showAnswers = isTeacher || exam.ShowAnswers;
            bool showCorrectAnswers = isTeacher || exam.ShowCorrectAnswers;
            var answers = _answerRepo.GetAnswersByResultId(resultObjectId, showAnswers, showCorrectAnswers);
            result.Answers = answers;
            return result;
        }

        public List<ExamResult> GetResultsByExamIdAndStudentId(int examId, Guid studentId)
        {
            return _examResultRepo.GetResultsByExamIdAndStudentId(examId, studentId);
        }

        public string CreateExamPaper(List<ExamAnswer> answers)
        {
            return _answerRepo.AddManyAnswers(answers);
        }

        public bool CreateExamResult(ExamResult result)
        {
            return _examResultRepo.CreateExamResult(result);
        }

        public bool UpdateExamPaper(string resultObjectId, List<ExamAnswer> answers)
        {
            return _answerRepo.UpdateManyAnswers(resultObjectId, answers);
        }

        public bool UpdateExamResult(ExamResult result)
        {
            return _examResultRepo.UpdateExamResult(result);
        }

        public bool? CheckIfResultIsSubmitted(string resultId)
        {
            return _examResultRepo.CheckIfResultIsSubmitted(resultId);
        }

        public bool SubmitExamResult(string resultId)
        {
            DateTime submissionTime = DateTime.Now;

            //1. get all the answers of the exam paper
            List<ExamAnswer> answers = _answerRepo.GetAnswersByResultId(resultId, true, false);

            //2. get all the questions of the exam paper
            List<string> questionObjectIds = answers.Select(a => a.QuestionId).ToList();
            List<Question> questions = _questionRepo.GetManyQuestionsById(questionObjectIds);

            //3. calculate mark
            int corrects = 0;
            for (int i = 0; i < questions.Count; i++)
            {
                switch (questions[i].Type)
                {
                    case QuestionType.SingleChoice:
                        {
                            SingleChoiceQuestion? scq = questions[i] as SingleChoiceQuestion;
                            int studentAnswer = int.Parse(answers[i].JsonAnswers);
                            if (studentAnswer == scq.CorrectAnswer)
                            {
                                corrects++;
                                answers[i].IsCorrect = true;
                            }
                            else
                            {
                                answers[i].IsCorrect = false;
                            }
                        }
                        break;
                    case QuestionType.MultipleChoice:
                        {
                            MultipleChoiceQuestion? mcq = questions[i] as MultipleChoiceQuestion;
                            List<int> studentAnswer = JsonSerializer.Deserialize<List<int>>(answers[i].JsonAnswers) ?? [];
                            if (studentAnswer.Count != 0 && studentAnswer.Count == mcq.CorrectAnswer.Count && studentAnswer.All(mcq.CorrectAnswer.Contains))
                            {
                                corrects++;
                                answers[i].IsCorrect = true;
                            }
                            else
                            {
                                answers[i].IsCorrect = false;
                            }
                        }
                        break;
                    case QuestionType.TextInput:
                        {
                            TextInputQuestion? tiq = questions[i] as TextInputQuestion;
                            string studentAnswer = answers[i].JsonAnswers;
                            if (studentAnswer.ToLower().Trim() == tiq.CorrectAnswer.ToLower().Trim())
                            {
                                corrects++;
                                answers[i].IsCorrect = true;
                            }
                            else
                            {
                                answers[i].IsCorrect = false;
                            }
                        }
                        break;
                    case QuestionType.FillBlank:
                        {
                            FillBlankQuestion? fbq = questions[i] as FillBlankQuestion;
                            List<string> studentAnswer = JsonSerializer.Deserialize<List<string>>(answers[i].JsonAnswers) ?? [];

                            fbq.CorrectAnswer = fbq.CorrectAnswer.Select(ans => ans.ToLower().Trim()).ToList();
                            studentAnswer = studentAnswer.Select(ans => ans.ToLower().Trim()).ToList();

                            if (studentAnswer.Count != 0 && studentAnswer.Count == fbq.CorrectAnswer.Count && studentAnswer.All(fbq.CorrectAnswer.Contains))
                            {
                                corrects++;
                                answers[i].IsCorrect = true;
                            }
                            else
                            {
                                answers[i].IsCorrect = false;
                            }
                        }
                        break;
                    case QuestionType.Matching:
                        {
                            MatchingQuestion? mq = questions[i] as MatchingQuestion;
                            Dictionary<string, int> tempAnswer = JsonSerializer.Deserialize<Dictionary<string, int>>(answers[i].JsonAnswers) ?? new Dictionary<string, int>();
                            Dictionary<int, int> studentAnswer = new Dictionary<int, int>();
                            foreach (var kvp in tempAnswer)
                            {
                                if (int.TryParse(kvp.Key, out int key))
                                {
                                    studentAnswer[key] = kvp.Value;
                                }
                            }

                            bool isCorrect = true;
                            if (studentAnswer.Count != mq.CorrectAnswer.Count)
                            {
                                isCorrect = false;
                            }
                            else
                            {
                                foreach (var kvp in mq.CorrectAnswer)
                                {
                                    if (!studentAnswer.ContainsKey(kvp.Key) || studentAnswer[kvp.Key] != kvp.Value)
                                    {
                                        isCorrect = false;
                                        break;
                                    }
                                }
                            }

                            if (isCorrect)
                            {
                                corrects++;
                                answers[i].IsCorrect = true;
                            }
                            else
                            {
                                answers[i].IsCorrect = false;
                            }
                        }
                        break;
                }
            }
            decimal score = ((decimal)corrects / questions.Count) * 10;

            //4. update answer to exam paper (MongoDB)
            bool isAnswerUpdated = _answerRepo.UpdateManyAnswers(resultId, answers);
            if (!isAnswerUpdated)
            {
                new UseCaseException("ExamService", "SubmitExamResult error: Correct answers are not updated!").LogError();
                return false;
            }

            //5. update exam result (MySQL)
            var result = new ExamResult
            {
                Id = resultId,
                SubmissionTime = DateTime.Now,
                Score = score,
            };

            bool isResultSubmitted = _examResultRepo.SubmitExam(result);
            if (!isResultSubmitted)
            {
                new UseCaseException("ExamService", "SubmitExamResult error: Exam submitting failed!").LogError();
                return false;
            }

            //6. update learning progress if it is the lesson exam
            int examId = _examRepo.GetExamIdByResultId(resultId);
            var exam = GetExamById(examId, false);
            if (exam == null)
            {
                new UseCaseException("ExamService", "SubmitExamResult error: Cannot found exam!").LogError();
                return false;
            }
            if (exam.LessonId != 0)
            {
                int enrollmentId = _examResultRepo.GetEnrollmentId(resultId, exam.LessonId);
                if (enrollmentId == 0)
                {
                    new UseCaseException("ExamService", "SubmitExamResult error: No lesson provided!").LogError();
                    return false;
                }

                return _examResultRepo.CreateProgress(enrollmentId, exam.LessonId);
            }
            else return isResultSubmitted;
        }

        public List<Question> GenerateRandomQuestions(int examId)
        {
            var exam = _examRepo.GetExamById(examId);
            if (exam == null || exam.NoRandomQuestions == null || exam.SubjectId == null || exam.Grade == null)
            {
                new UseCaseException("ExamService", "GenerateRandomQuestions error: The exam's questions might be manually input!").LogError();
                return [];
            }
            return _questionRepo.GenerateRandomQuestions(exam.NoRandomQuestions.Value, exam.SubjectId.Value, exam.Grade.Value);
        }
    }
}
