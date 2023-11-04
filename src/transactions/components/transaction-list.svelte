<script lang="ts">
  import {
    List,
    ListButton,
    ListItem,
    useStore
  } from "framework7-svelte";
  import { formatDailyDate } from "../../utils/formatter";
  import { renderDailyDivider } from "../../utils/functions";
  import TransactionListItem from "./transaction-list-item.svelte";

  let transactions = useStore("transactions", (value) => {
    return (transactions = value);
  });
</script>

<List strong inset dividers>
  <ListButton title="create transaction" href="/transactions/create/" />
  {#each transactions.items as transaction, index}
    {#if renderDailyDivider(index, transactions.items)}
      <ListItem groupTitle title={formatDailyDate(transaction.date)} />
    {/if}
    <TransactionListItem {transaction} />
  {/each}
  {#if transactions.items?.length === 0}
    <ListItem title="no items yet" />
  {/if}
</List>
