import { MerchantRepository } from '../../domain/repositories/MerchantRepository';
import { WalletRepository } from '../../domain/repositories/WalletRepository';
import { TransactionRepository } from '../../domain/repositories/TransactionRepository';
import { BlockchainProvider } from '../../application/ports/BlockchainProvider';

import { DrizzleMerchantRepository } from '../repositories/DrizzleMerchantRepository';
import { DrizzleWalletRepository } from '../repositories/DrizzleWalletRepository';
import { DrizzleTransactionRepository } from '../repositories/DrizzleTransactionRepository';

import { CreateWalletUseCase } from '../../application/use-cases/wallet/CreateWalletUseCase';
import { GetWalletUseCase } from '../../application/use-cases/wallet/GetWalletUseCase';
import { ListMerchantWalletsUseCase } from '../../application/use-cases/wallet/ListMerchantWalletsUseCase';
import { SendTransactionUseCase } from '../../application/use-cases/transaction/SendTransactionUseCase';

export interface Dependencies {
  // Repositories
  merchantRepository: MerchantRepository;
  walletRepository: WalletRepository;
  transactionRepository: TransactionRepository;
  
  // Providers
  blockchainProvider: BlockchainProvider;
  
  // Use Cases
  createWalletUseCase: CreateWalletUseCase;
  getWalletUseCase: GetWalletUseCase;
  listMerchantWalletsUseCase: ListMerchantWalletsUseCase;
  sendTransactionUseCase: SendTransactionUseCase;
}

class Container {
  private static instance: Container;
  private dependencies: Dependencies;

  private constructor() {
    this.dependencies = this.buildDependencies();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  get<T extends keyof Dependencies>(key: T): Dependencies[T] {
    return this.dependencies[key];
  }

  private buildDependencies(): Dependencies {
    // Repositories
    const merchantRepository = new DrizzleMerchantRepository();
    const walletRepository = new DrizzleWalletRepository();
    const transactionRepository = new DrizzleTransactionRepository();
    
    // Providers - For now using a mock implementation
    const blockchainProvider: BlockchainProvider = {
      async getBalance() {
        throw new Error('Not implemented');
      },
      async sendTransaction() {
        throw new Error('Not implemented');
      },
      async getTransaction() {
        throw new Error('Not implemented');
      },
      async getTransactionConfirmations() {
        throw new Error('Not implemented');
      },
      isValidAddress() {
        return true;
      },
      async estimateTransactionFee() {
        throw new Error('Not implemented');
      }
    };

    // Use Cases
    const createWalletUseCase = new CreateWalletUseCase(
      merchantRepository,
      walletRepository
    );
    
    const getWalletUseCase = new GetWalletUseCase(walletRepository);
    
    const listMerchantWalletsUseCase = new ListMerchantWalletsUseCase(
      merchantRepository,
      walletRepository
    );
    
    const sendTransactionUseCase = new SendTransactionUseCase(
      walletRepository,
      transactionRepository,
      blockchainProvider
    );

    return {
      merchantRepository,
      walletRepository,
      transactionRepository,
      blockchainProvider,
      createWalletUseCase,
      getWalletUseCase,
      listMerchantWalletsUseCase,
      sendTransactionUseCase,
    };
  }
}

export const container = Container.getInstance();