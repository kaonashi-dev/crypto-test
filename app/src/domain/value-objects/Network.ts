import { Result } from '../shared/Result';

export type NetworkType = 'bitcoin' | 'ethereum' | 'polygon' | 'tron';

export class Network {
  private constructor(private readonly _value: NetworkType) {}

  static create(value: string): Result<Network, Error> {
    const validNetworks: NetworkType[] = ['bitcoin', 'ethereum', 'polygon', 'tron'];
    
    if (!validNetworks.includes(value as NetworkType)) {
      return Result.failure(new Error(`Invalid network: ${value}. Valid networks: ${validNetworks.join(', ')}`));
    }

    return Result.success(new Network(value as NetworkType));
  }

  get value(): NetworkType {
    return this._value;
  }

  equals(other: Network): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  isEVMCompatible(): boolean {
    return this._value === 'ethereum' || this._value === 'polygon';
  }

  getAddressPrefix(): string {
    switch (this._value) {
      case 'bitcoin':
        return '1';
      case 'ethereum':
      case 'polygon':
        return '0x';
      case 'tron':
        return 'T';
    }
  }

  getAddressLength(): number {
    switch (this._value) {
      case 'bitcoin':
        return 34;
      case 'ethereum':
      case 'polygon':
        return 42;
      case 'tron':
        return 34;
    }
  }
}