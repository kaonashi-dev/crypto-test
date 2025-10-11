import { Result } from '../shared/Result';
import { InvalidAddressError } from '../shared/DomainError';
import { Network } from './Network';

export class Address {
  private constructor(
    private readonly _value: string,
    private readonly _network: Network
  ) {}

  static create(value: string, network: Network): Result<Address, InvalidAddressError> {
    if (!Address.isValidForNetwork(value, network)) {
      return Result.failure(new InvalidAddressError(value, network.value));
    }

    return Result.success(new Address(value, network));
  }

  private static isValidForNetwork(address: string, network: Network): boolean {
    const expectedPrefix = network.getAddressPrefix();
    const expectedLength = network.getAddressLength();

    if (!address.startsWith(expectedPrefix)) {
      return false;
    }

    if (address.length !== expectedLength) {
      return false;
    }

    if (network.isEVMCompatible()) {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    if (network.value === 'bitcoin') {
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
    }

    if (network.value === 'tron') {
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    }

    return false;
  }

  static generate(network: Network): Address {
    const prefix = network.getAddressPrefix();
    const length = network.getAddressLength() - prefix.length;
    
    let randomPart = '';
    const chars = network.isEVMCompatible() 
      ? '0123456789abcdef'
      : '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    for (let i = 0; i < length; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const addressValue = prefix + randomPart;
    
    return new Address(addressValue, network);
  }

  get value(): string {
    return this._value;
  }

  get network(): Network {
    return this._network;
  }

  equals(other: Address): boolean {
    return this._value === other._value && this._network.equals(other._network);
  }

  toString(): string {
    return this._value;
  }
}