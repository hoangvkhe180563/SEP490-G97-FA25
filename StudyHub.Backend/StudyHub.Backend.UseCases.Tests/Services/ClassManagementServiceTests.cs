using Moq;
using Xunit;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.Linq;

namespace StudyHub.Backend.UseCases.Tests.Services;

public class ClassManagementServiceTests
{
    #region GetOverviewPrimitives Tests

    [Fact]
    public void GetOverviewPrimitives_ShouldReturnOverviewStats_WhenNoSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        mockRepo.Setup(x => x.GetTotalUsers()).Returns(100);
        mockRepo.Setup(x => x.GetTotalClasses()).Returns(20);
        mockRepo.Setup(x => x.GetTotalClassworkNotifications()).Returns(50);
        mockRepo.Setup(x => x.GetTotalAnnouncementNotifications()).Returns(30);

        // Act
        var result = service.GetOverviewPrimitives(null);

        // Assert
        Assert.Equal(100, result.TotalUsers);
        Assert.Equal(20, result.TotalClasses);
        Assert.Equal(50, result.TotalAssignments);
        Assert.Equal(30, result.TotalAnnouncements);
        mockRepo.Verify(x => x.GetTotalUsers(), Times.Once);
        mockRepo.Verify(x => x.GetTotalClasses(), Times.Once);
        mockRepo.Verify(x => x.GetTotalClassworkNotifications(), Times.Once);
        mockRepo.Verify(x => x.GetTotalAnnouncementNotifications(), Times.Once);
    }

    [Fact]
    public void GetOverviewPrimitives_ShouldReturnSchoolScopedStats_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var schoolId = 1;
        var userId = Guid.NewGuid();
        var classIds = new List<int> { 1, 2, 3 };

        mockRepo.Setup(x => x.GetUserCountBySchoolId(schoolId)).Returns(50);
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetClassCreatedByUserId(It.IsAny<int>())).Returns(userId);
        mockRepo.Setup(x => x.GetUserSchoolId(userId)).Returns(schoolId);
        mockRepo.Setup(x => x.GetClassworkCountForClass(It.IsAny<int>())).Returns(10);
        mockRepo.Setup(x => x.GetAnnouncementCountForClass(It.IsAny<int>())).Returns(5);

        // Act
        var result = service.GetOverviewPrimitives(schoolId);

        // Assert
        Assert.Equal(50, result.TotalUsers);
        Assert.Equal(3, result.TotalClasses);
        Assert.Equal(30, result.TotalAssignments);
        Assert.Equal(15, result.TotalAnnouncements);
        mockRepo.Verify(x => x.GetUserCountBySchoolId(schoolId), Times.Once);
    }

    #endregion

    #region GetClassesByGradePrimitives Tests

    [Fact]
    public void GetClassesByGradePrimitives_ShouldReturnClassCountByGrade_WhenNoSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var grades = new List<sbyte> { 10, 11, 12 };
        mockRepo.Setup(x => x.GetAllGrades()).Returns(grades);
        mockRepo.Setup(x => x.GetClassCountByGrade(10)).Returns(5);
        mockRepo.Setup(x => x.GetClassCountByGrade(11)).Returns(8);
        mockRepo.Setup(x => x.GetClassCountByGrade(12)).Returns(3);

        // Act
        var result = service.GetClassesByGradePrimitives(null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal(5, result.First(x => x.Grade == 10).Count);
        Assert.Equal(8, result.First(x => x.Grade == 11).Count);
        Assert.Equal(3, result.First(x => x.Grade == 12).Count);
        mockRepo.Verify(x => x.GetAllGrades(), Times.Once);
    }

    [Fact]
    public void GetClassesByGradePrimitives_ShouldReturnSchoolScopedGrades_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var schoolId = 1;
        var grades = new List<sbyte> { 10, 11 };

        // Use available repository methods: GetClassIdsByGrade + GetClassCreatedByUserId + GetUserSchoolId
        mockRepo.Setup(x => x.GetAllGrades()).Returns(grades);

        // Grade 10 has classes 1 and 2; only class 1 belongs to schoolId
        mockRepo.Setup(x => x.GetClassIdsByGrade(10)).Returns(new List<int> { 1, 2 });
        var userForClass1 = Guid.NewGuid();
        var userForClass2 = Guid.NewGuid();
        mockRepo.Setup(x => x.GetClassCreatedByUserId(1)).Returns(userForClass1);
        mockRepo.Setup(x => x.GetClassCreatedByUserId(2)).Returns(userForClass2);
        mockRepo.Setup(x => x.GetUserSchoolId(userForClass1)).Returns(schoolId);
        mockRepo.Setup(x => x.GetUserSchoolId(userForClass2)).Returns(999); // other school

        // Grade 11 has class 3 which belongs to the school
        mockRepo.Setup(x => x.GetClassIdsByGrade(11)).Returns(new List<int> { 3 });
        var userForClass3 = Guid.NewGuid();
        mockRepo.Setup(x => x.GetClassCreatedByUserId(3)).Returns(userForClass3);
        mockRepo.Setup(x => x.GetUserSchoolId(userForClass3)).Returns(schoolId);

        // Act
        var result = service.GetClassesByGradePrimitives(schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(1, result.First(x => x.Grade == 10).Count); // only class 1 counted
        Assert.Equal(1, result.First(x => x.Grade == 11).Count); // class 3 counted
    }

    #endregion

    #region GetStudentsPerClassPrimitives Tests

    [Fact]
    public void GetStudentsPerClassPrimitives_ShouldReturnStudentCounts_WhenNoLimitProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var classIds = new List<int> { 1, 2, 3 };
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetStudentsCountByClassId(1)).Returns(25);
        mockRepo.Setup(x => x.GetStudentsCountByClassId(2)).Returns(30);
        mockRepo.Setup(x => x.GetStudentsCountByClassId(3)).Returns(20);
        mockRepo.Setup(x => x.GetClassNameById(1)).Returns("Class A");
        mockRepo.Setup(x => x.GetClassNameById(2)).Returns("Class B");
        mockRepo.Setup(x => x.GetClassNameById(3)).Returns("Class C");

        // Act
        var result = service.GetStudentsPerClassPrimitives(null, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal(30, result[0].Students);
        Assert.Equal(25, result[1].Students);
        Assert.Equal(20, result[2].Students);
        mockRepo.Verify(x => x.GetAllClassIds(), Times.Once);
    }

    [Fact]
    public void GetStudentsPerClassPrimitives_ShouldReturnLimitedResults_WhenLimitProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var classIds = new List<int> { 1, 2, 3 };
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetStudentsCountByClassId(1)).Returns(25);
        mockRepo.Setup(x => x.GetStudentsCountByClassId(2)).Returns(30);
        mockRepo.Setup(x => x.GetStudentsCountByClassId(3)).Returns(20);
        mockRepo.Setup(x => x.GetClassNameById(1)).Returns("Class A");
        mockRepo.Setup(x => x.GetClassNameById(2)).Returns("Class B");
        mockRepo.Setup(x => x.GetClassNameById(3)).Returns("Class C");

        // Act
        var result = service.GetStudentsPerClassPrimitives(2, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(30, result[0].Students);
        Assert.Equal(25, result[1].Students);
        mockRepo.Verify(x => x.GetAllClassIds(), Times.Once);
    }

    [Fact]
    public void GetStudentsPerClassPrimitives_ShouldReturnSchoolScopedData_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var schoolId = 1;
        var userId = Guid.NewGuid();
        var classIds = new List<int> { 1, 2 };

        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetClassCreatedByUserId(It.IsAny<int>())).Returns(userId);
        mockRepo.Setup(x => x.GetUserSchoolId(userId)).Returns(schoolId);
        mockRepo.Setup(x => x.GetStudentsCountByClassId(It.IsAny<int>())).Returns(25);
        mockRepo.Setup(x => x.GetClassNameById(It.IsAny<int>())).Returns("Class");

        // Act
        var result = service.GetStudentsPerClassPrimitives(null, schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
    }

    #endregion

    #region GetRoleCountsPrimitives Tests

    [Fact]
    public void GetRoleCountsPrimitives_ShouldReturnRoleCounts_WhenNoSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var roleNames = new List<string> { "Student", "Teacher", "Admin" };
        mockRepo.Setup(x => x.GetAllRoleNames()).Returns(roleNames);
        mockRepo.Setup(x => x.GetRoleCountByName("Student")).Returns(80);
        mockRepo.Setup(x => x.GetRoleCountByName("Teacher")).Returns(15);
        mockRepo.Setup(x => x.GetRoleCountByName("Admin")).Returns(5);

        // Act
        var result = service.GetRoleCountsPrimitives(null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal(80, result.First(x => x.RoleName == "Student").Count);
        Assert.Equal(15, result.First(x => x.RoleName == "Teacher").Count);
        Assert.Equal(5, result.First(x => x.RoleName == "Admin").Count);
        mockRepo.Verify(x => x.GetAllRoleNames(), Times.Once);
    }

    [Fact]
    public void GetRoleCountsPrimitives_ShouldReturnSchoolScopedRoles_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var schoolId = 1;
        var roleNames = new List<string> { "Student", "Teacher" };

        mockRepo.Setup(x => x.GetAllRoleNames()).Returns(roleNames);
        mockRepo.Setup(x => x.GetRoleCountByNameAndSchool("Student", schoolId)).Returns(50);
        mockRepo.Setup(x => x.GetRoleCountByNameAndSchool("Teacher", schoolId)).Returns(10);

        // Act
        var result = service.GetRoleCountsPrimitives(schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(50, result.First(x => x.RoleName == "Student").Count);
        Assert.Equal(10, result.First(x => x.RoleName == "Teacher").Count);
    }

    #endregion

    #region GetGenderRatioPrimitives Tests

    [Fact]
    public void GetGenderRatioPrimitives_ShouldReturnGenderCounts_WhenNoSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        mockRepo.Setup(x => x.GetGenderCount(true)).Returns(60);
        mockRepo.Setup(x => x.GetGenderCount(false)).Returns(40);

        // Act
        var result = service.GetGenderRatioPrimitives(null);

        // Assert
        Assert.Equal(60, result.Male);
        Assert.Equal(40, result.Female);
        mockRepo.Verify(x => x.GetGenderCount(true), Times.Once);
        mockRepo.Verify(x => x.GetGenderCount(false), Times.Once);
    }

    [Fact]
    public void GetGenderRatioPrimitives_ShouldReturnSchoolGenderCounts_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var schoolId = 1;
        mockRepo.Setup(x => x.GetGenderCountBySchool(true, schoolId)).Returns(30);
        mockRepo.Setup(x => x.GetGenderCountBySchool(false, schoolId)).Returns(20);

        // Act
        var result = service.GetGenderRatioPrimitives(schoolId);

        // Assert
        Assert.Equal(30, result.Male);
        Assert.Equal(20, result.Female);
        mockRepo.Verify(x => x.GetGenderCountBySchool(true, schoolId), Times.Once);
        mockRepo.Verify(x => x.GetGenderCountBySchool(false, schoolId), Times.Once);
    }

    #endregion

    #region GetTopActiveClassesPrimitives Tests

    [Fact]
    public void GetTopActiveClassesPrimitives_ShouldReturnTopClasses_OrderedByActivityScore()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var classIds = new List<int> { 1, 2, 3 };
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetNotificationsCountByClassId(1)).Returns(10);
        mockRepo.Setup(x => x.GetSubmissionsCountByClassId(1)).Returns(20);
        mockRepo.Setup(x => x.GetCommentsCountByClassId(1)).Returns(5);
        mockRepo.Setup(x => x.GetClassNameById(1)).Returns("Class A");

        mockRepo.Setup(x => x.GetNotificationsCountByClassId(2)).Returns(15);
        mockRepo.Setup(x => x.GetSubmissionsCountByClassId(2)).Returns(25);
        mockRepo.Setup(x => x.GetCommentsCountByClassId(2)).Returns(10);
        mockRepo.Setup(x => x.GetClassNameById(2)).Returns("Class B");

        mockRepo.Setup(x => x.GetNotificationsCountByClassId(3)).Returns(5);
        mockRepo.Setup(x => x.GetSubmissionsCountByClassId(3)).Returns(10);
        mockRepo.Setup(x => x.GetCommentsCountByClassId(3)).Returns(2);
        mockRepo.Setup(x => x.GetClassNameById(3)).Returns("Class C");

        // Act
        var result = service.GetTopActiveClassesPrimitives(10, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal("Class B", result[0].ClassName);
        Assert.Equal("Class A", result[1].ClassName);
        Assert.Equal("Class C", result[2].ClassName);
        mockRepo.Verify(x => x.GetAllClassIds(), Times.Once);
    }

    [Fact]
    public void GetTopActiveClassesPrimitives_ShouldReturnLimitedClasses_WhenLimitProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var classIds = new List<int> { 1, 2, 3 };
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetNotificationsCountByClassId(It.IsAny<int>())).Returns(10);
        mockRepo.Setup(x => x.GetSubmissionsCountByClassId(It.IsAny<int>())).Returns(20);
        mockRepo.Setup(x => x.GetCommentsCountByClassId(It.IsAny<int>())).Returns(5);
        mockRepo.Setup(x => x.GetClassNameById(It.IsAny<int>())).Returns("Class");

        // Act
        var result = service.GetTopActiveClassesPrimitives(2, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
    }

    #endregion

    #region GetSubmissionRatePrimitives Tests

    [Fact]
    public void GetSubmissionRatePrimitives_ShouldReturnZero_WhenNoNotifications()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        mockRepo.Setup(x => x.GetNotificationIdsForClasswork()).Returns(new List<int>());

        // Act
        var result = service.GetSubmissionRatePrimitives(null);

        // Assert
        Assert.Equal(0.0, result);
        mockRepo.Verify(x => x.GetNotificationIdsForClasswork(), Times.Once);
    }

    [Fact]
    public void GetSubmissionRatePrimitives_ShouldCalculateRate_WhenNotificationsExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var notifIds = new List<int> { 1, 2 };
        var classIds = new List<int> { 1, 2 };

        mockRepo.Setup(x => x.GetNotificationIdsForClasswork()).Returns(notifIds);
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetJoinedCountByClassId(1)).Returns(30);
        mockRepo.Setup(x => x.GetJoinedCountByClassId(2)).Returns(25);
        mockRepo.Setup(x => x.GetClassIdForNotification(1)).Returns(1);
        mockRepo.Setup(x => x.GetClassIdForNotification(2)).Returns(2);
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(1)).Returns(25);
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(2)).Returns(20);

        // Act
        var result = service.GetSubmissionRatePrimitives(null);

        // Assert
        Assert.True(result > 0.81 && result < 0.82);
        mockRepo.Verify(x => x.GetNotificationIdsForClasswork(), Times.Once);
    }

    [Fact]
    public void GetSubmissionRatePrimitives_ShouldReturnSchoolScopedRate_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var schoolId = 1;
        var userId = Guid.NewGuid();
        var notifIds = new List<int> { 1 };
        var classIds = new List<int> { 1 };

        mockRepo.Setup(x => x.GetNotificationIdsForClasswork()).Returns(notifIds);
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetClassCreatedByUserId(1)).Returns(userId);
        mockRepo.Setup(x => x.GetUserSchoolId(userId)).Returns(schoolId);
        mockRepo.Setup(x => x.GetJoinedCountByClassId(1)).Returns(20);
        mockRepo.Setup(x => x.GetClassIdForNotification(1)).Returns(1);
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(1)).Returns(15);

        // Act
        var result = service.GetSubmissionRatePrimitives(schoolId);

        // Assert
        Assert.True(result > 0.74 && result < 0.76);
    }

    #endregion

    #region GetScoreDistributionPrimitives Tests

    [Fact]
    public void GetScoreDistributionPrimitives_ShouldReturnDistribution_WhenScoresExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var scores = new List<double> { 95, 92, 85, 82, 75, 72, 65, 55 };
        mockRepo.Setup(x => x.GetAllGradedScores()).Returns(scores);

        // Act
        var result = service.GetScoreDistributionPrimitives(null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4, result.Count);
        Assert.Equal(2, result.First(x => x.Range == "90-100").Count);
        Assert.Equal(2, result.First(x => x.Range == "80-89").Count);
        Assert.Equal(2, result.First(x => x.Range == "70-79").Count);
        Assert.Equal(2, result.First(x => x.Range == "0-69").Count);
        mockRepo.Verify(x => x.GetAllGradedScores(), Times.Once);
    }

    [Fact]
    public void GetScoreDistributionPrimitives_ShouldReturnZeroPercent_WhenNoScores()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        mockRepo.Setup(x => x.GetAllGradedScores()).Returns(new List<double>());

        // Act
        var result = service.GetScoreDistributionPrimitives(null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4, result.Count);
        Assert.All(result, r => Assert.Equal(0.0, r.Pct));
        mockRepo.Verify(x => x.GetAllGradedScores(), Times.Once);
    }

    [Fact]
    public void GetScoreDistributionPrimitives_ShouldReturnSchoolScopedDistribution_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var schoolId = 1;

        // Simulate filtering of notifications by school + fetching scores by notification ids
        var notifIds = new List<int> { 1, 2 };
        mockRepo.Setup(x => x.GetNotificationIdsForClasswork()).Returns(notifIds);

        // Map notifications to class ids
        mockRepo.Setup(x => x.GetClassIdForNotification(1)).Returns(1);
        mockRepo.Setup(x => x.GetClassIdForNotification(2)).Returns(2);

        // Both classes created by users of the target school
        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();
        mockRepo.Setup(x => x.GetClassCreatedByUserId(1)).Returns(user1);
        mockRepo.Setup(x => x.GetClassCreatedByUserId(2)).Returns(user2);
        mockRepo.Setup(x => x.GetUserSchoolId(user1)).Returns(schoolId);
        mockRepo.Setup(x => x.GetUserSchoolId(user2)).Returns(schoolId);

        // Return scores for any notification ids requested (match null or specific)
        var scores = new List<double> { 95, 85, 75, 65 };
        mockRepo.Setup(x => x.GetAllGradedScoresByNotificationIds(It.IsAny<IEnumerable<int>>())).Returns(scores);
        // Also guard the non-notification path (in case implementation falls back)
        mockRepo.Setup(x => x.GetAllGradedScores()).Returns(new List<double>());

        // Act
        var result = service.GetScoreDistributionPrimitives(schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4, result.Count);
        Assert.Equal(1, result.First(x => x.Range == "90-100").Count);
        Assert.Equal(1, result.First(x => x.Range == "80-89").Count);
        Assert.Equal(1, result.First(x => x.Range == "70-79").Count);
        Assert.Equal(1, result.First(x => x.Range == "0-69").Count);
    }

    #endregion

    #region GetMostInteractiveAssignmentsPrimitives Tests

    [Fact]
    public void GetMostInteractiveAssignmentsPrimitives_ShouldReturnTopAssignments_OrderedBySubmissions()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var notifIds = new List<int> { 1, 2, 3 };
        mockRepo.Setup(x => x.GetNotificationIdsForClasswork()).Returns(notifIds);
        // ensure class mapping is explicit so the service doesn't filter or reorder unexpectedly
        mockRepo.Setup(x => x.GetClassIdForNotification(1)).Returns(1);
        mockRepo.Setup(x => x.GetClassIdForNotification(2)).Returns(2);
        mockRepo.Setup(x => x.GetClassIdForNotification(3)).Returns(3);

        mockRepo.Setup(x => x.GetNotificationCreatedByName(1)).Returns("Teacher A");
        mockRepo.Setup(x => x.GetNotificationCreatedByName(2)).Returns("Teacher B");
        mockRepo.Setup(x => x.GetNotificationCreatedByName(3)).Returns("Teacher C");
        mockRepo.Setup(x => x.GetNotificationTitle(1)).Returns("Assignment 1");
        mockRepo.Setup(x => x.GetNotificationTitle(2)).Returns("Assignment 2");
        mockRepo.Setup(x => x.GetNotificationTitle(3)).Returns("Assignment 3");
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(1)).Returns(50);
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(2)).Returns(75);
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(3)).Returns(30);

        // Act
        var result = service.GetMostInteractiveAssignmentsPrimitives(10, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal("Assignment 2", result[0].Title);
        Assert.Equal(75, result[0].SubmissionsCount);
        Assert.Equal("Assignment 1", result[1].Title);
        Assert.Equal(50, result[1].SubmissionsCount);
        mockRepo.Verify(x => x.GetNotificationIdsForClasswork(), Times.Once);
    }

    [Fact]
    public void GetMostInteractiveAssignmentsPrimitives_ShouldReturnLimitedAssignments_WhenLimitProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var notifIds = new List<int> { 1, 2, 3 };
        mockRepo.Setup(x => x.GetNotificationIdsForClasswork()).Returns(notifIds);
        mockRepo.Setup(x => x.GetClassIdForNotification(It.IsAny<int>())).Returns(1);
        mockRepo.Setup(x => x.GetNotificationCreatedByName(It.IsAny<int>())).Returns("Teacher");
        mockRepo.Setup(x => x.GetNotificationTitle(It.IsAny<int>())).Returns("Assignment");
        // Provide submissions counts such that ordering by submissions descending is clear
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(1)).Returns(75);
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(2)).Returns(50);
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(3)).Returns(30);

        // Act
        var result = service.GetMostInteractiveAssignmentsPrimitives(2, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(75, result[0].SubmissionsCount);
        Assert.Equal(50, result[1].SubmissionsCount);
    }

    #endregion

   

    #region GetClassworksByMonthPrimitives Tests

    [Fact]
    public void GetClassworksByMonthPrimitives_ShouldReturnMonthlyData_WhenNoSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        mockRepo.Setup(x => x.GetClassworkCountForYearMonth(It.IsAny<int>(), It.IsAny<int>())).Returns(10);

        // Act
        var result = service.GetClassworksByMonthPrimitives(3, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.All(result, r => Assert.Equal(10, r.Count));
    }

    [Fact]
    public void GetClassworksByMonthPrimitives_ShouldReturnSchoolScopedData_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var schoolId = 1;
        var classIds = new List<int> { 1, 2 };

        // Service is expected to filter classes by school and then sum per-class counts using GetClassworkCountForYearMonthByClass
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);

        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();
        mockRepo.Setup(x => x.GetClassCreatedByUserId(1)).Returns(user1);
        mockRepo.Setup(x => x.GetClassCreatedByUserId(2)).Returns(user2);
        mockRepo.Setup(x => x.GetUserSchoolId(user1)).Returns(schoolId);
        mockRepo.Setup(x => x.GetUserSchoolId(user2)).Returns(schoolId);

        // Each class contributes 5 per month
        mockRepo.Setup(x => x.GetClassworkCountForYearMonthByClass(It.IsAny<int>(), It.IsAny<int>(), 1)).Returns(5);
        mockRepo.Setup(x => x.GetClassworkCountForYearMonthByClass(It.IsAny<int>(), It.IsAny<int>(), 2)).Returns(5);

        // Act
        var result = service.GetClassworksByMonthPrimitives(3, schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        // since two classes each contribute 5, total per month should be 10
        Assert.All(result, r => Assert.Equal(10, r.Count));
    }

    #endregion

    #region GetNotificationsByMonthPrimitives Tests

    [Fact]
    public void GetNotificationsByMonthPrimitives_ShouldReturnMonthlyData_WhenNoSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        mockRepo.Setup(x => x.GetNotificationCountForYearMonth(It.IsAny<int>(), It.IsAny<int>())).Returns(15);

        // Act
        var result = service.GetNotificationsByMonthPrimitives(3, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.All(result, r => Assert.Equal(15, r.Count));
    }

    #endregion

    #region GetSubmissionsByMonthPrimitives Tests

    [Fact]
    public void GetSubmissionsByMonthPrimitives_ShouldReturnMonthlyData_WhenNoSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        mockRepo.Setup(x => x.GetSubmissionCountForYearMonth(It.IsAny<int>(), It.IsAny<int>())).Returns(20);

        // Act
        var result = service.GetSubmissionsByMonthPrimitives(3, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.All(result, r => Assert.Equal(20, r.Count));
    }

    #endregion

    #region GetNewClassesByMonthPrimitives Tests

    [Fact]
    public void GetNewClassesByMonthPrimitives_ShouldReturnMonthlyData_WhenNoSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        mockRepo.Setup(x => x.GetClassCreatedCountForYearMonth(It.IsAny<int>(), It.IsAny<int>())).Returns(5);

        // Act
        var result = service.GetNewClassesByMonthPrimitives(3, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.All(result, r => Assert.Equal(5, r.Count));
    }

    #endregion

    #region GetClassStatsPrimitives Tests

    [Fact]
    public void GetClassStatsPrimitives_ShouldReturnClassStats_WhenNoSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var classIds = new List<int> { 1, 2 };
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetClassNameById(1)).Returns("Class A");
        mockRepo.Setup(x => x.GetClassNameById(2)).Returns("Class B");
        mockRepo.Setup(x => x.GetJoinedCountByClassId(It.IsAny<int>())).Returns(30);
        mockRepo.Setup(x => x.GetClassworksCountByClassId(It.IsAny<int>())).Returns(10);
        mockRepo.Setup(x => x.GetTotalSubmissionsForClassId(It.IsAny<int>())).Returns(250);
        mockRepo.Setup(x => x.GetTotalNotificationReadEntriesForClassId(It.IsAny<int>())).Returns(100);
        mockRepo.Setup(x => x.GetReadCountForClassId(It.IsAny<int>())).Returns(80);
        mockRepo.Setup(x => x.GetNotificationsCountByClassId(It.IsAny<int>())).Returns(15);

        // Act
        var result = service.GetClassStatsPrimitives(null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, r =>
        {
            Assert.Equal(30, r.StudentsCount);
            Assert.Equal(0.8333, Math.Round(r.SubmissionRate, 4));
            Assert.Equal(0.8, r.ReadRate);
        });
    }

    [Fact]
    public void GetClassStatsPrimitives_ShouldReturnSchoolScopedStats_WhenSchoolIdProvided()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var schoolId = 1;
        var userId = Guid.NewGuid();
        var classIds = new List<int> { 1 };

        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetClassCreatedByUserId(1)).Returns(userId);
        mockRepo.Setup(x => x.GetUserSchoolId(userId)).Returns(schoolId);
        mockRepo.Setup(x => x.GetClassNameById(1)).Returns("Class A");
        mockRepo.Setup(x => x.GetJoinedCountByClassId(1)).Returns(25);
        mockRepo.Setup(x => x.GetClassworksCountByClassId(1)).Returns(8);
        mockRepo.Setup(x => x.GetTotalSubmissionsForClassId(1)).Returns(180);
        mockRepo.Setup(x => x.GetTotalNotificationReadEntriesForClassId(1)).Returns(50);
        mockRepo.Setup(x => x.GetReadCountForClassId(1)).Returns(40);
        mockRepo.Setup(x => x.GetNotificationsCountByClassId(1)).Returns(10);

        // Act
        var result = service.GetClassStatsPrimitives(schoolId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal(25, result[0].StudentsCount);
    }

    #endregion

    #region GetTopReadNotificationsPrimitives Tests

    [Fact]
    public void GetTopReadNotificationsPrimitives_ShouldReturnTopNotifications_OrderedByReads()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var notifIds = new List<int> { 1, 2, 3 };
        mockRepo.Setup(x => x.GetAllNotificationIds()).Returns(notifIds);
        mockRepo.Setup(x => x.GetClassIdForNotification(It.IsAny<int>())).Returns(1);
        mockRepo.Setup(x => x.GetReadCountForNotification(1)).Returns(50);
        mockRepo.Setup(x => x.GetReadCountForNotification(2)).Returns(75);
        mockRepo.Setup(x => x.GetReadCountForNotification(3)).Returns(30);
        mockRepo.Setup(x => x.GetTotalRecipientsForNotification(It.IsAny<int>())).Returns(100);
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(It.IsAny<int>())).Returns(40);
        mockRepo.Setup(x => x.GetNotificationTitle(1)).Returns("Notification 1");
        mockRepo.Setup(x => x.GetNotificationTitle(2)).Returns("Notification 2");
        mockRepo.Setup(x => x.GetNotificationTitle(3)).Returns("Notification 3");
        mockRepo.Setup(x => x.GetNotificationCreatedByName(It.IsAny<int>())).Returns("Teacher");

        // Act
        var result = service.GetTopReadNotificationsPrimitives(10, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal("Notification 2", result[0].Title);
        Assert.Equal(75, result[0].ReadsCount);
        Assert.Equal("Notification 1", result[1].Title);
        Assert.Equal(50, result[1].ReadsCount);
    }

    #endregion

    #region GetMostIgnoredNotificationsPrimitives Tests

    [Fact]
    public void GetMostIgnoredNotificationsPrimitives_ShouldReturnTopNotifications_OrderedByIgnored()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var notifIds = new List<int> { 1, 2, 3 };
        mockRepo.Setup(x => x.GetAllNotificationIds()).Returns(notifIds);
        mockRepo.Setup(x => x.GetClassIdForNotification(It.IsAny<int>())).Returns(1);
        mockRepo.Setup(x => x.GetReadCountForNotification(1)).Returns(50);
        mockRepo.Setup(x => x.GetReadCountForNotification(2)).Returns(25);
        mockRepo.Setup(x => x.GetReadCountForNotification(3)).Returns(70);
        mockRepo.Setup(x => x.GetTotalRecipientsForNotification(It.IsAny<int>())).Returns(100);
        mockRepo.Setup(x => x.GetSubmissionsCountByNotificationId(It.IsAny<int>())).Returns(40);
        mockRepo.Setup(x => x.GetNotificationTitle(1)).Returns("Notification 1");
        mockRepo.Setup(x => x.GetNotificationTitle(2)).Returns("Notification 2");
        mockRepo.Setup(x => x.GetNotificationTitle(3)).Returns("Notification 3");
        mockRepo.Setup(x => x.GetNotificationCreatedByName(It.IsAny<int>())).Returns("Teacher");

        // Act
        var result = service.GetMostIgnoredNotificationsPrimitives(10, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal("Notification 2", result[0].Title);
        Assert.Equal(75, result[0].IgnoredCount);
        Assert.Equal("Notification 1", result[1].Title);
        Assert.Equal(50, result[1].IgnoredCount);
    }

    #endregion

    #region GetClassWithMostNotificationsPrimitives Tests

    [Fact]
    public void GetClassWithMostNotificationsPrimitives_ShouldReturnClass_WhenClassesExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var classIds = new List<int> { 1, 2, 3 };
        mockRepo.Setup(x => x.GetAllClassIds()).Returns(classIds);
        mockRepo.Setup(x => x.GetNotificationsCountByClassId(1)).Returns(20);
        mockRepo.Setup(x => x.GetNotificationsCountByClassId(2)).Returns(35);
        mockRepo.Setup(x => x.GetNotificationsCountByClassId(3)).Returns(15);
        mockRepo.Setup(x => x.GetClassNameById(2)).Returns("Class B");
        mockRepo.Setup(x => x.GetSubmissionsCountByClassId(2)).Returns(100);
        mockRepo.Setup(x => x.GetCommentsCountByClassId(2)).Returns(50);

        // Act
        var result = service.GetClassWithMostNotificationsPrimitives(null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Value.ClassId);
        Assert.Equal("Class B", result.Value.ClassName);
        Assert.Equal(35, result.Value.NotificationsCount);
        Assert.Equal(100, result.Value.SubmissionsCount);
        Assert.Equal(50, result.Value.CommentsCount);
    }

    [Fact]
    public void GetClassWithMostNotificationsPrimitives_ShouldReturnNull_WhenNoClassesExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        mockRepo.Setup(x => x.GetAllClassIds()).Returns(new List<int>());

        // Act
        var result = service.GetClassWithMostNotificationsPrimitives(null);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetSchool Tests

    [Fact]
    public void GetSchool_ShouldReturnSchool_WhenUserHasSchool()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var userId = Guid.NewGuid();
        var schoolId = 1;
        var user = new AppUser { Id = userId, SchoolId = schoolId };
        var school = new School { Id = schoolId, Name = "Test School" };

        mockUserRepo.Setup(x => x.GetById(userId)).Returns(user);
        mockRepo.Setup(x => x.GetSchoolByID(schoolId)).Returns(school);

        // Act
        var result = service.GetSchool(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(schoolId, result.Id);
        Assert.Equal("Test School", result.Name);
    }

    [Fact]
    public void GetSchool_ShouldReturnNull_WhenUserDoesNotExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var userId = Guid.NewGuid();
        mockUserRepo.Setup(x => x.GetById(userId)).Returns((AppUser?)null);

        // Act
        var result = service.GetSchool(userId);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetClassesPaged Tests

    [Fact]
    public void GetClassesPaged_ShouldReturnPagedClasses_WhenClassesExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var userId = Guid.NewGuid();
        var schoolId = 1;
        var user = new AppUser { Id = userId, SchoolId = schoolId };
        var classes = new List<Class>
        {
            new Class { Id = 1, Name = "Math", CreatedBy = userId, DeletedAt = null },
            new Class { Id = 2, Name = "Science", CreatedBy = userId, DeletedAt = null }
        };

        mockUserRepo.Setup(x => x.GetById(userId)).Returns(user);
        mockRepo.Setup(x => x.GetAllClasses()).Returns(classes);

        // Act
        var result = service.GetClassesPaged(null, null, userId, 1, 10);

        // Assert
        Assert.Equal(2, result.TotalItems);
        Assert.Equal(2, result.Classes.Count);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.Limit);
    }

    [Fact]
    public void GetClassesPaged_ShouldReturnEmptyList_WhenNoClassesExist()
    {
        // Arrange
        var mockRepo = new Mock<IClassManagementRepository>();
        var mockUserRepo = new Mock<IAppUserRepository>();

        var service = new ClassManagementService(mockRepo.Object, mockUserRepo.Object);

        var userId = Guid.NewGuid();
        var user = new AppUser { Id = userId, SchoolId = null };

        mockUserRepo.Setup(x => x.GetById(userId)).Returns(user);
        mockRepo.Setup(x => x.GetAllClasses()).Returns(new List<Class>());

        // Act
        var result = service.GetClassesPaged(null, null, userId, 1, 10);

        // Assert
        Assert.Equal(0, result.TotalItems);
        Assert.Empty(result.Classes);
    }

    #endregion
}