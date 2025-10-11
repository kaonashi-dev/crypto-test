<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    id?: string;
    class?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    value?: string;
    children?: any;
    oninput?: (event: Event) => void;
    onchange?: (event: Event) => void;
    onkeydown?: (event: KeyboardEvent) => void;
    onkeyup?: (event: KeyboardEvent) => void;
    onfocus?: (event: FocusEvent) => void;
    onblur?: (event: FocusEvent) => void;
  }

  let {
    id,
    class: className,
    type = 'text',
    value = $bindable(),
    children,
    oninput,
    onchange,
    onkeydown,
    onkeyup,
    onfocus,
    onblur,
    ...restProps
  }: Props = $props();
</script>

<input
  {id}
  {type}
  bind:value
  class={cn(
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...restProps}
  {oninput}
  {onchange}
  {onkeydown}
  {onkeyup}
  {onfocus}
  {onblur}
/>
