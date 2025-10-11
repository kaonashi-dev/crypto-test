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
  import {
    cleanAddress,
    formatAddress,
    formatBalance,
    validateAddress,
  } from '$lib/utils/format';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onTransferCreated: () => void;
    wallets: Wallet[];
    fromWallet?: Wallet;
  }

  let { isOpen, onClose, onTransferCreated, wallets, fromWallet }: Props =
    $props();

  let selectedFromWalletId = $state<string>(fromWallet?.id.toString() || '');
  let selectedToWalletId = $state<string>('');
  let amount = $state('');
  let reference = $state('');
  let isLoading = $state(false);
  let error = $state('');

  // Get available wallets for "to" selection (excluding the selected "from" wallet)
  function getAvailableToWallets() {
    return wallets.filter(
      wallet => wallet.id.toString() !== selectedFromWalletId
    );
  }

  // Get the selected from wallet
  function getSelectedFromWallet() {
    return wallets.find(
      wallet => wallet.id.toString() === selectedFromWalletId
    );
  }

  // Get the selected to wallet
  function getSelectedToWallet() {
    return wallets.find(wallet => wallet.id.toString() === selectedToWalletId);
  }

  // Check if the selected wallets are compatible (same network and coin)
  function areWalletsCompatible() {
    const fromWallet = getSelectedFromWallet();
    const toWallet = getSelectedToWallet();

    if (!fromWallet || !toWallet) return false;

    return (
      fromWallet.network === toWallet.network &&
      fromWallet.coin === toWallet.coin
    );
  }

  // Get available balance for the selected from wallet
  function getAvailableBalance() {
    const wallet = getSelectedFromWallet();
    return wallet ? wallet.balance : '0';
  }

  async function createTransfer() {
    if (!selectedFromWalletId || !selectedToWalletId || !amount) {
      error = 'Please fill in all required fields';
      return;
    }

    if (!areWalletsCompatible()) {
      error =
        'Selected wallets must be on the same network and use the same coin';
      return;
    }

    const fromWallet = getSelectedFromWallet();
    const toWallet = getSelectedToWallet();

    if (!fromWallet || !toWallet) {
      error = 'Invalid wallet selection';
      return;
    }

    // Validate destination address
    if (!validateAddress(toWallet.address, fromWallet.network)) {
      error = `Invalid destination address for ${fromWallet.network} network`;
      return;
    }

    const transferAmount = parseFloat(amount);
    const availableBalance = parseFloat(fromWallet.balance);

    if (transferAmount <= 0) {
      error = 'Amount must be greater than 0';
      return;
    }

    if (transferAmount > availableBalance) {
      error = `Insufficient balance. Available: ${formatBalance(fromWallet.balance, fromWallet.coin)}`;
      return;
    }

    try {
      isLoading = true;
      error = '';

      const transferData = {
        amount: amount.toString(),
        type: 'transfer' as const,
        network: fromWallet.network,
        coin: fromWallet.coin,
        fromWalletId: selectedFromWalletId,
        toWalletId: selectedToWalletId,
        toAddress: cleanAddress(toWallet.address),
        reference: reference || undefined,
      };

      await TransactionService.createTransfer(transferData);

      onTransferCreated();
      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create transfer';
    } finally {
      isLoading = false;
    }
  }

  function resetForm() {
    selectedFromWalletId = fromWallet?.id.toString() || '';
    selectedToWalletId = '';
    amount = '';
    reference = '';
    error = '';
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  // Reset to wallet when from wallet changes
  function handleFromWalletChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedFromWalletId = target.value;
    selectedToWalletId = ''; // Reset to wallet selection
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
        <CardTitle>Transfer Between Wallets</CardTitle>
        <CardDescription>Send funds from one wallet to another</CardDescription>
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
          <Label for="fromWallet">From Wallet *</Label>
          <select
            id="fromWallet"
            class="w-full rounded border border-gray-300 px-3 py-2"
            value={selectedFromWalletId}
            onchange={handleFromWalletChange}
            disabled={isLoading}
          >
            <option value="">Select source wallet</option>
            {#each wallets as wallet}
              <option value={wallet.id}>
                {wallet.network} - {wallet.coin} ({formatBalance(
                  wallet.balance,
                  wallet.coin
                )})
              </option>
            {/each}
          </select>
          {#if getSelectedFromWallet()}
            <div class="text-sm text-gray-600">
              Available: {formatBalance(
                getAvailableBalance(),
                getSelectedFromWallet()?.coin || ''
              )}
            </div>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="toWallet">To Wallet *</Label>
          <select
            id="toWallet"
            class="w-full rounded border border-gray-300 px-3 py-2"
            value={selectedToWalletId}
            onchange={e =>
              (selectedToWalletId = (e.target as HTMLSelectElement).value)}
            disabled={isLoading || !selectedFromWalletId}
          >
            <option value="">Select destination wallet</option>
            {#each getAvailableToWallets() as wallet}
              <option value={wallet.id}>
                {wallet.network} - {wallet.coin} ({formatAddress(
                  wallet.address
                )})
              </option>
            {/each}
          </select>
          {#if getSelectedToWallet()}
            <div class="text-sm text-gray-600">
              Address: {formatAddress(getSelectedToWallet()?.address || '')}
            </div>
          {/if}
        </div>

        {#if selectedFromWalletId && selectedToWalletId}
          <div class="rounded border border-blue-200 bg-blue-50 px-4 py-3">
            <div class="text-sm text-blue-800">
              {#if areWalletsCompatible()}
                <div class="flex items-center">
                  <svg
                    class="mr-2 h-4 w-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  Wallets are compatible
                </div>
              {:else}
                <div class="flex items-center">
                  <svg
                    class="mr-2 h-4 w-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  Wallets must be on the same network and use the same coin
                </div>
              {/if}
            </div>
          </div>
        {/if}

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
          {#if getSelectedFromWallet()}
            <div class="text-sm text-gray-600">
              Maximum: {formatBalance(
                getAvailableBalance(),
                getSelectedFromWallet()?.coin || ''
              )}
            </div>
          {/if}
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
            onclick={createTransfer}
            disabled={isLoading ||
              !areWalletsCompatible() ||
              !selectedFromWalletId ||
              !selectedToWalletId ||
              !amount}
          >
            {isLoading ? 'Transferring...' : 'Transfer Funds'}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}
