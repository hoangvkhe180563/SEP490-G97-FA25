using Moq;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Services;
using Xunit;

namespace StudyHub.Backend.UseCases.Tests.Services
{
    public class TransactionServiceTests
    {
        private readonly Mock<ITransactionRepository> _mockTxRepo;
        private readonly Mock<IAppUserRepository> _mockUserRepo;
        private readonly TransactionService _service;

        public TransactionServiceTests()
        {
            _mockTxRepo = new Mock<ITransactionRepository>();
            _mockUserRepo = new Mock<IAppUserRepository>();
            _service = new TransactionService(_mockTxRepo.Object, _mockUserRepo.Object);
        }

        #region ExistsByTransactionCode Tests

        [Fact]
        public void ExistsByTransactionCode_WhenTransactionExists_ShouldReturnTrue()
        {
            // Arrange
            var code = "TXN12345";
            _mockTxRepo.Setup(r => r.ExistsByTransactionCode(code)).Returns(true);

            // Act
            var result = _service.ExistsByTransactionCode(code);

            // Assert
            Assert.True(result);
            _mockTxRepo.Verify(r => r.ExistsByTransactionCode(code), Times.Once);
        }

        [Fact]
        public void ExistsByTransactionCode_WhenTransactionDoesNotExist_ShouldReturnFalse()
        {
            // Arrange
            var code = "NONEXISTENT";
            _mockTxRepo.Setup(r => r.ExistsByTransactionCode(code)).Returns(false);

            // Act
            var result = _service.ExistsByTransactionCode(code);

            // Assert
            Assert.False(result);
            _mockTxRepo.Verify(r => r.ExistsByTransactionCode(code), Times.Once);
        }

        #endregion

        #region CreateTransaction Tests

        [Fact]
        public void CreateTransaction_ShouldCallRepositoryAndReturnCreatedTransaction()
        {
            // Arrange
            var newTransaction = new Transaction
            {
                UserId = Guid.NewGuid(),
                TransactionCode = "TXN001",
                Amount = 10000,
                Type = "DEPOSIT",
                Status = "PENDING"
            };
            var createdTransaction = new Transaction
            {
                Id = 1,
                UserId = newTransaction.UserId,
                TransactionCode = "TXN001",
                Amount = 10000,
                Type = "DEPOSIT",
                Status = "PENDING"
            };
            _mockTxRepo.Setup(r => r.CreateTransaction(newTransaction)).Returns(createdTransaction);

            // Act
            var result = _service.CreateTransaction(newTransaction);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
            Assert.Equal("TXN001", result.TransactionCode);
            Assert.Equal(10000, result.Amount);
            _mockTxRepo.Verify(r => r.CreateTransaction(newTransaction), Times.Once);
        }

        [Fact]
        public void CreateTransaction_WithMultipleTransactions_ShouldCreateEach()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var tx1 = new Transaction { UserId = userId, TransactionCode = "TXN001", Amount = 10000 };
            var tx2 = new Transaction { UserId = userId, TransactionCode = "TXN002", Amount = 20000 };
            var created1 = new Transaction { Id = 1, UserId = userId, TransactionCode = "TXN001", Amount = 10000 };
            var created2 = new Transaction { Id = 2, UserId = userId, TransactionCode = "TXN002", Amount = 20000 };
            _mockTxRepo.Setup(r => r.CreateTransaction(tx1)).Returns(created1);
            _mockTxRepo.Setup(r => r.CreateTransaction(tx2)).Returns(created2);

            // Act
            var result1 = _service.CreateTransaction(tx1);
            var result2 = _service.CreateTransaction(tx2);

            // Assert
            Assert.Equal("TXN001", result1.TransactionCode);
            Assert.Equal("TXN002", result2.TransactionCode);
        }

        #endregion

        #region GetByTransactionCode Tests

