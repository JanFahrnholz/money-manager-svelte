<script lang="ts">
    import {
      Block,
      Icon,
      Link,
      List,
      Popover
    } from "framework7-svelte";
  
    export let disablePadding = false;
    export let content;
    let open = false;

  
   const padding = disablePadding ? "" : "padding: .5rem;";

   const copy = () => {

   }
  </script>
  

    <slot />
<Popover opened={open} verticalPosition="top">
      Copy
</Popover>
  
  