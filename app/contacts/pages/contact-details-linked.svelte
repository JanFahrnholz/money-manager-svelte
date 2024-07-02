<script lang="ts">
  import {
    BlockFooter,
    BlockTitle,
    List,
    ListItem,
    Navbar,
    Page,
    f7ready,
    useStore,
  } from "framework7-svelte";
  import { onMount } from "svelte";
  import TransactionStatistics from "../../statistics/components/transaction-statistics.svelte";
  import TransactionListItem from "../../transactions/components/transaction-list-item.svelte";
  import { formatDailyDate } from "../../utils/formatter";
  import { renderDailyDivider } from "../../utils/functions";
  import { ContactSettings } from "../../utils/settings";
  import ContactOptionsLinked from "../components/contact-options-linked.svelte";
  import CourierDetails from "../../components/couriers/courier-details.svelte";
  import {_} from "svelte-i18n" 

  let user = useStore("user", (v) => (user = v));

  export let contact;
  export let transactions;

  let settings;

  onMount(() =>
    f7ready(() => {
      settings = new ContactSettings(contact, contact.expand.owner);
      settings.notifyObservers(settings);
    })
  );
</script>

<Page>
  <Navbar title={$_("contact.details.linked.title")} backLink={$_("back")} />

  <BlockTitle>{$_("general")}</BlockTitle>
  <List strong inset dividers>
    <ListItem title="Name" after={contact?.linkedName || "none"} />
    <ListItem title={$_("linked-id")} after={contact.owner} />
    <ListItem title={$_("balance")} after={`${contact.balance}€`} />
  </List>
  <BlockFooter>

  </BlockFooter>

  {#if settings?.get("showStatisticsContact")}
    <TransactionStatistics
      disableLoader
      disableAlltime
      {transactions}
      {contact}
    />
  {/if}

  <ContactOptionsLinked bind:contact bind:settings />

  <BlockTitle>Transaction history</BlockTitle>
  <List strong inset dividers>
    {#each transactions as transaction, index (transaction.id)}
      {#if renderDailyDivider(index, transactions)}
        <ListItem groupTitle title={formatDailyDate(transaction.date)} />
      {/if}
      <TransactionListItem {transaction} detailed />
    {/each}
    {#if transactions.length === 0}
      <ListItem title="No transactions yet" />
    {/if}
  </List>
</Page>
