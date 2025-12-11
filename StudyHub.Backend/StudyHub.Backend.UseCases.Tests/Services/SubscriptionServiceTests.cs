using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using Xunit;

namespace StudyHub.Backend.UseCases.Tests.Services
{
    public class SubscriptionServiceTests
    {
        private readonly Mock<ISubscriptionRepository> _mockRepo;
        private readonly SubscriptionService _service;

        public SubscriptionServiceTests()
        {
            _mockRepo = new Mock<ISubscriptionRepository>();
            _service = new SubscriptionService(_mockRepo.Object);
        }

        #region CreateSubscription Tests

        [Fact]
        public void CreateSubscription_ShouldCallRepositoryAndReturnCreatedSubscription()
        {
            // Arrange
            var newSubscription = new Subscription
            {
                AppUserId = Guid.NewGuid(),
                PackageName = "Premium",
                Price = 99.99m,
                StartAt = DateTime.UtcNow,
                EndAt = DateTime.UtcNow.AddMonths(1),
                IsActive = true
            };
            var createdSubscription = new Subscription
            {
                Id = 100,
                AppUserId = newSubscription.AppUserId,
                PackageName = "Premium",
                Price = 99.99m,
                StartAt = newSubscription.StartAt,
                EndAt = newSubscription.EndAt,
                IsActive = true
            };
            _mockRepo.Setup(r => r.Create(newSubscription)).Returns(createdSubscription);

            // Act
            var result = _service.CreateSubscription(newSubscription);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(100, result.Id);
            Assert.Equal(newSubscription.AppUserId, result.AppUserId);
            Assert.Equal("Premium", result.PackageName);
            _mockRepo.Verify(r => r.Create(newSubscription), Times.Once);
        }

        [Fact]
        public void CreateSubscription_WithDifferentPackages_ShouldCreateEach()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var subscription1 = new Subscription { AppUserId = userId, PackageName = "Basic", Price = 9.99m, StartAt = DateTime.UtcNow, EndAt = DateTime.UtcNow.AddMonths(1) };
            var subscription2 = new Subscription { AppUserId = userId, PackageName = "Premium", Price = 99.99m, StartAt = DateTime.UtcNow, EndAt = DateTime.UtcNow.AddMonths(1) };
            var created1 = new Subscription { Id = 1, AppUserId = userId, PackageName = "Basic", Price = 9.99m };
            var created2 = new Subscription { Id = 2, AppUserId = userId, PackageName = "Premium", Price = 99.99m };
            _mockRepo.Setup(r => r.Create(subscription1)).Returns(created1);
            _mockRepo.Setup(r => r.Create(subscription2)).Returns(created2);

            // Act
            var result1 = _service.CreateSubscription(subscription1);
            var result2 = _service.CreateSubscription(subscription2);

            // Assert
            Assert.NotNull(result1);
            Assert.NotNull(result2);
            Assert.Equal("Basic", result1.PackageName);
            Assert.Equal("Premium", result2.PackageName);
            _mockRepo.Verify(r => r.Create(It.IsAny<Subscription>()), Times.Exactly(2));
        }

        [Fact]
        public void CreateSubscription_WithMultipleUsers_ShouldCreateForEachUser()
        {
            // Arrange
            var user1 = Guid.NewGuid();
            var user2 = Guid.NewGuid();
            var subscription1 = new Subscription { AppUserId = user1, PackageName = "Premium", Price = 99.99m };
            var subscription2 = new Subscription { AppUserId = user2, PackageName = "Premium", Price = 99.99m };
            var created1 = new Subscription { Id = 1, AppUserId = user1, PackageName = "Premium", Price = 99.99m };
            var created2 = new Subscription { Id = 2, AppUserId = user2, PackageName = "Premium", Price = 99.99m };
            _mockRepo.Setup(r => r.Create(subscription1)).Returns(created1);
            _mockRepo.Setup(r => r.Create(subscription2)).Returns(created2);

            // Act
            var result1 = _service.CreateSubscription(subscription1);
            var result2 = _service.CreateSubscription(subscription2);

            // Assert
            Assert.NotEqual(result1.AppUserId, result2.AppUserId);
            Assert.NotEqual(result1.Id, result2.Id);
        }