        [Fact]
        public void GetByTransactionCode_WhenTransactionExists_ShouldReturnTransaction()
        {
            // Arrange
            var code = "TXN12345";
            var transaction = new Transaction
            {
                Id = 1,
                TransactionCode = code,
                Amount = 50000,
                Type = "PAYMENT",
                Status = "SUCCESS"
            };
            _mockTxRepo.Setup(r => r.GetByTransactionCode(code)).Returns(transaction);

            // Act
            var result = _service.GetByTransactionCode(code);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(code, result.TransactionCode);
            Assert.Equal(50000, result.Amount);
            _mockTxRepo.Verify(r => r.GetByTransactionCode(code), Times.Once);
        }

        [Fact]
        public void GetByTransactionCode_WhenTransactionDoesNotExist_ShouldReturnNull()
        {
            // Arrange
            var code = "NONEXISTENT";
            _mockTxRepo.Setup(r => r.GetByTransactionCode(code)).Returns((Transaction?)null);

            // Act
            var result = _service.GetByTransactionCode(code);

            // Assert
            Assert.Null(result);
            _mockTxRepo.Verify(r => r.GetByTransactionCode(code), Times.Once);
        }

        #endregion

        #region GetByUser Tests

        [Fact]
        public void GetByUser_WhenUserHasTransactions_ShouldReturnList()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var transactions = new List<Transaction>
            {
                new Transaction { Id = 1, UserId = userId, TransactionCode = "TXN001", Amount = 10000 },
                new Transaction { Id = 2, UserId = userId, TransactionCode = "TXN002", Amount = 20000 },
                new Transaction { Id = 3, UserId = userId, TransactionCode = "TXN003", Amount = 30000 }
            };
            _mockTxRepo.Setup(r => r.GetByUser(userId)).Returns(transactions);

