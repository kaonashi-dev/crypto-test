<script lang="ts">
  import { TransactionService } from '$lib/api/transactions';
  import { WalletService } from '$lib/api/wallets';
  import CreateTransactionModal from '$lib/components/create-transaction-modal.svelte';
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
  import type { Transaction, Wallet } from '$lib/types';
  import { formatAddress, formatBalance } from '$lib/utils/format';
  import { onMount } from 'svelte';

  let transactions = $state<Transaction[]>([]);
  let wallets = $state<Wallet[]>([]);
  let isLoading = $state(true);
  let error = $state('');
  let selectedWalletId = $state<string>('');
  let searchTerm = $state('');
  let statusFilter = $state<string>('');
  let showCreateModal = $state(false);

  // Filtered transactions state
  let filteredTransactions = $state<Transaction[]>([]);

  // Function to update filtered transactions
  function updateFilteredTransactions() {
    let filtered = transactions;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        tx =>
          tx.txHash.toLowerCase().includes(term) ||
          tx.reference?.toLowerCase().includes(term) ||
          tx.fromAddress?.toLowerCase().includes(term) ||
          tx.toAddress?.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    filteredTransactions = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Sort by newest first
    });
  }

  onMount(async () => {
    await loadWallets();
    // Only load transactions if we have a wallet selected
    if (selectedWalletId) {
      await loadTransactions();
    }
  });

  async function loadWallets() {
    try {
      wallets = await WalletService.getWallets();
      if (wallets.length > 0 && !selectedWalletId) {
        selectedWalletId = wallets[0].id.toString();
        // Load transactions for the first wallet
        await loadTransactions();
      }
    } catch (err) {
      console.error('Failed to load wallets:', err);
    }
  }

  async function loadTransactions() {
    if (!selectedWalletId) return;

    try {
      isLoading = true;
      error = '';
      console.log('Loading transactions for wallet:', selectedWalletId);
      transactions =
        await TransactionService.getTransactionsByWallet(selectedWalletId);
      console.log('Loaded transactions:', transactions);
      updateFilteredTransactions();
    } catch (err) {
      console.error('Error loading transactions:', err);
      error =
        err instanceof Error ? err.message : 'Failed to load transactions';
    } finally {
      isLoading = false;
    }
  }

  function handleWalletChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedWalletId = target.value;
    loadTransactions();
  }

  // Update filtered transactions when search term or status filter changes
  $effect(() => {
    updateFilteredTransactions();
  });

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

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'send':
        return '↗️';
      case 'receive':
        return '↙️';
      case 'request':
        return '📥';
      default:
        return '💰';
    }
  }

  function openCreateModal() {
    showCreateModal = true;
  }

  function closeCreateModal() {
    showCreateModal = false;
  }

  async function handleTransactionCreated() {
    await loadTransactions();
  }
</script>

