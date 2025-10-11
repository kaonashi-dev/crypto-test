<script lang="ts">
  import { goto } from '$app/navigation';
  import { initializeAuth, getIsAuthenticated } from '$lib/stores/auth.svelte';
  import { onMount } from 'svelte';

  onMount(async () => {
    await initializeAuth();
    if (getIsAuthenticated()) {
      goto('/dashboard/wallets');
    } else {
      goto('/auth/login');
    }
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="text-center">
    <div
      class="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"
    ></div>
    <p class="mt-4 text-gray-600">Loading Crypto Wallet Manager...</p>
  </div>
</div>
