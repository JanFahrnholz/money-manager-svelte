<script lang="ts">
  import {
    Icon,
    Link,
    List,
    Popover
  } from "framework7-svelte";

  export let key;
  export let disablePadding = false;

  key = key ? key += "-popover" : "info-popover";

 const padding = disablePadding ? "" : "padding: .5rem;";
</script>

<Link popoverOpen={"." + key}>
  <Icon size={18} ios="f7:info_circle_fill" md="material:info_outline" />
</Link>

<Popover class={key}>
  <div style={padding}>
    <slot />
  </div>
</Popover>
