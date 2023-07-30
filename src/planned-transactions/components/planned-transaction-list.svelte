<script lang="ts">
  import { BlockTitle, List, f7ready, useStore } from "framework7-svelte";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import store from "../../store";
  import PlannedTransactionListItem from "./planned-transaction-list-item.svelte";

  let plannedTransactions = useStore(
    "plannedTransactionsByContact",
    (value) => (plannedTransactions = value)
  );

  let showHelper = false;

  onMount(() =>
    f7ready(() => {
      store.dispatch("loadPlannedTransactions", {});
    })
  );
</script>

{#if plannedTransactions.length !== 0}
  <BlockTitle>Planned transactions</BlockTitle>
{/if}

<List
  accordionList
  strong
  inset
  dividers
  class="margin-bottom-half margin-top-half"
>
  {#each plannedTransactions as [contactId, transactions]}
    <PlannedTransactionListItem
      {transactions}
      on:open={() => (showHelper = true)}
      on:close={() => (showHelper = false)}
    />
  {/each}
</List>

<div style="height: 15px;">
  {#if showHelper}
    <div class="block-footer no-margin-top margin-bottom-half" transition:fade>
      Swipe to confirm or delete
    </div>
  {/if}
</div>
