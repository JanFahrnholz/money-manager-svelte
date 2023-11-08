<script lang="ts">
  import {
    BlockTitle,
    List,
    ListButton,
    ListItem,
    Navbar,
    Page,
    f7,
    useStore,
  } from "framework7-svelte";
  import TransactionStatistics from "../../statistics/components/transaction-statistics.svelte";
  import store from "../../store";
  import TransactionListIcon from "../../transactions/components/transaction-list-icon.svelte";
  import { formatDailyDate, formatTime } from "../../utils/formatter";
  import { renderDailyDivider } from "../../utils/functions";

  let user = useStore("user", (v) => (user = v));

  export let contact;
  export let transactions;
  export let f7router;

  const deleteContact = () => {
    f7.dialog.confirm(
      `All transactions for this contact will be deleted as well`,
      `Are you sure?`,
      () => {
        store.dispatch("deleteContact", contact.id).then(() => f7router.back());
      }
    );
  };

  const makeCourier = () => {};
  const removeLink = () => {
    f7.dialog
      .confirm(
        "The user won't be able to see their transactions anymore.",
        () => {
          store
            .dispatch("updateContact", {
              ...contact,
              user: "",
            })
            .then((updated) => (contact = updated));
        }
      )
      .setTitle("Are you sure?");
  };
  const addLink = () => {
    f7.dialog.prompt("Add user id", (user) => {
      if (user === "") return;
      store
        .dispatch("updateContact", {
          ...contact,
          user,
        })
        .then((updated) => (contact = updated));
    });
  };
</script>

<Page>
  <Navbar title="Contact details" backLink="Back" />

  <BlockTitle>General</BlockTitle>
  <List strong inset dividers>
    <ListItem title="Name" after={contact.name} />
    <ListItem title="ID" after={contact.user === "" ? "none" : contact.user} />
    <ListItem title="Balance" after={`${contact.balance}€`} />
  </List>

  <TransactionStatistics {transactions} />

  <BlockTitle>Options</BlockTitle>
  <List strong inset dividers>
    <ListButton on:click={makeCourier} title="make courier" color="blue" />
    {#if contact.user === ""}
      <ListButton on:click={addLink} title="link user id" color="blue" />
    {:else}
      <ListButton on:click={removeLink} title="remove link" color="red" />
    {/if}
    <ListButton on:click={deleteContact} title="delete contact" color="red" />
  </List>

  <BlockTitle>Transaction history</BlockTitle>
  <List strong inset dividers>
    <ListButton title="new transaction" href="/transactions/create/" />
    {#each transactions as transaction, index}
      {#if renderDailyDivider(index, transactions)}
        <ListItem groupTitle title={formatDailyDate(transaction.date)} />
      {/if}
      <ListItem
        title={transaction.type}
        after={`${transaction.amount}€`}
        footer={formatTime(transaction.date)}
      >
        <i slot="media" class="icon">
          <TransactionListIcon {transaction} />
        </i>
      </ListItem>
    {/each}
    {#if transactions.length === 0}
      <ListItem title="No transactions yet" />
    {/if}
  </List>
</Page>
