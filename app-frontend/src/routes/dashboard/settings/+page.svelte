<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
</script>

<svelte:head>
  <title>Settings - Crypto Wallet Manager</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold tracking-tight">Settings</h2>
    <p class="text-muted-foreground">
      Manage your account and application preferences
    </p>
  </div>

  <div class="grid gap-4">
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage your account information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="text-center py-6">
          <p class="text-muted-foreground">Settings coming soon</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Manage your security settings and authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="text-center py-6">
          <p class="text-muted-foreground">Security settings coming soon</p>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
