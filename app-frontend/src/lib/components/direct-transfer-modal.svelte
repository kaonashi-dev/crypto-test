<script lang="ts">
  import { TransactionService } from '$lib/api/transactions';
  import { Button } from '$lib/components/ui/button';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { Wallet } from '$lib/types';
  import { cleanAddress, validateAddress } from '$lib/utils/format';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onTransferCreated: () => void;
    fromWallet: Wallet;
  }

  let { isOpen, onClose, onTransferCreated, fromWallet }: Props = $props();

  let amount = $state('');
  let toAddress = $state('');
  let reference = $state('');
  let isLoading = $state(false);
  let error = $state('');

  const networks = [
    { value: 'BTC', label: 'Bitcoin' },
    { value: 'ETH', label: 'Ethereum' },
    { value: 'POLYGON', label: 'Polygon' },
    { value: 'BNB', label: 'BNB Smart Chain' },
    { value: 'TRON', label: 'Tron' },
  ];

  const coins = {
    BTC: [{ value: 'BTC', label: 'Bitcoin (BTC)' }],
    ETH: [
      { value: 'ETH', label: 'Ethereum (ETH)' },
      { value: 'USDT', label: 'Tether USD (USDT)' },
    ],
    POLYGON: [
      { value: 'MATIC', label: 'Polygon (MATIC)' },
      { value: 'USDT', label: 'Tether USD (USDT)' },
    ],
    BNB: [
      { value: 'BNB', label: 'BNB (BNB)' },
      { value: 'USDT', label: 'Tether USD (USDT)' },
    ],
    TRON: [
      { value: 'TRX', label: 'Tron (TRX)' },
      { value: 'USDT', label: 'Tether USD (USDT)' },
    ],
  };

  let selectedNetwork = $state(fromWallet.network);
  let selectedCoin = $state(fromWallet.coin);

  function getAvailableCoins() {
    return coins[selectedNetwork as keyof typeof coins] || [];
  }

  function handleNetworkChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedNetwork = target.value;
    // Reset coin selection when network changes
    const availableCoins = getAvailableCoins();
    if (availableCoins.length > 0) {
      selectedCoin = availableCoins[0].value;
    }
  }

  function handleCoinChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedCoin = target.value;
  }

  async function createDirectTransfer() {
    if (!amount || !toAddress) {
      error = 'Please fill in amount and destination address';
      return;
    }

    // Validate destination address
    if (!validateAddress(toAddress, selectedNetwork)) {
      error = `Invalid destination address for ${selectedNetwork} network`;
      return;
    }

    const transferAmount = parseFloat(amount);
    const availableBalance = parseFloat(fromWallet.balance);

    if (transferAmount <= 0) {
      error = 'Amount must be greater than 0';
      return;
    }

    if (transferAmount > availableBalance) {
      error = `Insufficient balance. Available: ${fromWallet.balance} ${fromWallet.coin}`;
      return;
    }

    try {
      isLoading = true;
      error = '';

      // Check if backend service is running
      const isBackendHealthy = await TransactionService.checkBackendHealth();
      if (!isBackendHealthy) {
        error =
          'Backend service is not running. Please ensure the backend API is running on http://localhost:3000';
        return;
      }

      const transferData = {
        amount: amount.toString(),
        type: 'send' as const,
        network: selectedNetwork,
        coin: selectedCoin,
        toAddress: cleanAddress(toAddress),
        reference: reference || undefined,
        walletId: fromWallet.id.toString(),
      };

      await TransactionService.createTransaction(transferData);

      onTransferCreated();
      onClose();
    } catch (err) {
      console.error('Transfer error:', err);

      if (err instanceof Error) {
        // Handle specific error cases
        if (err.message.includes('Invalid private key')) {
          error =
            'Backend service error: Private key validation failed. Please ensure the backend service is running and properly configured.';
        } else if (err.message.includes('Failed to fetch')) {
          error =
            'Cannot connect to backend service. Please ensure the backend API is running on http://localhost:3000';
        } else if (err.message.includes('Invalid destination address')) {
          error = err.message;
        } else {
          error = err.message;
        }
      } else {
        error = 'Failed to create transfer. Please try again.';
      }
    } finally {
      isLoading = false;
    }
  }

  function resetForm() {
    amount = '';
    toAddress = '';
    reference = '';
    selectedNetwork = fromWallet.network;
    selectedCoin = fromWallet.coin;
    error = '';
  }

  function handleClose() {
    resetForm();
    onClose();
  }
</script>

{#if isOpen}
  <div
    class="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
  >
    <Card
      class="bg-card max-h-[90vh] w-full max-w-md overflow-y-auto shadow-lg"
    >
      <CardHeader>
        <CardTitle>Direct Transfer</CardTitle>
        <CardDescription>
          Send funds from {fromWallet.network} wallet to any address
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if error}
          <div
            class="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700"
          >
            {error}
          </div>
        {/if}

        <!-- From Wallet Info -->
        <div class="rounded border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-sm font-medium text-gray-700">From Wallet</div>
          <div class="text-lg font-semibold text-gray-900">
            {fromWallet.network} - {fromWallet.coin}
          </div>
          <div class="text-sm text-gray-600">
            Balance: {fromWallet.balance}
            {fromWallet.coin}
          </div>
          <div class="font-mono text-xs text-gray-500">
            {fromWallet.address}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="network">Network</Label>
            <select
              id="network"
              class="w-full rounded border border-gray-300 px-3 py-2"
              value={selectedNetwork}
              onchange={handleNetworkChange}
              disabled={isLoading}
            >
              {#each networks as network}
                <option value={network.value}>{network.label}</option>
              {/each}
            </select>
          </div>

          <div class="space-y-2">
            <Label for="coin">Coin</Label>
            <select
              id="coin"
              class="w-full rounded border border-gray-300 px-3 py-2"
              value={selectedCoin}
              onchange={handleCoinChange}
              disabled={isLoading}
            >
              {#each getAvailableCoins() as coin}
                <option value={coin.value}>{coin.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            bind:value={amount}
            disabled={isLoading}
          />
          <div class="text-sm text-gray-600">
            Available: {fromWallet.balance}
            {fromWallet.coin}
          </div>
        </div>

        <div class="space-y-2">
          <Label for="toAddress">Destination Address *</Label>
          <Input
            id="toAddress"
            placeholder="Enter recipient address"
            bind:value={toAddress}
            disabled={isLoading}
          />
          <div class="text-sm text-gray-600">
            Network: {selectedNetwork}
          </div>
        </div>

        <div class="space-y-2">
          <Label for="reference">Reference (Optional)</Label>
          <Input
            id="reference"
            placeholder="Transfer reference"
            bind:value={reference}
            disabled={isLoading}
          />
        </div>

        <div class="flex justify-end space-x-2">
          <Button variant="outline" onclick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onclick={createDirectTransfer}
            disabled={isLoading || !amount || !toAddress}
          >
            {isLoading ? 'Sending...' : 'Send Transfer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}
