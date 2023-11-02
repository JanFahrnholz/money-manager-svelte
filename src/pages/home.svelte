<script>
  import {
    BlockTitle,
    List,
    ListItem,
    Page,
    useStore,
  } from "framework7-svelte";
  import PlannedTransactionList from "../planned-transactions/components/planned-transaction-list.svelte";
  import store from "../store";
  import TransactionList from "../transactions/components/transaction-list.svelte";

  let user = useStore(store, "user", (value) => (user = value));
</script>

<BlockTitle>Your account</BlockTitle>
<List strong inset dividers class="margin-bottom-half">
  <ListItem title="Balance" after={`${user?.balance}€`} />
  <ListItem title="Your ID" after={`${user?.id}`} />
</List>

<PlannedTransactionList />
<TransactionList />
