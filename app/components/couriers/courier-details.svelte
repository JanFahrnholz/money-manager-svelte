<script lang="ts">
  import {
    BlockTitle,
    List,
    ListButton,
    ListItem,
    Progressbar,
  } from "framework7-svelte";
  import { _ } from "svelte-i18n";

  export let contact;
  export let transactions;
  let courier;
  let progress = 0;

  $: {
    courier = contact.expand?.courier;
    progress =
      (courier?.salesBalance /
        (courier?.inventoryBalance + courier?.salesBalance)) *
      100;

    if (isNaN(progress)) progress = 0;
    if (progress === Infinity) progress = 100;
  }
</script>

<BlockTitle>{$_("courier.details.title")}</BlockTitle>
<List strong inset class="margin-bottom-half">
  <ListItem
    title={$_("courier.inventory-balance")}
    after={`${courier?.inventoryBalance || 0}€`}
  />
  <ListItem
    title={$_("courier.sales-balance")}
    after={`${courier?.salesBalance || 0}€`}
  />
  <Progressbar {progress} />
  <ListItem title={$_("courier.progress")} after={`${progress.toFixed(2)}%`} />
</List>
<List strong inset class="no-margin-top">
  <ListButton title={$_("details")} textColor="blue" link={`/manager/${contact?.courier}/`} />
</List>
