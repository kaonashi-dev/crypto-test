<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
  } from '$lib/components/ui/sidebar';
  import { getUser, logout } from '$lib/stores/auth.svelte';
  import {
    BarChart3,
    CreditCard,
    Home,
    LogOut,
    Settings,
    Wallet,
  } from '@lucide/svelte';

  const navigationItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
    },
    {
      title: 'Wallets',
      url: '/dashboard/wallets',
      icon: Wallet,
    },
    {
      title: 'Transactions',
      url: '/dashboard/transactions',
      icon: CreditCard,
    },
    {
      title: 'Analytics',
      url: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: Settings,
    },
  ];

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

<SidebarProvider>
  <Sidebar variant="inset" collapsible="icon">
    <SidebarHeader>
      <div class="flex items-center gap-2 px-4 py-2">
        <div
          class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg"
        >
          <Wallet class="h-4 w-4" />
        </div>
        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-semibold">Crypto Wallet</span>
          <span class="truncate text-xs">Manager</span>
        </div>
      </div>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {#each navigationItems as item}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onclick={() => navigateTo(item.url)}
                  class={$page.url.pathname === item.url
                    ? 'bg-accent text-accent-foreground'
                    : ''}
                  title={item.title}
                >
                  {@const IconComponent = item.icon}
                  <IconComponent class="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            {/each}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <div class="flex items-center gap-2 px-4 py-2">
        <Avatar class="h-8 w-8">
          <AvatarImage src="" alt="User avatar" />
          <AvatarFallback class="text-xs">
            {getUserInitials(getUser()?.name, getUser()?.email)}
          </AvatarFallback>
        </Avatar>
        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-semibold">
            {getUser()?.name || 'User'}
          </span>
          <span class="text-muted-foreground truncate text-xs">
            {getUser()?.email || ''}
          </span>
        </div>
        <Button variant="ghost" size="sm" onclick={handleLogout} title="Logout">
          <LogOut class="h-4 w-4" />
        </Button>
      </div>
    </SidebarFooter>
  </Sidebar>
</SidebarProvider>
