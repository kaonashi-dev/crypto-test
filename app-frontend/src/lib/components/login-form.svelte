<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    class: className,
    email = $bindable(''),
    password = $bindable(''),
    onsubmit = $bindable(),
    disabled = $bindable(false),
    ...restProps
  }: HTMLAttributes<HTMLDivElement> & {
    email?: string;
    password?: string;
    onsubmit?: (event: Event) => void;
    disabled?: boolean;
  } = $props();

  const id = $props.id();
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
  <Card.Root class="border-0 shadow-2xl">
    <Card.Header class="text-center pb-8 pt-8">
      <Card.Title class="text-2xl font-bold">Welcome back</Card.Title>
      <Card.Description class="text-base mt-2"
        >Enter your credentials to access your account</Card.Description
      >
    </Card.Header>
    <Card.Content class="px-8 pb-8">
      <form {onsubmit}>
        <div class="grid gap-6">
          <div class="grid gap-3">
            <Label for="email-{id}" class="text-sm font-medium">Email</Label>
            <Input
              id="email-{id}"
              type="email"
              placeholder="m@example.com"
              bind:value={email}
              required
              {disabled}
              class="h-12 border-2 focus:border-primary transition-all duration-200"
            />
          </div>
          <div class="grid gap-3">
            <div class="flex items-center">
              <Label for="password-{id}" class="text-sm font-medium">Password</Label>
              <a
                href="##"
                class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password-{id}"
              type="password"
              bind:value={password}
              required
              {disabled}
              class="h-12 border-2 focus:border-primary transition-all duration-200"
            />
          </div>
          <Button type="submit" class="w-full h-12 text-base font-semibold mt-2 btn-gradient" {disabled}>
            {disabled ? 'Signing in...' : 'Sign In'}
          </Button>
          <div class="text-center text-sm">
            Don&apos;t have an account?
            <a href="/auth/register" class="text-primary hover:text-primary/80 font-medium transition-colors ml-1">
              Sign up
            </a>
          </div>
        </div>
      </form>
    </Card.Content>
  </Card.Root>
  <div
    class="text-muted-foreground text-center text-xs text-balance"
  >
    By clicking continue, you agree to our <a href="##" class="text-primary hover:text-primary/80 transition-colors">Terms of Service</a>
    and <a href="##" class="text-primary hover:text-primary/80 transition-colors">Privacy Policy</a>.
  </div>
</div>
