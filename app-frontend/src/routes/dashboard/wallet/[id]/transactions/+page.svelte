<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { TransactionService } from '$lib/api/transactions';
  import { WalletService } from '$lib/api/wallets';
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
  import type { Transaction, Wallet } from '$lib/types';
  import { formatAddress, formatBalance, formatUSD } from '$lib/utils/format';
  import { onMount } from 'svelte';

  let wallet = $state<Wallet | null>(null);
  let transactions = $state<Transaction[]>([]);
  let allWallets = $state<Wallet[]>([]);
  let isLoading = $state(true);
  let error = $state('');
  let showTransferModal = $state(false);
  let showDirectTransferModal = $state(false);

  let walletId = $derived($page.params.id);

  onMount(async () => {
    if (walletId) {
      await loadWalletData();
    }
  });

  async function loadWalletData() {
    try {
      isLoading = true;
      error = '';

      if (!walletId) {
        throw new Error('Wallet ID is required');
      }

      // First get all wallets to find the specific wallet
      allWallets = await WalletService.getWallets();
      const foundWallet = allWallets.find(w => w.id.toString() === walletId);

      if (!foundWallet) {
        throw new Error('Wallet not found');
      }

      // Load transactions for the wallet
      const transactionsData =
        await TransactionService.getTransactionsByWallet(walletId);

      wallet = foundWallet;
      transactions = transactionsData;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load wallet data';
    } finally {
      isLoading = false;
    }
  }

  function goBack() {
    goto('/dashboard/wallets');
  }

  function formatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleString();
  }

  function getTransactionIcon(type: string): string {
    switch (type) {
      case 'send':
        return '↗️';
      case 'receive':
        return '↙️';
      case 'request':
        return '📥';
      case 'transfer':
        return '🔄';
      default:
        return '💰';
    }
  }

  function getTransactionColor(type: string): string {
    switch (type) {
      case 'send':
        return 'text-red-600';
      case 'receive':
        return 'text-green-600';
      case 'request':
        return 'text-blue-600';
      case 'transfer':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  function openTransferModal() {
    showTransferModal = true;
  }

  function closeTransferModal() {
    showTransferModal = false;
  }

  function openDirectTransferModal() {
    showDirectTransferModal = true;
  }

  function closeDirectTransferModal() {
    showDirectTransferModal = false;
  }

  async function handleTransferCreated() {
    await loadWalletData();
  }
</script>

<svelte:head>
  <title
    >{wallet
      ? `${wallet.network} Wallet - Transactions`
      : 'Wallet Transactions'} - Crypto Wallet Manager</title
  >
</svelte:head>

<div class="px-4 py-6 sm:px-0">
  {#if isLoading}
    <div class="animate-pulse">
      <div class="mb-4 h-8 w-1/4 rounded bg-gray-200"></div>
      <div class="mb-6 h-32 rounded bg-gray-200"></div>
      <div class="space-y-4">
        {#each Array(5) as _}
          <div class="h-20 rounded bg-gray-200"></div>
        {/each}
      </div>
    </div>
  {:else if error}
    <div
      class="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700"
    >
      {error}
    </div>
    <Button onclick={loadWalletData}>Retry</Button>
  {:else if wallet}
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Button variant="outline" onclick={goBack}>← Back to Wallets</Button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 capitalize">
            {wallet.network} Wallet
          </h1>
          <p class="font-mono text-sm text-gray-600">
            {formatAddress(wallet.address)}
          </p>
        </div>
      </div>
      <div class="flex space-x-2">
        <Button onclick={openDirectTransferModal}>Send Funds</Button>
        <Button variant="outline" onclick={openTransferModal}
          >Transfer Between Wallets</Button
        >
      </div>
    </div>

    <!-- Wallet Info Card -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>Wallet Overview</CardTitle>
        <CardDescription>Current balance and wallet information</CardDescription
        >
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p class="text-sm text-gray-500">Current Balance</p>
            <p class="text-2xl font-bold text-gray-900">
              {formatBalance(wallet.balance, wallet.coin)}
            </p>
            {#if wallet.balanceUsd}
              <p class="text-sm text-gray-600">
                ≈ {formatUSD(wallet.balanceUsd)} USD
              </p>
            {/if}
          </div>
          <div>
            <p class="text-sm text-gray-500">Coin</p>
            <p class="text-lg font-semibold text-gray-900">
              {wallet.coin.toUpperCase()}
            </p>
            <p class="text-sm text-gray-500 capitalize">{wallet.network}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Transactions</p>
            <p class="text-lg font-semibold text-gray-900">
              {transactions.length}
            </p>
            <p class="text-sm text-gray-500 capitalize">{wallet.status}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Transactions -->
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>All transactions for this wallet</CardDescription>
      </CardHeader>
      <CardContent>
        {#if transactions.length === 0}
          <div class="py-8 text-center">
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 class="mb-2 text-lg font-medium text-gray-900">
              No transactions yet
            </h3>
            <p class="text-gray-500">
              Transactions will appear here once you start using this wallet.
            </p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each transactions as transaction (transaction.id)}
              <div
                class="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div class="flex items-center space-x-4">
                  <div class="text-2xl">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <div class="flex items-center space-x-2">
                      <p class="font-medium text-gray-900 capitalize">
                        {transaction.type}
                      </p>
                      <span
                        class="rounded-full px-2 py-1 text-xs {getStatusColor(
                          transaction.status
                        )}"
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500">
                      {#if transaction.type === 'send'}
                        To: {formatAddress(transaction.toAddress)}
                      {:else if transaction.type === 'receive'}
                        From: {formatAddress(transaction.fromAddress)}
                      {:else if transaction.type === 'transfer'}
                        Transfer: {formatAddress(transaction.toAddress)}
                      {:else}
                        Request: {formatAddress(transaction.toAddress)}
                      {/if}
                    </p>
                    {#if transaction.reference}
                      <p class="text-xs text-gray-400">
                        Ref: {transaction.reference}
                      </p>
                    {/if}
                    <p class="text-xs text-gray-400">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p
                    class="font-semibold {getTransactionColor(
                      transaction.type
                    )}"
                  >
                    {transaction.type === 'send' ||
                    transaction.type === 'transfer'
                      ? '-'
                      : '+'}{formatBalance(
                      transaction.amount,
                      transaction.coin,
                      true
                    )}
                  </p>
                  {#if transaction.network}
                    <p class="text-xs text-gray-400">
                      {transaction.network}
                    </p>
                  {/if}
                  {#if transaction.gasUsed}
                    <p class="text-xs text-gray-400">
                      Gas: {transaction.gasUsed}
                    </p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>

{#if wallet}
  <DirectTransferModal
    isOpen={showDirectTransferModal}
    onClose={closeDirectTransferModal}
    onTransferCreated={handleTransferCreated}
    fromWallet={wallet}
  />
{/if}

<TransferModal
  isOpen={showTransferModal}
  onClose={closeTransferModal}
  onTransferCreated={handleTransferCreated}
  wallets={allWallets}
  fromWallet={wallet || undefined}
/>
