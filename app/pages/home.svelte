<script>
  import { BlockTitle, List, ListItem, useStore } from "framework7-svelte";
  import PlannedTransactionList from "../planned-transactions/components/planned-transaction-list.svelte";
  import TransactionGauge from "../statistics/components/transaction-gauge.svelte";
  import store from "../store";
  import TransactionList from "../transactions/components/transaction-list.svelte";
  import { _ } from "svelte-i18n";

  let user = useStore(store, "user", (value) => (user = value));
</script>

<BlockTitle>{$_("your.account")}</BlockTitle>
<List strong inset dividers class="margin-bottom-half">
  <ListItem title={$_("your.balance")} after={`${user?.balance}€`} />
  <ListItem title={$_("your.id")} after={`${user?.id}`} />
</List>

{#if user?.settings?.showStatisticsHomepage}
  <TransactionGauge />
{/if}
<!-- <TransactionPieChart /> -->
<PlannedTransactionList />
<TransactionList />