<svelte:head>
  <title>Transactions - Crypto Wallet Manager</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Transactions</h2>
      <p class="text-muted-foreground">
        View and manage your transaction history
      </p>
    </div>
    <Button onclick={openCreateModal}>Create Transaction</Button>
  </div>

  <!-- Filters -->
  <Card>
    <CardHeader>
      <CardTitle>Filters</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="space-y-2">
          <Label for="wallet">Wallet</Label>
          <select
            id="wallet"
            class="w-full rounded border border-gray-300 px-3 py-2"
            value={selectedWalletId}
            onchange={handleWalletChange}
          >
            <option value="">All Wallets</option>
            {#each wallets as wallet}
              <option value={wallet.id}>{wallet.network} - {wallet.coin}</option
              >
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <Label for="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by hash, reference, or address..."
            bind:value={searchTerm}
          />
        </div>

        <div class="space-y-2">
          <Label for="status">Status</Label>
          <select
            id="status"
            class="w-full rounded border border-gray-300 px-3 py-2"
            bind:value={statusFilter}
          >
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Transactions List -->
  <Card>
    <CardHeader>
      <CardTitle>Transaction History</CardTitle>
      <CardDescription>
        {filteredTransactions.length} transaction{filteredTransactions.length !==
        1
          ? 's'
          : ''} found
      </CardDescription>
    </CardHeader>
    <CardContent>
      {#if isLoading}
        <div class="space-y-3">
          {#each Array(3) as _}
            <div
              class="shimmer border-border/50 bg-card/50 flex items-center space-x-4 rounded-xl border p-5"
            >
              <div
                class="from-muted to-muted/50 h-10 w-10 animate-pulse rounded-full bg-gradient-to-r"
              ></div>
              <div class="flex-1 space-y-3">
                <div
                  class="from-muted to-muted/50 h-4 w-3/4 animate-pulse rounded-lg bg-gradient-to-r"
                ></div>
                <div
                  class="from-muted to-muted/50 h-3 w-1/2 animate-pulse rounded-lg bg-gradient-to-r"
                ></div>
              </div>
              <div
                class="from-muted to-muted/50 h-6 w-20 animate-pulse rounded-lg bg-gradient-to-r"
              ></div>
            </div>
          {/each}
        </div>
      {:else if error}
        <div class="py-6 text-center">
          <div class="mb-4 text-red-600">{error}</div>
          <Button onclick={loadTransactions}>Retry</Button>
        </div>
      {:else if filteredTransactions.length === 0}
        <div class="py-6 text-center">
          <p class="text-muted-foreground">
            {#if !selectedWalletId}
              'Please select a wallet to view transactions'
            {:else if transactions.length === 0}
              'No transactions found for this wallet'
            {:else}
              'No transactions match your filters'
            {/if}
          </p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each filteredTransactions as transaction (transaction.id)}
            <div
              class="card-enhanced group border-border/50 bg-card/50 flex items-center space-x-4 rounded-xl border p-5 backdrop-blur-sm"
            >
              <div
                class="text-3xl opacity-80 transition-transform duration-200 group-hover:scale-110"
              >
                {getTypeIcon(transaction.type)}
              </div>

              <div class="min-w-0 flex-1">
                <div class="mb-1 flex items-center space-x-2">
                  <span class="font-mono text-sm font-medium">
                    {formatAddress(transaction.txHash)}
                  </span>
                  <span class="status-badge status-{transaction.status}">
                    {transaction.status}
                  </span>
                </div>

                <div class="text-muted-foreground mt-1 text-sm">
                  {#if transaction.type === 'send'}
                    To: <span class="font-mono"
                      >{formatAddress(transaction.toAddress)}</span
                    >
                  {:else if transaction.type === 'receive'}
                    From: <span class="font-mono"
                      >{formatAddress(transaction.fromAddress)}</span
                    >
                  {:else}
                    Request: <span class="font-mono"
                      >{formatAddress(transaction.toAddress)}</span
                    >
                  {/if}
                </div>

                {#if transaction.reference}
                  <div class="text-muted-foreground/70 mt-1 text-xs">
                    Ref: {transaction.reference}
                  </div>
                {/if}

                {#if transaction.txHash}
                  <div class="mt-1">
                    <a
                      href="https://nile.tronscan.org/#/transaction/{transaction.txHash}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      View on TronScan
                    </a>
                  </div>
                {/if}
              </div>

              <div class="text-right">
                <div
                  class="text-lg font-bold {transaction.type === 'send'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'}"
                >
                  {transaction.type === 'send' ? '-' : '+'}{formatBalance(
                    transaction.amount,
                    transaction.coin
                  )}
                </div>
                <div class="text-muted-foreground mt-1 text-xs">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </div>
                {#if transaction.network}
                  <div class="text-muted-foreground/70 mt-0.5 text-xs">
                    {transaction.network}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>

<CreateTransactionModal
  isOpen={showCreateModal}
  onClose={closeCreateModal}
  onTransactionCreated={handleTransactionCreated}
  {wallets}
/>
