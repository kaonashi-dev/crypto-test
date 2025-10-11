<script lang="ts">
  import { WalletService } from '$lib/api/wallets';
  import { Button } from '$lib/components/ui/button';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onWalletCreated: () => void;
  }

  let { isOpen, onClose, onWalletCreated }: Props = $props();

  let selectedNetwork = $state('ETH');
  let selectedCoin = $state('ETH');
  let isLoading = $state(false);
  let error = $state('');

  const networks = [
    { value: 'BTC', label: 'Bitcoin' },
    { value: 'ETH', label: 'Ethereum' },
    { value: 'POLYGON', label: 'Polygon' },
    { value: 'BNB', label: 'BNB Smart Chain' },
    { value: 'TRON', label: 'Tron' },
  ];

  const coins: Record<string, Array<{ value: string; label: string }>> = {
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

  function getAvailableCoins() {
    return coins[selectedNetwork] || [];
  }

  async function createWallet() {
    if (!selectedNetwork || !selectedCoin) {
      error = 'Please select both network and coin';
      return;
    }

    try {
      isLoading = true;
      error = '';
      await WalletService.createWallet(selectedNetwork, selectedCoin);
      onWalletCreated();
      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create wallet';
    } finally {
      isLoading = false;
    }
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
</script>

{#if isOpen}
  <div
    class="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
  >
    <Card class="bg-card w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle>Create New Wallet</CardTitle>
        <CardDescription>
          Create a new wallet for a specific network and coin combination.
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

        <div class="flex justify-end space-x-2">
          <Button variant="outline" onclick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onclick={createWallet} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Wallet'}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}