            // Act
            var result = _service.GetByUser(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.Count);
            Assert.All(result, t => Assert.Equal(userId, t.UserId));
            _mockTxRepo.Verify(r => r.GetByUser(userId), Times.Once);
        }

        [Fact]
        public void GetByUser_WhenUserHasNoTransactions_ShouldReturnEmptyList()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var transactions = new List<Transaction>();
            _mockTxRepo.Setup(r => r.GetByUser(userId)).Returns(transactions);

            // Act
            var result = _service.GetByUser(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
            _mockTxRepo.Verify(r => r.GetByUser(userId), Times.Once);
        }

        #endregion

        #region GetByFilter Tests

        [Fact]
        public void GetByFilter_WithTypeAndStatus_ShouldReturnPagedResult()
        {
            // Arrange
            var type = "DEPOSIT";
            var status = "SUCCESS";
            var page = 1;
            var limit = 10;
            var transactions = new List<Transaction>
            {
                new Transaction { Id = 1, Type = type, Status = status, Amount = 10000 },
                new Transaction { Id = 2, Type = type, Status = status, Amount = 20000 }
            };
            var pagedResult = new PagedResult<Transaction>
            {
                Items = transactions,
                Total = 2,
                Page = page,
                Limit = limit,
                TotalPages = 1
            };
            _mockTxRepo.Setup(r => r.GetByFilter(type, status, page, limit)).Returns(pagedResult);

            // Act
            var result = _service.GetByFilter(type, status, page, limit);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Total);
            Assert.Equal(2, result.Items.Count);
            _mockTxRepo.Verify(r => r.GetByFilter(type, status, page, limit), Times.Once);
        }

        [Fact]
        public void GetByFilter_WithNullFilters_ShouldReturnAllTransactions()
        {
            // Arrange
            var page = 1;
            var limit = 20;
            var transactions = new List<Transaction>
            {
                new Transaction { Id = 1, Type = "DEPOSIT", Status = "SUCCESS" },
                new Transaction { Id = 2, Type = "WITHDRAWAL", Status = "PENDING" }
            };
            var pagedResult = new PagedResult<Transaction>
            {
                Items = transactions,
                Total = 2,
                Page = page,
                Limit = limit,
                TotalPages = 1
            };
            _mockTxRepo.Setup(r => r.GetByFilter(null, null, page, limit)).Returns(pagedResult);

            // Act
            var result = _service.GetByFilter(null, null, page, limit);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Total);
            _mockTxRepo.Verify(r => r.GetByFilter(null, null, page, limit), Times.Once);
        }

        [Fact]
        public void GetByFilter_WithPagination_ShouldRespectLimits()
        {
            // Arrange
            var page = 2;
            var limit = 5;
            var transactions = new List<Transaction>
            {
                new Transaction { Id = 6, Type = "DEPOSIT", Status = "SUCCESS" },
                new Transaction { Id = 7, Type = "DEPOSIT", Status = "SUCCESS" }
            };
            var pagedResult = new PagedResult<Transaction>
            {
                Items = transactions,
                Total = 12,
                Page = page,
                Limit = limit,
                TotalPages = 3
            };
            _mockTxRepo.Setup(r => r.GetByFilter(null, null, page, limit)).Returns(pagedResult);

            // Act
            var result = _service.GetByFilter(null, null, page, limit);

            // Assert
            Assert.Equal(5, result.Limit);
            Assert.Equal(2, result.Page);
            Assert.Equal(12, result.Total);
        }

        #endregion

        #region GetForExport Tests

        [Fact]
        public void GetForExport_WithFilters_ShouldReturnFilteredList()
        {
            // Arrange
            var type = "PAYMENT";
            var status = "SUCCESS";
            var transactions = new List<Transaction>
            {
                new Transaction { Id = 1, Type = type, Status = status, Amount = 10000 },
                new Transaction { Id = 2, Type = type, Status = status, Amount = 20000 }
            };
            _mockTxRepo.Setup(r => r.GetForExport(type, status)).Returns(transactions);

            // Act
            var result = _service.GetForExport(type, status);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.All(result, t => Assert.Equal(type, t.Type));
            Assert.All(result, t => Assert.Equal(status, t.Status));
            _mockTxRepo.Verify(r => r.GetForExport(type, status), Times.Once);
        }

        [Fact]
        public void GetForExport_WithNullFilters_ShouldReturnAllTransactions()
        {
            // Arrange
            var transactions = new List<Transaction>
            {
                new Transaction { Id = 1, Type = "DEPOSIT", Status = "SUCCESS" },
                new Transaction { Id = 2, Type = "WITHDRAWAL", Status = "PENDING" },
                new Transaction { Id = 3, Type = "PAYMENT", Status = "FAILED" }
            };
            _mockTxRepo.Setup(r => r.GetForExport(null, null)).Returns(transactions);

            // Act
            var result = _service.GetForExport(null, null);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.Count);
            _mockTxRepo.Verify(r => r.GetForExport(null, null), Times.Once);
        }

        #endregion

        #region GetRevenueForExport Tests

        [Fact]
        public void GetRevenueForExport_WithAllParameters_ShouldReturnRevenueData()
        {
            // Arrange
            var from = DateTime.UtcNow.AddMonths(-1);
            var to = DateTime.UtcNow;
            var courseId = 1;
            var teacherId = Guid.NewGuid();
            var mode = "ONLINE";
            var revenueData = new List<RevenueExportRow>
            {
                new RevenueExportRow { CourseId = courseId, CourseName = "Course 1", TotalAmount = 100000, TransactionCount = 5 },
                new RevenueExportRow { CourseId = courseId, CourseName = "Course 1", TotalAmount = 200000, TransactionCount = 10 }
            };
            _mockTxRepo.Setup(r => r.GetRevenueForExport(from, to, courseId, teacherId, mode)).Returns(revenueData);

            // Act
            var result = _service.GetRevenueForExport(from, to, courseId, teacherId, mode);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            _mockTxRepo.Verify(r => r.GetRevenueForExport(from, to, courseId, teacherId, mode), Times.Once);
        }

        [Fact]
        public void GetRevenueForExport_WithNullParameters_ShouldReturnAllRevenue()
        {
            // Arrange
            var revenueData = new List<RevenueExportRow>
            {
                new RevenueExportRow { CourseId = 1, CourseName = "Course 1", TotalAmount = 100000, TransactionCount = 5 },
                new RevenueExportRow { CourseId = 2, CourseName = "Course 2", TotalAmount = 200000, TransactionCount = 10 },
                new RevenueExportRow { CourseId = 3, CourseName = "Course 3", TotalAmount = 300000, TransactionCount = 15 }
            };
            _mockTxRepo.Setup(r => r.GetRevenueForExport(null, null, null, null, null)).Returns(revenueData);

            // Act
            var result = _service.GetRevenueForExport(null, null, null, null, null);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.Count);
            _mockTxRepo.Verify(r => r.GetRevenueForExport(null, null, null, null, null), Times.Once);
        }

        [Fact]
        public void GetRevenueForExport_WithDateRange_ShouldFilterByDates()
        {
            // Arrange
            var from = new DateTime(2024, 1, 1);
            var to = new DateTime(2024, 12, 31);
            var revenueData = new List<RevenueExportRow>
            {
                new RevenueExportRow { CourseId = 1, CourseName = "Course 1", TotalAmount = 500000, TransactionCount = 25 }
            };
            _mockTxRepo.Setup(r => r.GetRevenueForExport(from, to, null, null, null)).Returns(revenueData);

            // Act
            var result = _service.GetRevenueForExport(from, to, null, null, null);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal(500000, result[0].TotalAmount);
            _mockTxRepo.Verify(r => r.GetRevenueForExport(from, to, null, null, null), Times.Once);
        }

        [Fact]
        public void GetRevenueForExport_ShouldIncludeTransactionCount()
        {
            // Arrange
            var revenueData = new List<RevenueExportRow>
            {
                new RevenueExportRow { CourseId = 1, CourseName = "Course A", TotalAmount = 50000, TransactionCount = 10 },
                new RevenueExportRow { CourseId = 2, CourseName = "Course B", TotalAmount = 75000, TransactionCount = 15 }
            };
            _mockTxRepo.Setup(r => r.GetRevenueForExport(null, null, null, null, null)).Returns(revenueData);

            // Act
            var result = _service.GetRevenueForExport(null, null, null, null, null);

            // Assert
            Assert.Equal(10, result[0].TransactionCount);
            Assert.Equal(15, result[1].TransactionCount);
        }

        #endregion

        #region UpdateStatus Tests

        [Fact]
        public void UpdateStatus_WhenSuccessful_ShouldReturnTrue()
        {
            // Arrange
            var transactionId = 1;
            var newStatus = "SUCCESS";
            _mockTxRepo.Setup(r => r.UpdateStatus(transactionId, newStatus)).Returns(true);

            // Act
            var result = _service.UpdateStatus(transactionId, newStatus);

            // Assert
            Assert.True(result);
            _mockTxRepo.Verify(r => r.UpdateStatus(transactionId, newStatus), Times.Once);
        }

        [Fact]
        public void UpdateStatus_WhenFailed_ShouldReturnFalse()
        {
            // Arrange
            var transactionId = 999;
            var newStatus = "SUCCESS";
            _mockTxRepo.Setup(r => r.UpdateStatus(transactionId, newStatus)).Returns(false);

            // Act
            var result = _service.UpdateStatus(transactionId, newStatus);

            // Assert
            Assert.False(result);
            _mockTxRepo.Verify(r => r.UpdateStatus(transactionId, newStatus), Times.Once);
        }

        [Fact]
        public void UpdateStatus_WithDifferentStatuses_ShouldUpdateCorrectly()
        {
            // Arrange
            var transactionId = 1;
            _mockTxRepo.Setup(r => r.UpdateStatus(transactionId, "PENDING")).Returns(true);
            _mockTxRepo.Setup(r => r.UpdateStatus(transactionId, "SUCCESS")).Returns(true);
            _mockTxRepo.Setup(r => r.UpdateStatus(transactionId, "FAILED")).Returns(true);

            // Act
            var result1 = _service.UpdateStatus(transactionId, "PENDING");
            var result2 = _service.UpdateStatus(transactionId, "SUCCESS");
            var result3 = _service.UpdateStatus(transactionId, "FAILED");

            // Assert
            Assert.True(result1);
            Assert.True(result2);
            Assert.True(result3);
        }

        #endregion

        #region UpdateTransaction Tests

        [Fact]
        public void UpdateTransaction_WhenSuccessful_ShouldReturnTrue()
        {
            // Arrange
            var transaction = new Transaction
            {
                Id = 1,
                TransactionCode = "TXN001",
                Amount = 50000,
                Type = "PAYMENT",
                Status = "SUCCESS"
            };
            _mockTxRepo.Setup(r => r.UpdateTransaction(transaction)).Returns(true);

            // Act
            var result = _service.UpdateTransaction(transaction);

            // Assert
            Assert.True(result);
            _mockTxRepo.Verify(r => r.UpdateTransaction(transaction), Times.Once);
        }

        [Fact]
        public void UpdateTransaction_WhenFailed_ShouldReturnFalse()
        {
            // Arrange
            var transaction = new Transaction
            {
                Id = 999,
                TransactionCode = "INVALID",
                Amount = 0
            };
            _mockTxRepo.Setup(r => r.UpdateTransaction(transaction)).Returns(false);

            // Act
            var result = _service.UpdateTransaction(transaction);

            // Assert
            Assert.False(result);
            _mockTxRepo.Verify(r => r.UpdateTransaction(transaction), Times.Once);
        }

        #endregion

        #region GetUserIdByTransferId Tests

        [Fact]
        public void GetUserIdByTransferId_WhenUserExists_ShouldReturnUserId()
        {
            // Arrange
            var transferId = 12345;
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                TransferId = transferId,
                Email = "test@test.com"
            };
            _mockUserRepo.Setup(r => r.GetByTransferId(transferId)).Returns(user);

            // Act
            var result = _service.GetUserIdByTransferId(transferId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.Value);
            _mockUserRepo.Verify(r => r.GetByTransferId(transferId), Times.Once);
        }

        [Fact]
        public void GetUserIdByTransferId_WhenUserDoesNotExist_ShouldReturnNull()
        {
            // Arrange
            var transferId = 99999;
            _mockUserRepo.Setup(r => r.GetByTransferId(transferId)).Returns((AppUser?)null);

            // Act
            var result = _service.GetUserIdByTransferId(transferId);

            // Assert
            Assert.Null(result);
            _mockUserRepo.Verify(r => r.GetByTransferId(transferId), Times.Once);
        }

        [Fact]
        public void GetUserIdByTransferId_WithDifferentTransferIds_ShouldReturnCorrectUserId()
        {
            // Arrange
            var transferId1 = 111;
            var transferId2 = 222;
            var userId1 = Guid.NewGuid();
            var userId2 = Guid.NewGuid();
            var user1 = new AppUser { Id = userId1, TransferId = transferId1, Email = "user1@test.com" };
            var user2 = new AppUser { Id = userId2, TransferId = transferId2, Email = "user2@test.com" };
            _mockUserRepo.Setup(r => r.GetByTransferId(transferId1)).Returns(user1);
            _mockUserRepo.Setup(r => r.GetByTransferId(transferId2)).Returns(user2);

            // Act
            var result1 = _service.GetUserIdByTransferId(transferId1);
            var result2 = _service.GetUserIdByTransferId(transferId2);

            // Assert
            Assert.NotNull(result1);
            Assert.NotNull(result2);
            Assert.Equal(userId1, result1.Value);
            Assert.Equal(userId2, result2.Value);
            Assert.NotEqual(result1.Value, result2.Value);
        }

        #endregion
    }
}
