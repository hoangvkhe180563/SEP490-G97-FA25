using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassMemberService
    {
        private readonly IClassRepository _classRepository;
        private readonly IClassMemberRepository _classMemberRepository;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IAppUserRepository _userRepository;
        private readonly SmtpEmailService _emailService;
        public ClassMemberService(IClassMemberRepository classRepository, ICloudinaryRepository fileStorage, IAppUserRepository userRepository, SmtpEmailService emailService, IClassRepository classes)
        {
            _classMemberRepository = classRepository;
            _fileStorage = fileStorage;
            _userRepository = userRepository;
            _emailService = emailService;
            _classRepository = classes;
        }
        public List<AppUserSubjectClass> GetClassMembers(int id) => _classMemberRepository.GetClassMembers(id);


        // Invite flow moved to service. Accept simple primitives (no Api DTOs) so use-cases project doesn't reference Api project.
        public async Task<List<object>> InviteByEmailsAsync(int classId, List<string> emails, string role, string? message, string baseFrontendUrl)
        {
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) throw new ArgumentException("Không tìm thấy lớp học.");

            if (emails == null || emails.Count == 0)
                throw new ArgumentException("Cần cung cấp ít nhất một email để mời.");

            var results = new List<object>();

            foreach (var raw in emails.Select(e => e?.Trim()).Where(e => !string.IsNullOrWhiteSpace(e)).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var email = raw!;
                var user = _userRepository.GetByEmail(email);

                if (user != null)
                {
                    var invited = _classMemberRepository.InviteMember(user.Id, classId);
                    var acceptUrl = $"{baseFrontendUrl}/class/{role.ToLower()}/{classId}/invite/confirm";
                    try
                    {
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", acceptUrl, inviterName: _userRepository.GetById(cls.CreatedBy)?.Fullname ?? "", customMessage: message);
                    }
                    catch
                    {
                        // swallow email errors
                    }
                    results.Add(new { email, existingAccount = true, invited });
                }
                else
                {
                    var registerUrl = $"{baseFrontendUrl}/register?email={WebUtility.UrlEncode(email)}&redirect=/class/{classId}";
                    try
                    {
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", registerUrl, inviterName: _userRepository.GetById(cls.CreatedBy)?.Fullname ?? "", customMessage: message);
                    }
                    catch
                    {
                    }
                    results.Add(new { email, existingAccount = false, invited = false });
                }
            }

            return results;
        }

        // Helpers for confirm/kick with string parsing (controller can call these)
        public bool? ConfirmMemberFromString(int classId, string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return null;
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) return false;
            return _classMemberRepository.ConfirmMember(userGuid, classId);
        }

        public bool? KickMemberFromString(int classId, string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return null;
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) return false;
            return _classMemberRepository.KickMember(userGuid, classId);
        }
        public List<Class> GetAllClassByUserId(Guid userid) => _classRepository.GetAllClassByUserId(userid);


        public bool InviteMember(Guid userId, int classId) => _classMemberRepository.InviteMember(userId, classId);
        public bool ConfirmMember(Guid userId, int classId) => _classMemberRepository.ConfirmMember(userId, classId);
        public bool KickMember(Guid userId, int classId) => _classMemberRepository.KickMember(userId, classId);
    }
}
