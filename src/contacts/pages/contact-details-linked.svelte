<script lang="ts">
  import {
    BlockTitle,
    List,
    ListItem,
    Navbar,
    Page,
    useStore,
  } from "framework7-svelte";
  import { formatDailyDate } from "../../utils/formatter";
  import TransactionStatistics from "../../statistics/components/transaction-statistics.svelte";

  let user = useStore("user", (v) => (user = v));

  export let contact;
  export let transactions;

  let showStatistics = user.settings?.showContactStatistics;

  if (contact.settings?.showContactStatistics !== undefined) {
    showStatistics = contact.settings?.showContactStatistics;
  }
</script>

<Page>
  <Navbar title="Linked contact details" backLink="Back" />

  <List strong inset dividers>
    <ListItem title="Name" after={contact.name} />
    <ListItem title="Owner ID" after={contact.owner} />
    <ListItem title="Balance" after={`${contact.balance}€`} />
  </List>

  {#if showStatistics}
    <TransactionStatistics disableAlltime {transactions} />
  {/if}

  <BlockTitle>Transaction history</BlockTitle>
  <List strong inset dividers>
    {#each transactions as transaction}
      <ListItem
        title={transaction.type}
        after={`${transaction.amount}€`}
        footer={formatDailyDate(transaction.date)}
      />
    {/each}
    {#if transactions.length === 0}
      <ListItem title="No transactions yet" />
    {/if}
  </List>
</Page>
