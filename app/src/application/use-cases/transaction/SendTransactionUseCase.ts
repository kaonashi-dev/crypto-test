import { AsyncResult, Result } from '../../../domain/shared/Result';
import { WalletRepository } from '../../../domain/repositories/WalletRepository';
import { TransactionRepository } from '../../../domain/repositories/TransactionRepository';
import { Transaction } from '../../../domain/entities/Transaction';
import { Address } from '../../../domain/value-objects/Address';
import { Money } from '../../../domain/value-objects/Money';
import { CreateTransactionDto, TransactionResponseDto } from '../../dto/TransactionDto';
import { BlockchainProvider } from '../../ports/BlockchainProvider';
import { WalletNotFoundError, InvalidAddressError } from '../../../domain/shared/DomainError';

export class SendTransactionUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly blockchainProvider: BlockchainProvider
  ) {}

  async execute(dto: CreateTransactionDto): AsyncResult<TransactionResponseDto> {
    const walletResult = await this.walletRepository.findById(dto.walletId);
    if (walletResult.isFailure) {
      return Result.failure(walletResult.error);
    }

    const wallet = walletResult.value;
    if (!wallet) {
      return Result.failure(new WalletNotFoundError(dto.walletId));
    }

    const toAddressResult = Address.create(dto.toAddress, wallet.network);
    if (toAddressResult.isFailure) {
      return Result.failure(toAddressResult.error);
    }

    const amountResult = Money.create(dto.amount, wallet.network.value.toUpperCase());
    if (amountResult.isFailure) {
      return Result.failure(amountResult.error);
    }

    const canSendResult = wallet.canSend(amountResult.value);
    if (canSendResult.isFailure) {
      return Result.failure(canSendResult.error);
    }

    const transaction = Transaction.create(
      wallet.id,
      'send',
      wallet.address,
      toAddressResult.value,
      amountResult.value,
      wallet.network
    );

    const saveTransactionResult = await this.transactionRepository.save(transaction);
    if (saveTransactionResult.isFailure) {
      return Result.failure(saveTransactionResult.error);
    }

    const blockchainResult = await this.blockchainProvider.sendTransaction(
      wallet.address,
      toAddressResult.value,
      amountResult.value
    );

    if (blockchainResult.isFailure) {
      transaction.fail();
      await this.transactionRepository.save(transaction);
      return Result.failure(blockchainResult.error);
    }

    transaction.setTransactionHash(blockchainResult.value.hash);
    
    const debitResult = wallet.debit(amountResult.value);
    if (debitResult.isFailure) {
      transaction.fail();
      await this.transactionRepository.save(transaction);
      return Result.failure(debitResult.error);
    }

    await this.walletRepository.save(wallet);
    await this.transactionRepository.save(transaction);

    const response: TransactionResponseDto = {
      id: transaction.id,
      walletId: transaction.walletId,
      type: transaction.type,
      fromAddress: transaction.fromAddress.value,
      toAddress: transaction.toAddress.value,
      amount: transaction.amount.amount,
      currency: transaction.amount.currency,
      network: transaction.network.value,
      txHash: transaction.txHash,
      status: transaction.status,
      blockNumber: transaction.blockNumber,
      gasUsed: transaction.gasUsed,
      gasPrice: transaction.gasPrice,
      fee: transaction.fee?.amount,
      confirmations: transaction.confirmations,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };

    return Result.success(response);
  }
}