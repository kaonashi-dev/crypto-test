import { AsyncResult, Result } from '../../../domain/shared/Result';
import { WalletRepository } from '../../../domain/repositories/WalletRepository';
import { WalletResponseDto } from '../../dto/CreateWalletDto';
import { WalletNotFoundError, WalletAccessDeniedError } from '../../../domain/shared/DomainError';

export class GetWalletUseCase {
  constructor(private readonly walletRepository: WalletRepository) {}

  async execute(walletId: string, merchantId: string): AsyncResult<WalletResponseDto> {
    const walletResult = await this.walletRepository.findById(walletId);
    if (walletResult.isFailure) {
      return Result.failure(walletResult.error);
    }

    const wallet = walletResult.value;
    if (!wallet) {
      return Result.failure(new WalletNotFoundError(walletId));
    }

    if (!wallet.belongsToMerchant(merchantId)) {
      return Result.failure(new WalletAccessDeniedError());
    }

    const response: WalletResponseDto = {
      id: wallet.id,
      merchantId: wallet.merchantId,
      address: wallet.address.value,
      network: wallet.network.value,
      balance: wallet.balance.amount,
      status: wallet.status,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };

    return Result.success(response);
  }
}