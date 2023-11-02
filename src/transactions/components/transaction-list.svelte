<script lang="ts">
  import {
    BlockTitle,
    List,
    ListButton,
    ListItem,
    useStore,
  } from "framework7-svelte";
  import { formatDailyDate } from "../../utils/formatter";
  import TransactionListItem from "./transaction-list-item.svelte";
  import { renderDailyDivider } from "../../utils/functions";

  let transactions = useStore("transactions", (value) => {
    console.log("🚀 ~ file: transaction-list.svelte:16 ~ value:", value);
    return (transactions = value);
  });
</script>

<BlockTitle>Transactions</BlockTitle>
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
