import { test, expect, describe } from 'bun:test';
import { Money } from '../../value-objects/Money';

describe('Money Value Object', () => {
  test('should create valid money amounts', () => {
    const result = Money.create(100, 'USD');
    
    expect(result.isSuccess).toBe(true);
    expect(result.value.amount).toBe(100);
    expect(result.value.currency).toBe('USD');
  });

  test('should fail for negative amounts', () => {
    const result = Money.create(-100, 'USD');
    
    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_AMOUNT');
  });

  test('should create zero money', () => {
    const zero = Money.zero('ETH');
    
    expect(zero.amount).toBe(0);
    expect(zero.currency).toBe('ETH');
    expect(zero.isZero()).toBe(true);
  });

  test('should add money of same currency', () => {
    const money1 = Money.create(100, 'USD').value;
    const money2 = Money.create(50, 'USD').value;
    
    const result = money1.add(money2);
    
    expect(result.isSuccess).toBe(true);
    expect(result.value.amount).toBe(150);
    expect(result.value.currency).toBe('USD');
  });

  test('should fail to add different currencies', () => {
    const money1 = Money.create(100, 'USD').value;
    const money2 = Money.create(50, 'EUR').value;
    
    const result = money1.add(money2);
    
    expect(result.isFailure).toBe(true);
  });

  test('should subtract money of same currency', () => {
    const money1 = Money.create(100, 'USD').value;
    const money2 = Money.create(30, 'USD').value;
    
    const result = money1.subtract(money2);
    
    expect(result.isSuccess).toBe(true);
    expect(result.value.amount).toBe(70);
  });

  test('should fail to subtract resulting in negative', () => {
    const money1 = Money.create(50, 'USD').value;
    const money2 = Money.create(100, 'USD').value;
    
    const result = money1.subtract(money2);
    
    expect(result.isFailure).toBe(true);
  });

  test('should multiply money', () => {
    const money = Money.create(100, 'USD').value;
    
    const result = money.multiply(2.5);
    
    expect(result.isSuccess).toBe(true);
    expect(result.value.amount).toBe(250);
  });

  test('should compare money amounts', () => {
    const money1 = Money.create(100, 'USD').value;
    const money2 = Money.create(50, 'USD').value;
    const money3 = Money.create(100, 'USD').value;
    
    expect(money1.isGreaterThan(money2)).toBe(true);
    expect(money2.isLessThan(money1)).toBe(true);
    expect(money1.equals(money3)).toBe(true);
  });

  test('should serialize to JSON', () => {
    const money = Money.create(100.50, 'BTC').value;
    const json = money.toJSON();
    
    expect(json).toEqual({
      amount: 100.50,
      currency: 'BTC'
    });
  });
});