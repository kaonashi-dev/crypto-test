<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: any;
  }

  let { class: className, children, ...restProps }: Props = $props();
</script>

<p class={cn('text-muted-foreground text-sm', className)} {...restProps}>
  {@render children?.()}
</p>
