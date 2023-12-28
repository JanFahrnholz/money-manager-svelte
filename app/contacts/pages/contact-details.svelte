<script lang="ts">
  import {
    Block,
    BlockTitle,
    List,
    ListButton,
    ListItem,
    Navbar,
    Page,
    Popover,
    useStore,
  } from "framework7-svelte";
  import TransactionStatistics from "../../statistics/components/transaction-statistics.svelte";
  import TransactionListIcon from "../../transactions/components/transaction-list-icon.svelte";
  import { formatDailyDate, formatTime } from "../../utils/formatter";
  import { renderDailyDivider } from "../../utils/functions";
  import ContactOptions from "../components/contact-options.svelte";
  import CopyPopover from "../../components/copy-popover.svelte";

  let user = useStore("user", (v) => {
    user = v
  });

  export let contact;
  export let transactions;
  let settings;
  let popover;

  let showStatistics;
  let showStatisticsText;
  $: {
    showStatistics = user.settings?.showContactStatistics;
    if (settings?.showContactStatistics === "default") {
      showStatisticsText = `Default (${showStatistics ? "Yes" : "No"})`;
    } else {
      showStatistics = settings?.showContactStatistics;
      showStatisticsText = showStatistics ? "Yes" : "No";
    }
  }

  const copyPopover = () =>{}
</script>

<Page>
  <Navbar title="Contact details" backLink="Back" />

  <BlockTitle>General</BlockTitle>
  <List strong inset dividers>
    <ListItem title="Name" after={contact.name} />
      <ListItem
      title="ID"
      after={contact.user === "" ? "none" : contact.user}
      />
    <ListItem title="Balance" after={`${contact.balance}€`} />
    {#if contact.user !== ""}
      <ListItem title="Show statistics" after={showStatisticsText} />
    {/if}
    {#if contact.courier}
      <ListItem title="Courier" after={contact.courier ? "Yes" : "No"} />
    {/if}
  </List>

  <TransactionStatistics {transactions} disableLoader />

  <ContactOptions bind:contact bind:settings />

  <BlockTitle>Transaction history</BlockTitle>
  <List strong inset dividers>
    <ListButton title="new transaction" href={`/transactions/create/?contact=${contact.id}`} />
    {#each transactions as transaction, index (transaction.id)}
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
