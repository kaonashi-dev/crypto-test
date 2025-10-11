<script lang="ts" module>
  import { getUser } from '$lib/stores/auth.svelte';
  import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
  import CreditCardIcon from '@lucide/svelte/icons/credit-card';
  import HomeIcon from '@lucide/svelte/icons/home';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import WalletIcon from '@lucide/svelte/icons/wallet';

  const data = {
    user: {
      name: getUser()?.name || 'User',
      email: getUser()?.email || '',
      avatar: '/avatars/shadcn.jpg',
    },
    navMain: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: HomeIcon,
        isActive: true,
      },
      {
        title: 'Wallets',
        url: '/dashboard/wallets',
        icon: WalletIcon,
      },
      {
        title: 'Transactions',
        url: '/dashboard/transactions',
        icon: CreditCardIcon,
      },
      {
        title: 'Analytics',
        url: '/dashboard/analytics',
        icon: BarChart3Icon,
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: SettingsIcon,
      },
    ],
    navSecondary: [],
    projects: [],
  };
</script>

<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { logout } from '$lib/stores/auth.svelte';
  import type { ComponentProps } from 'svelte';
  import NavMain from './nav-main.svelte';
  import NavSecondary from './nav-secondary.svelte';
  import NavUser from './nav-user.svelte';

  let {
    ref = $bindable(null),
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();

  async function handleLogout() {
    await logout();
    goto('/auth/login');
  }

  function navigateTo(url: string) {
    goto(url);
  }

  function getUserInitials(name?: string, email?: string) {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  }
</script>

<Sidebar.Root
  class="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
  {...restProps}
>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props }: { props: Record<string, any> })}
            <a href="/dashboard" {...props}>
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <WalletIcon class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">Crypto Wallet</span>
                <span class="truncate text-xs">Manager</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMain items={data.navMain} />
    <NavSecondary items={data.navSecondary} class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser user={data.user} />
  </Sidebar.Footer>
</Sidebar.Root>
