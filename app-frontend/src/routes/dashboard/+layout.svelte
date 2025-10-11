<script lang="ts">
  import { goto } from '$app/navigation';
  import SiteHeader from '$lib/components/site-header.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { getIsAuthenticated, initializeAuth } from '$lib/stores/auth.svelte';
  import { onMount } from 'svelte';
  import DashboardSidebar from '../../lib/components/dashboard-sidebar.svelte';

  onMount(async () => {
    await initializeAuth();
    if (!getIsAuthenticated()) {
      goto('/auth/login');
    }
  });
</script>

<svelte:head>
  <title>Dashboard - Crypto Wallet Manager</title>
</svelte:head>

{#if getIsAuthenticated()}
  <div class="[--header-height:calc(--spacing(14))]">
    <Sidebar.Provider class="flex flex-col">
      <SiteHeader />
      <div class="flex flex-1">
        <DashboardSidebar />
        <Sidebar.Inset>
          <div class="flex flex-1 flex-col gap-4 p-4">
            <slot />

            <!-- <div class="grid auto-rows-min gap-4 md:grid-cols-3">
              <div class="bg-muted/50 aspect-video rounded-xl"></div>
              <div class="bg-muted/50 aspect-video rounded-xl"></div>
              <div class="bg-muted/50 aspect-video rounded-xl"></div>
            </div>
            <div
              class="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min"
            ></div> -->
          </div>
        </Sidebar.Inset>
      </div>
    </Sidebar.Provider>
  </div>

  <!-- <div class="dashboard-layout">
    <DashboardSidebar />
    <SidebarInset class="dashboard-content">
      <header
        class="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4"
      >
        <SidebarTrigger class="-ml-1" />
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-semibold">Dashboard</h1>
        </div>
      </header>
      <main class="dashboard-main">
        <slot />
      </main>
    </SidebarInset>
  </div> -->
{:else}
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <div
        class="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"
      ></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
{/if}
