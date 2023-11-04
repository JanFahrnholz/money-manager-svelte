<script>
  import {
    BlockTitle,
    List,
    ListItem,
    useStore
  } from "framework7-svelte";
  import PlannedTransactionList from "../planned-transactions/components/planned-transaction-list.svelte";
  import TransactionGauge from "../statistics/components/transaction-gauge.svelte";
  import store from "../store";
  import TransactionList from "../transactions/components/transaction-list.svelte";

  let user = useStore(store, "user", (value) => (user = value));
</script>

<BlockTitle>your account</BlockTitle>
<List strong inset dividers class="margin-bottom-half">
  <ListItem title="Balance" after={`${user?.balance}€`} />
  <ListItem title="Your ID" after={`${user?.id}`} />
</List>

<BlockTitle>transactions</BlockTitle>
<TransactionGauge />
<PlannedTransactionList />
<TransactionList />
