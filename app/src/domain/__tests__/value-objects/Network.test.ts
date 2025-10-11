import { test, expect, describe } from 'bun:test';
import { Network } from '../../value-objects/Network';

describe('Network Value Object', () => {
  test('should create valid networks', () => {
    const networks = ['bitcoin', 'ethereum', 'polygon', 'tron'];
    
    networks.forEach(network => {
      const result = Network.create(network);
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(network);
    });
  });

  test('should fail for invalid networks', () => {
    const invalidNetworks = ['cardano', 'solana', 'invalid'];
    
    invalidNetworks.forEach(network => {
      const result = Network.create(network);
      expect(result.isFailure).toBe(true);
    });
  });

  test('should identify EVM compatible networks', () => {
    const ethereumResult = Network.create('ethereum');
    const polygonResult = Network.create('polygon');
    const bitcoinResult = Network.create('bitcoin');

    expect(ethereumResult.value.isEVMCompatible()).toBe(true);
    expect(polygonResult.value.isEVMCompatible()).toBe(true);
    expect(bitcoinResult.value.isEVMCompatible()).toBe(false);
  });

  test('should return correct address prefixes', () => {
    const bitcoin = Network.create('bitcoin').value;
    const ethereum = Network.create('ethereum').value;
    const polygon = Network.create('polygon').value;
    const tron = Network.create('tron').value;

    expect(bitcoin.getAddressPrefix()).toBe('1');
    expect(ethereum.getAddressPrefix()).toBe('0x');
    expect(polygon.getAddressPrefix()).toBe('0x');
    expect(tron.getAddressPrefix()).toBe('T');
  });

  test('should return correct address lengths', () => {
    const bitcoin = Network.create('bitcoin').value;
    const ethereum = Network.create('ethereum').value;
    const tron = Network.create('tron').value;

    expect(bitcoin.getAddressLength()).toBe(34);
    expect(ethereum.getAddressLength()).toBe(42);
    expect(tron.getAddressLength()).toBe(34);
  });

  test('should compare networks correctly', () => {
    const ethereum1 = Network.create('ethereum').value;
    const ethereum2 = Network.create('ethereum').value;
    const bitcoin = Network.create('bitcoin').value;

    expect(ethereum1.equals(ethereum2)).toBe(true);
    expect(ethereum1.equals(bitcoin)).toBe(false);
  });
});