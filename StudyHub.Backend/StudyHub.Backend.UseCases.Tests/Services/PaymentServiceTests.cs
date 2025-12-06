using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using Xunit;

namespace StudyHub.Backend.UseCases.Tests.Services
{
    public class PaymentServiceTests
    {
        private readonly Mock<IAppUserRepository> _mockUserRepo;
        private readonly PaymentService _service;

        public PaymentServiceTests()
        {
            _mockUserRepo = new Mock<IAppUserRepository>();
            _service = new PaymentService(_mockUserRepo.Object);
        }

        #region CreditWallet Tests

        [Fact]
        public void CreditWallet_WhenUserExists_ShouldAddAmountAndReturnNewBalance()
        {
            // Arrange
            var transferId = 12345;
            var initialWallet = 10000L;
            var creditAmount = 5000L;
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                TransferId = transferId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetByTransferId(transferId)).Returns(user);

            // Act
            var result = _service.CreditWallet(transferId, creditAmount);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(15000L, result.Value);
            Assert.Equal(15000L, user.Wallet);
        }

        [Fact]
        public void CreditWallet_WhenUserNotFound_ShouldReturnNull()
        {
            // Arrange
            var transferId = 99999;
            _mockUserRepo.Setup(r => r.GetByTransferId(transferId)).Returns((AppUser?)null);

            // Act
            var result = _service.CreditWallet(transferId, 5000L);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void CreditWallet_WhenAmountIsZero_ShouldReturnCurrentBalance()
        {
            // Arrange
            var transferId = 12345;
            var initialWallet = 10000L;
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                TransferId = transferId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetByTransferId(transferId)).Returns(user);

            // Act
            var result = _service.CreditWallet(transferId, 0L);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(initialWallet, result.Value);
        }

        [Fact]
        public void CreditWallet_WhenAmountIsNegative_ShouldReturnCurrentBalance()
        {
            // Arrange
            var transferId = 12345;
            var initialWallet = 10000L;
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                TransferId = transferId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetByTransferId(transferId)).Returns(user);

            // Act
            var result = _service.CreditWallet(transferId, -100L);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(initialWallet, result.Value);
        }

        #endregion

        #region CreditWalletByUserId Tests

        [Fact]
        public void CreditWalletByUserId_WhenUserExists_ShouldAddAmountAndReturnNewBalance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var initialWallet = 20000L;
            var creditAmount = 10000L;
            var user = new AppUser
            {
                Id = userId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns(user);

            // Act
            var result = _service.CreditWalletByUserId(userId, creditAmount);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(30000L, result.Value);
            Assert.Equal(30000L, user.Wallet);
        }

        [Fact]
        public void CreditWalletByUserId_WhenUserNotFound_ShouldReturnNull()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns((AppUser?)null);

            // Act
            var result = _service.CreditWalletByUserId(userId, 5000L);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void CreditWalletByUserId_WhenAmountIsZeroOrNegative_ShouldReturnCurrentBalance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var initialWallet = 15000L;
            var user = new AppUser
            {
                Id = userId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns(user);

            // Act
            var result = _service.CreditWalletByUserId(userId, 0L);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(initialWallet, result.Value);
        }

        #endregion

        #region DebitWalletByUserId Tests

        [Fact]
        public void DebitWalletByUserId_WhenUserExistsAndSufficientFunds_ShouldDeductAndReturnNewBalance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var initialWallet = 20000L;
            var debitAmount = 5000L;
            var user = new AppUser
            {
                Id = userId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns(user);

            // Act
            var result = _service.DebitWalletByUserId(userId, debitAmount);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(15000L, result.Value);
            Assert.Equal(15000L, user.Wallet);
        }

        [Fact]
        public void DebitWalletByUserId_WhenInsufficientFunds_ShouldReturnMinusOne()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var initialWallet = 5000L;
            var debitAmount = 10000L;
            var user = new AppUser
            {
                Id = userId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns(user);

            // Act
            var result = _service.DebitWalletByUserId(userId, debitAmount);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(-1L, result.Value);
            Assert.Equal(initialWallet, user.Wallet); // Balance unchanged
        }

        [Fact]
        public void DebitWalletByUserId_WhenUserNotFound_ShouldReturnNull()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns((AppUser?)null);

            // Act
            var result = _service.DebitWalletByUserId(userId, 5000L);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void DebitWalletByUserId_WhenAmountIsZero_ShouldReturnCurrentBalance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var initialWallet = 10000L;
            var user = new AppUser
            {
                Id = userId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns(user);

            // Act
            var result = _service.DebitWalletByUserId(userId, 0L);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(initialWallet, result.Value);
        }

        [Fact]
        public void DebitWalletByUserId_WhenAmountIsNegative_ShouldReturnCurrentBalance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var initialWallet = 10000L;
            var user = new AppUser
            {
                Id = userId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns(user);

            // Act
            var result = _service.DebitWalletByUserId(userId, -100L);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(initialWallet, result.Value);
        }

        [Fact]
        public void DebitWalletByUserId_WhenExactBalance_ShouldReturnZero()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var initialWallet = 10000L;
            var user = new AppUser
            {
                Id = userId,
                Wallet = initialWallet,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns(user);

            // Act
            var result = _service.DebitWalletByUserId(userId, initialWallet);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0L, result.Value);
            Assert.Equal(0L, user.Wallet);
        }

        #endregion

        #region GetWalletByUserId Tests

        [Fact]
        public void GetWalletByUserId_WhenUserExists_ShouldReturnWalletBalance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var walletBalance = 50000L;
            var user = new AppUser
            {
                Id = userId,
                Wallet = walletBalance,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns(user);

            // Act
            var result = _service.GetWalletByUserId(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(walletBalance, result.Value);
        }

        [Fact]
        public void GetWalletByUserId_WhenUserNotFound_ShouldReturnNull()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns((AppUser?)null);

            // Act
            var result = _service.GetWalletByUserId(userId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void GetWalletByUserId_WhenWalletIsZero_ShouldReturnZero()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                Wallet = 0L,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetById(userId)).Returns(user);

            // Act
            var result = _service.GetWalletByUserId(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0L, result.Value);
        }

        #endregion
    }
}
