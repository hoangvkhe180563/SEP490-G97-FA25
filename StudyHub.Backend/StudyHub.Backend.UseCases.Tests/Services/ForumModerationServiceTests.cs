using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class ForumModerationServiceTests
{
    [Fact]
    public async Task GetRuleByIdAsync_ShouldReturnRule_WhenRuleExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var rule = new ForumRule { Id = 1, Name = "No Spam" };
        mockModerationRepo.Setup(x => x.GetRuleByIdAsync(1)).ReturnsAsync(rule);
        mockModerationRepo.Setup(x => x.GetPatternsByRuleIdAsync(1, null, null, null))
            .ReturnsAsync((new List<RulePattern>(), 0));

        var result = await service.GetRuleByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("No Spam", result.Name);
    }

    [Fact]
    public async Task GetRuleByIdAsync_ShouldReturnNull_WhenRuleDoesNotExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.GetRuleByIdAsync(999)).ReturnsAsync((ForumRule?)null);

        var result = await service.GetRuleByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetRulesBySchoolAsync_ShouldReturnRules_WhenRulesExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var rules = new List<ForumRule>
        {
            new ForumRule { Id = 1, SchoolId = 1 },
            new ForumRule { Id = 2, SchoolId = 1 }
        };
        mockModerationRepo.Setup(x => x.GetRulesBySchoolIdAsync(1, null, null, null, null))
            .ReturnsAsync((rules, 2));

        var result = await service.GetRulesBySchoolAsync(1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetRulesBySchoolAsync_ShouldReturnEmpty_WhenNoRulesExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.GetRulesBySchoolIdAsync(1, null, null, null, null))
            .ReturnsAsync((new List<ForumRule>(), 0));

        var result = await service.GetRulesBySchoolAsync(1);

        Assert.Equal(0, result.totalCount);
        Assert.Empty(result.rules);
    }

    [Fact]
    public async Task GetActiveRulesBySchoolAsync_ShouldReturnActiveRules_WhenExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var rules = new List<ForumRule>
        {
            new ForumRule { Id = 1, SchoolId = 1, IsActive = true }
        };
        mockModerationRepo.Setup(x => x.GetActiveRulesBySchoolIdAsync(1)).ReturnsAsync(rules);

        var result = await service.GetActiveRulesBySchoolAsync(1);

        Assert.Single(result);
        Assert.True(result[0].IsActive);
    }

    [Fact]
    public async Task CreateRuleWithPatternsAsync_ShouldCreateRuleAndPatterns_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var rule = new ForumRule { Name = "No Profanity", SchoolId = 1 };
        var patterns = new List<string> { "bad", "worse" };

        mockModerationRepo.Setup(x => x.CreateRuleAsync(It.IsAny<ForumRule>())).ReturnsAsync(rule);
        mockModerationRepo.Setup(x => x.GetRuleByIdAsync(It.IsAny<int>())).ReturnsAsync(rule);
        mockModerationRepo.Setup(x => x.GetPatternsByRuleIdAsync(It.IsAny<int>(), null, null, null))
            .ReturnsAsync((new List<RulePattern>(), 0));

        var result = await service.CreateRuleWithPatternsAsync(rule, patterns);

        Assert.NotNull(result);
        mockModerationRepo.Verify(x => x.CreatePatternAsync(It.IsAny<RulePattern>()), Times.Exactly(2));
    }

    [Fact]
    public async Task CreateRuleWithPatternsAsync_ShouldSkipEmptyPatterns_WhenPatternsContainWhitespace()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var rule = new ForumRule { Name = "No Profanity", SchoolId = 1 };
        var patterns = new List<string> { "bad", "", "  ", "worse" };

        mockModerationRepo.Setup(x => x.CreateRuleAsync(It.IsAny<ForumRule>())).ReturnsAsync(rule);
        mockModerationRepo.Setup(x => x.GetRuleByIdAsync(It.IsAny<int>())).ReturnsAsync(rule);
        mockModerationRepo.Setup(x => x.GetPatternsByRuleIdAsync(It.IsAny<int>(), null, null, null))
            .ReturnsAsync((new List<RulePattern>(), 0));

        var result = await service.CreateRuleWithPatternsAsync(rule, patterns);

        Assert.NotNull(result);
        mockModerationRepo.Verify(x => x.CreatePatternAsync(It.IsAny<RulePattern>()), Times.Exactly(2));
    }

    [Fact]
    public async Task UpdateRuleAsync_ShouldUpdateRule_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var rule = new ForumRule { Id = 1, Name = "Updated Rule" };
        mockModerationRepo.Setup(x => x.UpdateRuleAsync(It.IsAny<ForumRule>())).ReturnsAsync(rule);

        var result = await service.UpdateRuleAsync(rule);

        Assert.Equal("Updated Rule", result.Name);
    }

    [Fact]
    public async Task DeleteRuleAsync_ShouldDeleteRule_WhenRuleExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.DeleteRuleAsync(1)).ReturnsAsync(true);

        var result = await service.DeleteRuleAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task DeleteRuleAsync_ShouldReturnFalse_WhenRuleDoesNotExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.DeleteRuleAsync(999)).ReturnsAsync(false);

        var result = await service.DeleteRuleAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task ToggleRuleStatusAsync_ShouldToggleStatus_WhenRuleExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.ToggleRuleActiveStatusAsync(1)).ReturnsAsync(true);

        var result = await service.ToggleRuleStatusAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task GetPatternByIdAsync_ShouldReturnPattern_WhenPatternExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var pattern = new RulePattern { Id = 1, Pattern = "badword" };
        mockModerationRepo.Setup(x => x.GetPatternByIdAsync(1)).ReturnsAsync(pattern);

        var result = await service.GetPatternByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("badword", result.Pattern);
    }

    [Fact]
    public async Task GetPatternsByRuleAsync_ShouldReturnPatterns_WhenPatternsExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var patterns = new List<RulePattern>
        {
            new RulePattern { Id = 1, RuleId = 1 },
            new RulePattern { Id = 2, RuleId = 1 }
        };
        mockModerationRepo.Setup(x => x.GetPatternsByRuleIdAsync(1, null, null, null))
            .ReturnsAsync((patterns, 2));

        var result = await service.GetPatternsByRuleAsync(1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetPatternsByRuleAsync_ShouldFilterByActive_WhenActiveProvided()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var patterns = new List<RulePattern>
        {
            new RulePattern { Id = 1, RuleId = 1, IsActive = true }
        };
        mockModerationRepo.Setup(x => x.GetPatternsByRuleIdAsync(1, true, null, null))
            .ReturnsAsync((patterns, 1));

        var result = await service.GetPatternsByRuleAsync(1, true);

        Assert.Single(result.patterns);
        Assert.True(result.patterns[0].IsActive);
    }

    [Fact]
    public async Task CreatePatternAsync_ShouldCreatePattern_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var pattern = new RulePattern { RuleId = 1, Pattern = "spam" };
        mockModerationRepo.Setup(x => x.CreatePatternAsync(It.IsAny<RulePattern>())).ReturnsAsync(pattern);

        var result = await service.CreatePatternAsync(pattern);

        Assert.NotNull(result);
        Assert.Equal("spam", result.Pattern);
    }

    [Fact]
    public async Task UpdatePatternAsync_ShouldUpdatePattern_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var pattern = new RulePattern { Id = 1, Pattern = "updated" };
        mockModerationRepo.Setup(x => x.UpdatePatternAsync(It.IsAny<RulePattern>())).ReturnsAsync(pattern);

        var result = await service.UpdatePatternAsync(pattern);

        Assert.Equal("updated", result.Pattern);
    }

    [Fact]
    public async Task DeletePatternAsync_ShouldDeletePattern_WhenPatternExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.DeletePatternAsync(1)).ReturnsAsync(true);

        var result = await service.DeletePatternAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task TogglePatternStatusAsync_ShouldToggleStatus_WhenPatternExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.TogglePatternActiveStatusAsync(1)).ReturnsAsync(true);

        var result = await service.TogglePatternStatusAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task CheckContentViolationAsync_ShouldReturnViolations_WhenContentViolatesRules()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var violations = new List<(int, int, int)> { (1, 1, 5) };
        mockModerationRepo.Setup(x => x.CheckContentViolationAsync("bad content", 1))
            .ReturnsAsync(violations);

        var result = await service.CheckContentViolationAsync("bad content", 1);

        Assert.Single(result);
        Assert.Equal(5, result[0].ViolationScore);
    }

    [Fact]
    public async Task CheckContentViolationAsync_ShouldReturnEmpty_WhenNoViolations()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.CheckContentViolationAsync("clean content", 1))
            .ReturnsAsync(new List<(int, int, int)>());

        var result = await service.CheckContentViolationAsync("clean content", 1);

        Assert.Empty(result);
    }

    [Fact]
    public async Task CheckContentViolationAsync_ShouldReturnMultipleViolations_WhenContentViolatesMultipleRules()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var violations = new List<(int, int, int)> { (1, 1, 5), (2, 2, 3) };
        mockModerationRepo.Setup(x => x.CheckContentViolationAsync("very bad content", 1))
            .ReturnsAsync(violations);

        var result = await service.CheckContentViolationAsync("very bad content", 1);

        Assert.Equal(2, result.Count);
        Assert.Equal(8, result.Sum(v => v.ViolationScore));
    }

    [Fact]
    public async Task GetUserForumStatusAsync_ShouldReturnStatus_WhenStatusExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        var status = new UserForumStatus { UserId = userId, SchoolId = 1, TotalViolationScore = 90 };
        mockModerationRepo.Setup(x => x.GetUserForumStatusAsync(userId, 1)).ReturnsAsync(status);

        var result = await service.GetUserForumStatusAsync(userId, 1);

        Assert.NotNull(result);
        Assert.Equal(90, result.TotalViolationScore);
    }

    [Fact]
    public async Task GetUserForumStatusAsync_ShouldReturnNull_WhenStatusDoesNotExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        mockModerationRepo.Setup(x => x.GetUserForumStatusAsync(userId, 1)).ReturnsAsync((UserForumStatus?)null);

        var result = await service.GetUserForumStatusAsync(userId, 1);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetUserForumStatusesAsync_ShouldReturnStatuses_WhenStatusesExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var statuses = new List<UserForumStatus>
        {
            new UserForumStatus { UserId = Guid.NewGuid(), SchoolId = 1 },
            new UserForumStatus { UserId = Guid.NewGuid(), SchoolId = 1 }
        };
        mockModerationRepo.Setup(x => x.GetUserForumStatusesAsync(1, null, null, null, null, null, null, null))
            .ReturnsAsync((statuses, 2));

        var result = await service.GetUserForumStatusesAsync(1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task MuteUserAsync_ShouldMuteUser_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        mockModerationRepo.Setup(x => x.MuteUserAsync(userId, 1, It.IsAny<DateTime>())).ReturnsAsync(true);

        var result = await service.MuteUserAsync(userId, 1, DateTime.Now.AddDays(7));

        Assert.True(result);
    }

    [Fact]
    public async Task UnmuteUserAsync_ShouldUnmuteUser_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        mockModerationRepo.Setup(x => x.UnmuteUserAsync(userId, 1)).ReturnsAsync(true);

        var result = await service.UnmuteUserAsync(userId, 1);

        Assert.True(result);
    }

    [Fact]
    public async Task IsUserMutedAsync_ShouldReturnTrue_WhenUserIsMuted()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        mockModerationRepo.Setup(x => x.IsUserMutedAsync(userId, 1)).ReturnsAsync(true);

        var result = await service.IsUserMutedAsync(userId.ToString(), 1);

        Assert.True(result);
    }

    [Fact]
    public async Task IsUserMutedAsync_ShouldReturnFalse_WhenUserIsNotMuted()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        mockModerationRepo.Setup(x => x.IsUserMutedAsync(userId, 1)).ReturnsAsync(false);

        var result = await service.IsUserMutedAsync(userId.ToString(), 1);

        Assert.False(result);
    }

    [Fact]
    public async Task AddViolationScoreAsync_ShouldAddScore_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        mockModerationRepo.Setup(x => x.AddViolationScoreAsync(userId, 1, 10)).ReturnsAsync(true);

        var result = await service.AddViolationScoreAsync(userId, 1, 10);

        Assert.True(result);
    }

    [Fact]
    public async Task ResetViolationScoreAsync_ShouldResetScore_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        mockModerationRepo.Setup(x => x.ResetViolationScoreAsync(userId, 1)).ReturnsAsync(true);

        var result = await service.ResetViolationScoreAsync(userId, 1);

        Assert.True(result);
    }

    [Fact]
    public async Task GetViolationRecordByIdAsync_ShouldReturnRecord_WhenRecordExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var record = new ViolationRecord { Id = 1, ViolationScore = 5 };
        mockModerationRepo.Setup(x => x.GetViolationRecordByIdAsync(1)).ReturnsAsync(record);

        var result = await service.GetViolationRecordByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal(5, result.ViolationScore);
    }

    [Fact]
    public async Task GetViolationRecordsByUserAsync_ShouldReturnRecords_WhenRecordsExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        var records = new List<ViolationRecord>
        {
            new ViolationRecord { Id = 1, UserId = userId },
            new ViolationRecord { Id = 2, UserId = userId }
        };
        mockModerationRepo.Setup(x => x.GetViolationRecordsByUserAsync(userId, 1, null, null, null, null, null))
            .ReturnsAsync((records, 2));

        var result = await service.GetViolationRecordsByUserAsync(userId, 1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetViolationRecordsBySchoolAsync_ShouldReturnRecords_WhenRecordsExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var records = new List<ViolationRecord>
        {
            new ViolationRecord { Id = 1, SchoolId = 1 },
            new ViolationRecord { Id = 2, SchoolId = 1 }
        };
        mockModerationRepo.Setup(x => x.GetViolationRecordsBySchoolAsync(1, null, null, null, null, null))
            .ReturnsAsync((records, 2));

        var result = await service.GetViolationRecordsBySchoolAsync(1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetViolationRecordsByPostIdAsync_ShouldReturnRecords_WhenRecordsExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var records = new List<ViolationRecord>
        {
            new ViolationRecord { Id = 1, PostId = 1 },
            new ViolationRecord { Id = 2, PostId = 1 }
        };
        mockModerationRepo.Setup(x => x.GetViolationRecordsByPostIdAsync(1)).ReturnsAsync(records);

        var result = await service.GetViolationRecordsByPostIdAsync(1);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetViolationRecordsByCommentIdAsync_ShouldReturnRecords_WhenRecordsExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var records = new List<ViolationRecord>
        {
            new ViolationRecord { Id = 1, CommentId = 1 },
            new ViolationRecord { Id = 2, CommentId = 1 }
        };
        mockModerationRepo.Setup(x => x.GetViolationRecordsByCommentIdAsync(1)).ReturnsAsync(records);

        var result = await service.GetViolationRecordsByCommentIdAsync(1);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task CreateViolationRecordAsync_ShouldCreateRecord_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var record = new ViolationRecord { UserId = Guid.NewGuid(), SchoolId = 1, ViolationScore = 5 };
        mockModerationRepo.Setup(x => x.CreateViolationRecordAsync(It.IsAny<ViolationRecord>())).ReturnsAsync(record);

        var result = await service.CreateViolationRecordAsync(record);

        Assert.NotNull(result);
        Assert.Equal(5, result.ViolationScore);
    }

    [Fact]
    public async Task SoftDeleteViolationRecordAsync_ShouldDeleteRecord_WhenRecordExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.SoftDeleteViolationRecordAsync(1)).ReturnsAsync(true);

        var result = await service.SoftDeleteViolationRecordAsync(1);

        Assert.True(result);
    }

    [Fact]
    public async Task GetAppealByIdAsync_ShouldReturnAppeal_WhenAppealExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var appeal = new ForumAppeal { Id = 1, Reason = "Wrongly banned" };
        mockModerationRepo.Setup(x => x.GetAppealByIdAsync(1)).ReturnsAsync(appeal);

        var result = await service.GetAppealByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("Wrongly banned", result.Reason);
    }

    [Fact]
    public async Task GetAppealsByUserAsync_ShouldReturnAppeals_WhenAppealsExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        var appeals = new List<ForumAppeal>
        {
            new ForumAppeal { Id = 1, UserId = userId },
            new ForumAppeal { Id = 2, UserId = userId }
        };
        mockModerationRepo.Setup(x => x.GetAppealsByUserAsync(userId, 1, null, null, null))
            .ReturnsAsync((appeals, 2));

        var result = await service.GetAppealsByUserAsync(userId, 1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetAppealsBySchoolAsync_ShouldReturnAppeals_WhenAppealsExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var appeals = new List<ForumAppeal>
        {
            new ForumAppeal { Id = 1, SchoolId = 1 },
            new ForumAppeal { Id = 2, SchoolId = 1 }
        };
        mockModerationRepo.Setup(x => x.GetAppealsBySchoolAsync(1, null, null, null, null, null, null))
            .ReturnsAsync((appeals, 2));

        var result = await service.GetAppealsBySchoolAsync(1);

        Assert.Equal(2, result.totalCount);
    }

    [Fact]
    public async Task GetPendingAppealsBySchoolAsync_ShouldReturnPendingAppeals_WhenExist()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var appeals = new List<ForumAppeal>
        {
            new ForumAppeal { Id = 1, SchoolId = 1, Status = null }
        };
        mockModerationRepo.Setup(x => x.GetPendingAppealsBySchoolAsync(1)).ReturnsAsync(appeals);

        var result = await service.GetPendingAppealsBySchoolAsync(1);

        Assert.Single(result);
        Assert.Null(result[0].Status);
    }

    [Fact]
    public async Task CreateAppealAsync_ShouldCreateAppeal_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var appeal = new ForumAppeal { UserId = Guid.NewGuid(), SchoolId = 1, Reason = "Appeal" };
        mockModerationRepo.Setup(x => x.CreateAppealAsync(It.IsAny<ForumAppeal>())).ReturnsAsync(appeal);

        var result = await service.CreateAppealAsync(appeal);

        Assert.NotNull(result);
        Assert.Equal("Appeal", result.Reason);
    }

    [Fact]
    public async Task ApproveAppealAsync_ShouldApproveAppeal_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.ApproveAppealAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.ApproveAppealAsync(1, Guid.NewGuid());

        Assert.True(result);
    }

    [Fact]
    public async Task RejectAppealAsync_ShouldRejectAppeal_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.RejectAppealAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.RejectAppealAsync(1, Guid.NewGuid());

        Assert.True(result);
    }

    [Fact]
    public async Task ApproveReportAsync_ShouldApproveReport_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.ApproveViolationReportAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.ApproveReportAsync(1, Guid.NewGuid());

        Assert.True(result);
    }

    [Fact]
    public async Task RejectReportAsync_ShouldRejectReport_WhenValid()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        mockModerationRepo.Setup(x => x.RejectViolationReportAsync(1, It.IsAny<Guid>())).ReturnsAsync(true);

        var result = await service.RejectReportAsync(1, Guid.NewGuid());

        Assert.True(result);
    }

    [Fact]
    public async Task GetTotalViolationScoreByUserAsync_ShouldReturnScore_WhenUserExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var userId = Guid.NewGuid();
        mockModerationRepo.Setup(x => x.GetTotalViolationScoreByUserAsync(userId, 1)).ReturnsAsync(75);

        var result = await service.GetTotalViolationScoreByUserAsync(userId, 1);

        Assert.Equal(75, result);
    }

    [Fact]
    public async Task GetReportByIdAsync_ShouldReturnReport_WhenReportExists()
    {
        var mockModerationRepo = new Mock<IForumModerationRepository>();
        var service = new ForumModerationService(mockModerationRepo.Object);

        var report = new ViolationRecord { Id = 1, SourceType = "report" };
        mockModerationRepo.Setup(x => x.GetReportByIdAsync(1)).ReturnsAsync(report);

        var result = await service.GetReportByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("report", result.SourceType);
    }
}