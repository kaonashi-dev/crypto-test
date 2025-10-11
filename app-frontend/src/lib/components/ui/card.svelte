<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: any;
    onclick?: (event: MouseEvent) => void;
  }

  let { class: className, children, onclick, ...restProps }: Props = $props();
</script>

<div
  class={cn(
    'bg-card text-card-foreground rounded-lg border shadow-sm',
    className
  )}
  {...restProps}
  {onclick}
>
  {@render children?.()}
</div>
