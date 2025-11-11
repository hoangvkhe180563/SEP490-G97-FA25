using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Services
{
    public class PaymentService
    {
        private readonly IAppUserRepository _userRepo;
        public PaymentService(IAppUserRepository userRepo)
        {
            _userRepo = userRepo;
        }

        /// <summary>
        /// Credit the user's wallet by amount (in smallest currency unit) and persist the change.
        /// Returns the new wallet balance or null if user not found.
        /// </summary>
        public long? CreditWallet(int transferId, long amount)
        {
            var user = _userRepo.GetByTransferId(transferId);
            if (user == null) return null;
            if (amount <= 0) return user.Wallet;
            user.Wallet = checked(user.Wallet + amount);
            user.UpdatedAt = System.DateTime.UtcNow;
            _userRepo.UpdateUser(user);
            return user.Wallet;
        }

        /// <summary>
        /// Credit wallet by AppUserId (useful for refunds)
        /// </summary>
        public long? CreditWalletByUserId(Guid userId, long amount)
        {
            var user = _userRepo.GetById(userId);
            if (user == null) return null;
            if (amount <= 0) return user.Wallet;
            user.Wallet = checked(user.Wallet + amount);
            user.UpdatedAt = System.DateTime.UtcNow;
            _userRepo.UpdateUser(user);
            return user.Wallet;
        }

        /// <summary>
        /// Debit the user's wallet by amount. Returns new balance on success,
        /// returns -1 if insufficient funds, or null if user not found.
        /// </summary>
        public long? DebitWalletByUserId(Guid userId, long amount)
        {
            var user = _userRepo.GetById(userId);
            if (user == null) return null;
            if (amount <= 0) return user.Wallet;
            if (user.Wallet < amount) return -1; // insufficient
            user.Wallet = checked(user.Wallet - amount);
            user.UpdatedAt = System.DateTime.UtcNow;
            _userRepo.UpdateUser(user);
            return user.Wallet;
        }

        /// <summary>
        /// Get current wallet balance for a user by Guid.
        /// Returns null if user not found.
        /// </summary>
        public long? GetWalletByUserId(Guid userId)
        {
            var user = _userRepo.GetById(userId);
            if (user == null) return null;
            return user.Wallet;
        }
    }
}
