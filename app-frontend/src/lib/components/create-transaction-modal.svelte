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
    onTransactionCreated: () => void;
    wallets: Wallet[];
  }

  let { isOpen, onClose, onTransactionCreated, wallets }: Props = $props();

  let transactionType = $state<'send' | 'receive' | 'request'>('send');
  let selectedWalletId = $state<string>('');
  let amount = $state('');
  let toAddress = $state('');
  let fromAddress = $state('');
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

  let selectedNetwork = $state('ETH');
  let selectedCoin = $state('ETH');

  function getAvailableCoins() {
    return coins[selectedNetwork as keyof typeof coins] || [];
  }

  function handleTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    transactionType = target.value as 'send' | 'receive' | 'request';

    // Clear address fields when type changes
    toAddress = '';
    fromAddress = '';
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

  async function createTransaction() {
    if (!amount || !selectedNetwork || !selectedCoin) {
      error = 'Please fill in all required fields';
      return;
    }

    if (transactionType === 'send' && !toAddress) {
      error = 'To address is required for send transactions';
      return;
    }

    if (transactionType === 'receive' && !fromAddress) {
      error = 'From address is required for receive transactions';
      return;
    }

    // Validate addresses based on network
    if (
      transactionType === 'send' &&
      toAddress &&
      !validateAddress(toAddress, selectedNetwork)
    ) {
      error = `Invalid destination address for ${selectedNetwork} network`;
      return;
    }

    if (
      transactionType === 'receive' &&
      fromAddress &&
      !validateAddress(fromAddress, selectedNetwork)
    ) {
      error = `Invalid source address for ${selectedNetwork} network`;
      return;
    }

    try {
      isLoading = true;
      error = '';

      const transactionData = {
        amount: amount.toString(),
        type: transactionType,
        network: selectedNetwork,
        coin: selectedCoin,
        reference: reference || undefined,
        walletId: selectedWalletId || undefined,
        ...(transactionType === 'send' && {
          toAddress: cleanAddress(toAddress),
        }),
        ...(transactionType === 'receive' && {
          fromAddress: cleanAddress(fromAddress),
        }),
        ...(transactionType === 'request' && {
          toAddress: selectedWalletId
            ? cleanAddress(
                wallets.find(w => w.id.toString() === selectedWalletId)
                  ?.address || ''
              )
            : undefined,
        }),
      };

      if (transactionType === 'request') {
        await TransactionService.createRequestTransaction({
          amount: amount.toString(),
          network: selectedNetwork,
          coin: selectedCoin,
          reference: reference || undefined,
        });
      } else {
        await TransactionService.createTransaction(transactionData);
      }

      onTransactionCreated();
      onClose();
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'Failed to create transaction';
    } finally {
      isLoading = false;
    }
  }

  function resetForm() {
    transactionType = 'send';
    selectedWalletId = '';
    amount = '';
    toAddress = '';
    fromAddress = '';
    reference = '';
    selectedNetwork = 'ETH';
    selectedCoin = 'ETH';
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
        <CardTitle>Create New Transaction</CardTitle>
        <CardDescription>Create a new blockchain transaction</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if error}
          <div
            class="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700"
          >
            {error}
          </div>
        {/if}

        <div class="space-y-2">
          <Label for="type">Transaction Type</Label>
          <select
            id="type"
            class="w-full rounded border border-gray-300 px-3 py-2"
            value={transactionType}
            onchange={handleTypeChange}
            disabled={isLoading}
          >
            <option value="send">Send</option>
            <option value="receive">Receive</option>
            <option value="request">Request</option>
          </select>
        </div>

        <div class="space-y-2">
          <Label for="wallet">Wallet (Optional)</Label>
          <select
            id="wallet"
            class="w-full rounded border border-gray-300 px-3 py-2"
            value={selectedWalletId}
            onchange={e =>
              (selectedWalletId = (e.target as HTMLSelectElement).value)}
            disabled={isLoading}
          >
            <option value="">Select a wallet</option>
            {#each wallets as wallet}
              <option value={wallet.id}>{wallet.network} - {wallet.coin}</option
              >
            {/each}
          </select>
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
        </div>

        {#if transactionType === 'send'}
          <div class="space-y-2">
            <Label for="toAddress">To Address *</Label>
            <Input
              id="toAddress"
              placeholder="Enter recipient address"
              bind:value={toAddress}
              disabled={isLoading}
            />
          </div>
        {/if}

        {#if transactionType === 'receive'}
          <div class="space-y-2">
            <Label for="fromAddress">From Address *</Label>
            <Input
              id="fromAddress"
              placeholder="Enter sender address"
              bind:value={fromAddress}
              disabled={isLoading}
            />
          </div>
        {/if}

        <div class="space-y-2">
          <Label for="reference">Reference (Optional)</Label>
          <Input
            id="reference"
            placeholder="Transaction reference"
            bind:value={reference}
            disabled={isLoading}
          />
        </div>

        <div class="flex justify-end space-x-2">
          <Button variant="outline" onclick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onclick={createTransaction} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Transaction'}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}