        [Fact]
        public void CreateSubscription_WithPrice_ShouldStoreCorrectPrice()
        {
            // Arrange
            var subscription = new Subscription
            {
                AppUserId = Guid.NewGuid(),
                PackageName = "Enterprise",
                Price = 199.99m,
                StartAt = DateTime.UtcNow,
                EndAt = DateTime.UtcNow.AddYears(1)
            };
            var created = new Subscription
            {
                Id = 1,
                AppUserId = subscription.AppUserId,
                PackageName = "Enterprise",
                Price = 199.99m,
                StartAt = subscription.StartAt,
                EndAt = subscription.EndAt
            };
            _mockRepo.Setup(r => r.Create(subscription)).Returns(created);

            // Act
            var result = _service.CreateSubscription(subscription);

            // Assert
            Assert.Equal(199.99m, result.Price);
        }

        #endregion

        #region GetActiveSubscription Tests

        [Fact]
        public void GetActiveSubscription_WhenActiveSubscriptionExists_ShouldReturnSubscription()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var activeSubscription = new Subscription
            {
                Id = 1,
                AppUserId = userId,
                PackageName = "Premium",
                Price = 99.99m,
                StartAt = DateTime.UtcNow.AddDays(-10),
                EndAt = DateTime.UtcNow.AddDays(20),
                IsActive = true
            };
            _mockRepo.Setup(r => r.GetActiveByUser(userId)).Returns(activeSubscription);

            // Act
            var result = _service.GetActiveSubscription(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.AppUserId);
            Assert.Equal(1, result.Id);
            Assert.True(result.IsActive);
            _mockRepo.Verify(r => r.GetActiveByUser(userId), Times.Once);
        }

        [Fact]
        public void GetActiveSubscription_WhenNoActiveSubscription_ShouldReturnNull()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mockRepo.Setup(r => r.GetActiveByUser(userId)).Returns((Subscription?)null);

            // Act
            var result = _service.GetActiveSubscription(userId);

            // Assert
            Assert.Null(result);
            _mockRepo.Verify(r => r.GetActiveByUser(userId), Times.Once);
        }

        [Fact]
        public void GetActiveSubscription_WithDifferentUsers_ShouldReturnCorrectSubscription()
        {
            // Arrange
            var user1 = Guid.NewGuid();
            var user2 = Guid.NewGuid();
            var subscription1 = new Subscription { Id = 1, AppUserId = user1, PackageName = "Basic", IsActive = true };
            var subscription2 = new Subscription { Id = 2, AppUserId = user2, PackageName = "Premium", IsActive = true };
            _mockRepo.Setup(r => r.GetActiveByUser(user1)).Returns(subscription1);
            _mockRepo.Setup(r => r.GetActiveByUser(user2)).Returns(subscription2);

            // Act
            var result1 = _service.GetActiveSubscription(user1);
            var result2 = _service.GetActiveSubscription(user2);

            // Assert
            Assert.NotNull(result1);
            Assert.NotNull(result2);
            Assert.Equal(user1, result1.AppUserId);
            Assert.Equal(user2, result2.AppUserId);
            Assert.Equal("Basic", result1.PackageName);
            Assert.Equal("Premium", result2.PackageName);
        }

        [Fact]
        public void GetActiveSubscription_ShouldReturnOnlyActiveSubscription()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var now = DateTime.UtcNow;
            var activeSubscription = new Subscription
            {
                Id = 1,
                AppUserId = userId,
                PackageName = "Premium",
                Price = 99.99m,
                StartAt = now.AddDays(-5),
                EndAt = now.AddDays(25),
                IsActive = true
            };
            _mockRepo.Setup(r => r.GetActiveByUser(userId)).Returns(activeSubscription);

            // Act
            var result = _service.GetActiveSubscription(userId);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.IsActive);
            Assert.True(result.StartAt <= now);
            Assert.True(result.EndAt >= now);
        }

        [Fact]
        public void GetActiveSubscription_WithExpiredSubscription_ShouldNotReturnExpired()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mockRepo.Setup(r => r.GetActiveByUser(userId)).Returns((Subscription?)null);

            // Act
            var result = _service.GetActiveSubscription(userId);

            // Assert
            Assert.Null(result);
        }

        #endregion
    }
}
