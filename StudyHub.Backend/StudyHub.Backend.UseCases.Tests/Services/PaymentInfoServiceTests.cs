using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using Xunit;

namespace StudyHub.Backend.UseCases.Tests.Services
{
    public class PaymentInfoServiceTests
    {
        private readonly Mock<IPaymentInfoRepository> _mockRepo;
        private readonly PaymentInfoService _service;

        public PaymentInfoServiceTests()
        {
            _mockRepo = new Mock<IPaymentInfoRepository>();
            _service = new PaymentInfoService(_mockRepo.Object);
        }

        #region GetPaymentInfo Tests

        [Fact]
        public void GetPaymentInfo_WhenPaymentInfoExists_ShouldReturnPaymentInfo()
        {
            // Arrange
            var schoolId = 1;
            var paymentInfo = new PaymentInfo
            {
                SchoolId = schoolId,
                AccountNumber = "1234567890",
                AccountBank = "Test Bank",
                AccountName = "Test School",
                ExchangeRate = 1000,
                QrcodeUrl = "https://example.com/qr.png"
            };
            _mockRepo.Setup(r => r.GetBySchoolId(schoolId)).Returns(paymentInfo);

            // Act
            var result = _service.GetPaymentInfo(schoolId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(schoolId, result.SchoolId);
            Assert.Equal("1234567890", result.AccountNumber);
            Assert.Equal("Test Bank", result.AccountBank);
            _mockRepo.Verify(r => r.GetBySchoolId(schoolId), Times.Once);
        }

        [Fact]
        public void GetPaymentInfo_WhenPaymentInfoDoesNotExist_ShouldReturnNull()
        {
            // Arrange
            var schoolId = 999;
            _mockRepo.Setup(r => r.GetBySchoolId(schoolId)).Returns((PaymentInfo?)null);

            // Act
            var result = _service.GetPaymentInfo(schoolId);

            // Assert
            Assert.Null(result);
            _mockRepo.Verify(r => r.GetBySchoolId(schoolId), Times.Once);
        }

        [Fact]
        public void GetPaymentInfo_WithDifferentSchools_ShouldReturnCorrectPaymentInfo()
        {
            // Arrange
            var schoolId1 = 1;
            var schoolId2 = 2;
            var paymentInfo1 = new PaymentInfo
            {
                SchoolId = schoolId1,
                AccountNumber = "1111111111",
                AccountBank = "Bank A",
                AccountName = "School A",
                ExchangeRate = 1000,
                QrcodeUrl = "https://example.com/qr1.png"
            };
            var paymentInfo2 = new PaymentInfo
            {
                SchoolId = schoolId2,
                AccountNumber = "2222222222",
                AccountBank = "Bank B",
                AccountName = "School B",
                ExchangeRate = 1000,
                QrcodeUrl = "https://example.com/qr2.png"
            };
            _mockRepo.Setup(r => r.GetBySchoolId(schoolId1)).Returns(paymentInfo1);
            _mockRepo.Setup(r => r.GetBySchoolId(schoolId2)).Returns(paymentInfo2);

            // Act
            var result1 = _service.GetPaymentInfo(schoolId1);
            var result2 = _service.GetPaymentInfo(schoolId2);

            // Assert
            Assert.NotNull(result1);
            Assert.NotNull(result2);
            Assert.Equal("1111111111", result1.AccountNumber);
            Assert.Equal("2222222222", result2.AccountNumber);
            Assert.NotEqual(result1.SchoolId, result2.SchoolId);
        }

        #endregion

        #region UpdatePaymentInfo Tests

        [Fact]
        public void UpdatePaymentInfo_WhenSuccessful_ShouldReturnTrue()
        {
            // Arrange
            var paymentInfo = new PaymentInfo
            {
                SchoolId = 1,
                AccountNumber = "9876543210",
                AccountBank = "Updated Bank",
                AccountName = "Updated Name",
                ExchangeRate = 1500,
                QrcodeUrl = "https://example.com/updated-qr.png"
            };
            _mockRepo.Setup(r => r.UpdatePaymentInfo(paymentInfo)).Returns(true);

            // Act
            var result = _service.UpdatePaymentInfo(paymentInfo);

            // Assert
            Assert.True(result);
            _mockRepo.Verify(r => r.UpdatePaymentInfo(paymentInfo), Times.Once);
        }

        [Fact]
        public void UpdatePaymentInfo_WhenFailed_ShouldReturnFalse()
        {
            // Arrange
            var paymentInfo = new PaymentInfo
            {
                SchoolId = 999,
                AccountNumber = "0000000000",
                AccountBank = "Non-existent Bank",
                AccountName = "Non-existent",
                ExchangeRate = 1000,
                QrcodeUrl = "https://example.com/qr.png"
            };
            _mockRepo.Setup(r => r.UpdatePaymentInfo(paymentInfo)).Returns(false);

            // Act
            var result = _service.UpdatePaymentInfo(paymentInfo);

            // Assert
            Assert.False(result);
            _mockRepo.Verify(r => r.UpdatePaymentInfo(paymentInfo), Times.Once);
        }

        [Fact]
        public void UpdatePaymentInfo_WithMultipleUpdates_ShouldCallRepositoryEachTime()
        {
            // Arrange
            var paymentInfo1 = new PaymentInfo
            {
                SchoolId = 1,
                AccountNumber = "1111",
                AccountBank = "Bank 1",
                AccountName = "School 1",
                ExchangeRate = 1000,
                QrcodeUrl = "url1"
            };
            var paymentInfo2 = new PaymentInfo
            {
                SchoolId = 2,
                AccountNumber = "2222",
                AccountBank = "Bank 2",
                AccountName = "School 2",
                ExchangeRate = 1000,
                QrcodeUrl = "url2"
            };
            _mockRepo.Setup(r => r.UpdatePaymentInfo(It.IsAny<PaymentInfo>())).Returns(true);

            // Act
            var result1 = _service.UpdatePaymentInfo(paymentInfo1);
            var result2 = _service.UpdatePaymentInfo(paymentInfo2);

            // Assert
            Assert.True(result1);
            Assert.True(result2);
            _mockRepo.Verify(r => r.UpdatePaymentInfo(It.IsAny<PaymentInfo>()), Times.Exactly(2));
        }

        #endregion
    }
}
