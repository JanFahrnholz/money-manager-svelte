<script lang="ts">
  import { BlockTitle, List, f7ready, useStore } from "framework7-svelte";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import store from "../../store";
  import PlannedTransactionListItem from "./planned-transaction-list-item.svelte";
  import { _ } from "svelte-i18n";

  let plannedTransactions = useStore(
    "plannedTransactionsByContact",
    (value) => (plannedTransactions = value)
  );

  let showHelper = false;

  onMount(() =>
    f7ready(() => {
      store.dispatch("getPlannedTransactions", {});
    })
  );
</script>

{#if plannedTransactions.length !== 0}
  <BlockTitle>{$_("planned-transaction.title")}</BlockTitle>
  <List
    accordionList
    strong
    inset
    dividers
    class="no-margin-bottom margin-top-half"
  >
    {#each plannedTransactions as [contactId, transactions] (`planned-transaction-${contactId}`)}
      <PlannedTransactionListItem
        {transactions}
        on:open={() => (showHelper = true)}
        on:close={() => (showHelper = false)}
      />
    {/each}
  </List>

  <div style="height: 15px;">
    {#if showHelper}
      <div class="block-footer no-margin-top no-margin-bottom" transition:fade>
        {$_("planned-transaction.confirm.helper")}
      </div>
    {/if}
  </div>
{/if}
