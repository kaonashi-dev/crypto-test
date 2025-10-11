<script lang="ts">
  import { goto } from '$app/navigation';
  import { WalletService } from '$lib/api/wallets';
  import CreateWalletModal from '$lib/components/create-wallet-modal.svelte';
  import DirectTransferModal from '$lib/components/direct-transfer-modal.svelte';
  import TransferModal from '$lib/components/transfer-modal.svelte';
  import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui';
  import type { Wallet } from '$lib/types';
  import { formatAddress, formatBalance, formatUSD } from '$lib/utils/format';
  import { onMount } from 'svelte';

  let wallets = $state<Wallet[]>([]);
  let isLoading = $state(true);
  let error = $state('');
  let showCreateModal = $state(false);
  let showTransferModal = $state(false);
  let showDirectTransferModal = $state(false);
  let selectedWalletForTransfer = $state<Wallet | undefined>(undefined);
  let selectedWalletForDirectTransfer = $state<Wallet | undefined>(undefined);

  onMount(async () => {
    await loadWallets();
  });

  async function loadWallets() {
    try {
      isLoading = true;
      error = '';
      wallets = await WalletService.getWallets();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load wallets';
    } finally {
      isLoading = false;
    }
  }

  function viewWallet(walletId: number) {
    goto(`/dashboard/wallet/${walletId}/transactions`);
  }

  function openCreateModal() {
    showCreateModal = true;
  }

  function closeCreateModal() {
    showCreateModal = false;
  }

  async function handleWalletCreated() {
    await loadWallets();
  }

  function openTransferModal(wallet?: Wallet) {
    selectedWalletForTransfer = wallet;
    showTransferModal = true;
  }

  function closeTransferModal() {
    showTransferModal = false;
    selectedWalletForTransfer = undefined;
  }

  function openDirectTransferModal(wallet: Wallet) {
    selectedWalletForDirectTransfer = wallet;
    showDirectTransferModal = true;
  }

  function closeDirectTransferModal() {
    showDirectTransferModal = false;
    selectedWalletForDirectTransfer = undefined;
  }

  async function handleTransferCreated() {
    await loadWallets();
  }
</script>

<svelte:head>
  <title>Wallets - Crypto Wallet Manager</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">My Wallets</h1>
      <p class="text-gray-600">Manage your cryptocurrency wallets</p>
    </div>
    <div class="flex space-x-2">
      <Button variant="outline" onclick={() => openTransferModal()}>
        Transfer Funds
      </Button>
      <Button onclick={openCreateModal}>Add New Wallet</Button>
    </div>
  </div>

  {#if isLoading}
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _}
        <Card class="shimmer border-border/50">
          <CardHeader>
            <div class="h-5 rounded-lg bg-gradient-to-r from-muted to-muted/50 animate-pulse"></div>
            <div class="h-3 w-2/3 rounded-lg bg-gradient-to-r from-muted to-muted/50 animate-pulse mt-2"></div>
          </CardHeader>
          <CardContent>
            <div class="mb-3 h-8 rounded-lg bg-gradient-to-r from-muted to-muted/50 animate-pulse"></div>
            <div class="h-4 w-1/2 rounded-lg bg-gradient-to-r from-muted to-muted/50 animate-pulse"></div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else if error}
    <div
      class="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700"
    >
      {error}
    </div>
    <Button onclick={loadWallets}>Retry</Button>
  {:else if wallets.length === 0}
    <Card>
      <CardContent class="py-12 text-center">
        <div class="mb-4 text-gray-400">
          <svg
            class="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-lg font-medium text-gray-900">No wallets found</h3>
        <p class="mb-4 text-gray-500">
          Get started by adding your first cryptocurrency wallet.
        </p>
        <Button onclick={openCreateModal}>Add Your First Wallet</Button>
      </CardContent>
    </Card>
  {:else}
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each wallets as wallet (wallet.id)}
        <Card class="card-enhanced card-gradient group">
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <span class="capitalize bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {wallet.network} Wallet
              </span>
              <span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                >{wallet.coin.toUpperCase()}</span
              >
            </CardTitle>
            <CardDescription class="font-mono text-xs">
              {formatAddress(wallet.address)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="mb-2 text-3xl font-bold">
              {formatBalance(wallet.balance, wallet.coin)}
            </div>
            {#if wallet.balanceUsd}
              <div class="mb-3 text-sm text-muted-foreground">
                ≈ {formatUSD(wallet.balanceUsd)} USD
              </div>
            {/if}
            <div
              class="mb-4 flex items-center justify-between text-sm text-muted-foreground"
            >
              <span class="status-badge status-confirmed capitalize">{wallet.status}</span>
              <span class="text-xs"
                >{new Date(wallet.createdAt).toLocaleDateString()}</span
              >
            </div>
            <div class="mt-4 flex space-x-2">
              <Button class="flex-1 group-hover:shadow-lg transition-shadow" onclick={() => viewWallet(wallet.id)}>
                View Details
              </Button>
              <Button
                variant="outline"
                class="flex-1"
                onclick={() => openDirectTransferModal(wallet)}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<CreateWalletModal
  isOpen={showCreateModal}
  onClose={closeCreateModal}
  onWalletCreated={handleWalletCreated}
/>

{#if selectedWalletForDirectTransfer}
  <DirectTransferModal
    isOpen={showDirectTransferModal}
    onClose={closeDirectTransferModal}
    onTransferCreated={handleTransferCreated}
    fromWallet={selectedWalletForDirectTransfer}
  />
{/if}

<TransferModal
  isOpen={showTransferModal}
  onClose={closeTransferModal}
  onTransferCreated={handleTransferCreated}
  {wallets}
  fromWallet={selectedWalletForTransfer}
/>
