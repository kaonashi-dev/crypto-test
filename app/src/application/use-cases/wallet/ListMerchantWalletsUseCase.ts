import { AsyncResult, Result } from '../../../domain/shared/Result';
import { MerchantRepository } from '../../../domain/repositories/MerchantRepository';
import { WalletRepository } from '../../../domain/repositories/WalletRepository';
import { WalletResponseDto } from '../../dto/CreateWalletDto';
import { MerchantNotFoundError } from '../../../domain/shared/DomainError';

export class ListMerchantWalletsUseCase {
  constructor(
    private readonly merchantRepository: MerchantRepository,
    private readonly walletRepository: WalletRepository
  ) {}

  async execute(merchantId: string): AsyncResult<WalletResponseDto[]> {
    const merchantResult = await this.merchantRepository.findById(merchantId);
    if (merchantResult.isFailure) {
      return Result.failure(merchantResult.error);
    }

    const merchant = merchantResult.value;
    if (!merchant) {
      return Result.failure(new MerchantNotFoundError(merchantId));
    }

    const walletsResult = await this.walletRepository.findByMerchantId(merchantId);
    if (walletsResult.isFailure) {
      return Result.failure(walletsResult.error);
    }

    const wallets = walletsResult.value;
    const response: WalletResponseDto[] = wallets.map(wallet => ({
      id: wallet.id,
      merchantId: wallet.merchantId,
      address: wallet.address.value,
      network: wallet.network.value,
      balance: wallet.balance.amount,
      status: wallet.status,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    }));

    return Result.success(response);
  }
}