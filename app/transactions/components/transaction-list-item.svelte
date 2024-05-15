<script lang="ts">
  import {
    Icon,
    ListItem,
    SwipeoutActions,
    SwipeoutButton,
  } from "framework7-svelte";
  import store from "../../store";
  import TransactionListIcon from "./transaction-list-icon.svelte";

  export let transaction;

  const contact = transaction.expand.contact;

  const deleteTransaction = (done) => {
    store.dispatch("deleteTransaction", transaction);
  };
</script>

<ListItem
  title={`${transaction.amount}€`}
  after={contact.name}
  link={`/contacts/${contact.id}/`}
  footer={transaction.type}
  swipeout
  onSwipeoutDelete={deleteTransaction}
>
  <i slot="media" class="icon">
    <TransactionListIcon {transaction} />
  </i>
  <SwipeoutActions left>
    <SwipeoutButton
      delete
      overswipe
      confirmText={`Are you sure you want to delete this transaction? Contact balance will be reverted from`}
      >Delete</SwipeoutButton
    >
  </SwipeoutActions>
</ListItem>
