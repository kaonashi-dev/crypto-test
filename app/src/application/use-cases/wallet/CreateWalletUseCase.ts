import { AsyncResult, Result } from '../../../domain/shared/Result';
import { MerchantRepository } from '../../../domain/repositories/MerchantRepository';
import { WalletRepository } from '../../../domain/repositories/WalletRepository';
import { Wallet } from '../../../domain/entities/Wallet';
import { Network } from '../../../domain/value-objects/Network';
import { CreateWalletDto, WalletResponseDto } from '../../dto/CreateWalletDto';
import { MerchantNotFoundError, InvalidMerchantStatusError } from '../../../domain/shared/DomainError';

export class CreateWalletUseCase {
  constructor(
    private readonly merchantRepository: MerchantRepository,
    private readonly walletRepository: WalletRepository
  ) {}

  async execute(dto: CreateWalletDto): AsyncResult<WalletResponseDto> {
    const merchantResult = await this.merchantRepository.findById(dto.merchantId);
    if (merchantResult.isFailure) {
      return Result.failure(merchantResult.error);
    }

    const merchant = merchantResult.value;
    if (!merchant) {
      return Result.failure(new MerchantNotFoundError(dto.merchantId));
    }

    const canOperateResult = merchant.canPerformOperations();
    if (canOperateResult.isFailure) {
      return Result.failure(canOperateResult.error);
    }

    const networkResult = Network.create(dto.network);
    if (networkResult.isFailure) {
      return Result.failure(networkResult.error);
    }

    const wallet = Wallet.create(dto.merchantId, networkResult.value);

    const saveResult = await this.walletRepository.save(wallet);
    if (saveResult.isFailure) {
      return Result.failure(saveResult.error);
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