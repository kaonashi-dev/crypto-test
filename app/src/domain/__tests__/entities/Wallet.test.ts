import { test, expect, describe } from 'bun:test';
import { Wallet } from '../../entities/Wallet';
import { Network } from '../../value-objects/Network';
import { Money } from '../../value-objects/Money';

describe('Wallet Entity', () => {
  test('should create a new wallet', () => {
    const networkResult = Network.create('ethereum');
    expect(networkResult.isSuccess).toBe(true);

    const wallet = Wallet.create('merchant-123', networkResult.value);

    expect(wallet.merchantId).toBe('merchant-123');
    expect(wallet.network.value).toBe('ethereum');
    expect(wallet.balance.amount).toBe(0);
    expect(wallet.status).toBe('active');
    expect(wallet.isActive()).toBe(true);
  });

  test('should belong to merchant', () => {
    const networkResult = Network.create('bitcoin');
    const wallet = Wallet.create('merchant-123', networkResult.value);

    expect(wallet.belongsToMerchant('merchant-123')).toBe(true);
    expect(wallet.belongsToMerchant('merchant-456')).toBe(false);
  });

  test('should credit wallet balance', () => {
    const networkResult = Network.create('ethereum');
    const wallet = Wallet.create('merchant-123', networkResult.value);
    
    const amountResult = Money.create(100, 'ETH');
    expect(amountResult.isSuccess).toBe(true);

    const creditResult = wallet.credit(amountResult.value);
    expect(creditResult.isSuccess).toBe(true);
    expect(wallet.balance.amount).toBe(100);
    expect(wallet.balance.currency).toBe('ETH');
  });

  test('should debit wallet balance', () => {
    const networkResult = Network.create('ethereum');
    const wallet = Wallet.create('merchant-123', networkResult.value);
    
    const creditAmount = Money.create(100, 'ETH');
    wallet.credit(creditAmount.value);

    const debitAmount = Money.create(50, 'ETH');
    const debitResult = wallet.debit(debitAmount.value);
    
    expect(debitResult.isSuccess).toBe(true);
    expect(wallet.balance.amount).toBe(50);
  });

  test('should fail to debit when insufficient funds', () => {
    const networkResult = Network.create('ethereum');
    const wallet = Wallet.create('merchant-123', networkResult.value);
    
    const debitAmount = Money.create(100, 'ETH');
    const debitResult = wallet.debit(debitAmount.value);
    
    expect(debitResult.isFailure).toBe(true);
    expect(debitResult.error.code).toBe('INSUFFICIENT_FUNDS');
  });

  test('should activate and deactivate wallet', () => {
    const networkResult = Network.create('ethereum');
    const wallet = Wallet.create('merchant-123', networkResult.value);

    expect(wallet.isActive()).toBe(true);

    wallet.deactivate();
    expect(wallet.isActive()).toBe(false);

    wallet.activate();
    expect(wallet.isActive()).toBe(true);
  });
});