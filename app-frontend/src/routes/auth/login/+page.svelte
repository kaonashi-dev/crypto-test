<script lang="ts">
  import { goto } from '$app/navigation';
  import LoginForm from '$lib/components/login-form.svelte';
  import { getIsLoading, login } from '$lib/stores/auth.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state('');

  async function handleLogin() {
    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }

    try {
      error = '';
      await login(email, password);
      goto('/dashboard/wallets');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed';
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }

  function handleFormSubmit(event: Event) {
    event.preventDefault();
    handleLogin();
  }
</script>

<svelte:head>
  <title>Login - Crypto Wallet Manager</title>
</svelte:head>

<div
  class="gradient-bg-animated flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden"
>
  <!-- Decorative elements -->
  <div class="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
  <div class="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>

  <div class="w-full max-w-md space-y-8 relative z-10">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-2">
        <span class="gradient-text">Crypto Wallet Manager</span>
      </h1>
      <p class="text-muted-foreground mt-3 text-base">Sign in to your account</p>
    </div>

    {#if error}
      <div
        class="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-300"
      >
        {error}
      </div>
    {/if}

    <div class="glass-effect rounded-2xl p-1">
      <LoginForm
        bind:email
        bind:password
        onsubmit={handleFormSubmit}
        disabled={getIsLoading()}
      />
    </div>
  </div>
</div>
