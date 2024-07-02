<script lang="ts">
  import {
    BlockFooter,
    BlockTitle,
    List,
    ListButton,
    ListItem,
    Navbar,
    Page,
    f7ready,
    useStore,
  } from "framework7-svelte";
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import CourierDetails from "../../components/couriers/courier-details.svelte";
  import TransactionStatistics from "../../statistics/components/transaction-statistics.svelte";
  import TransactionListItem from "../../transactions/components/transaction-list-item.svelte";
  import {
    formatDailyDate,
    formatMonthlyExact
  } from "../../utils/formatter";
  import { renderDailyDivider } from "../../utils/functions";
  import { ContactSettings } from "../../utils/settings";
  import ContactOptions from "../components/contact-options.svelte";

  let user = useStore("user", (v) => {
    user = v;
  });

  export let contact;
  export let transactions;
  let settings;
  let showStatistics;

  const onUpdate = (settings) => {
    const value = settings.get("showStatisticsContact") ? "Yes" : "No";

    showStatistics = settings.isDefault("showStatisticsContact")
      ? $_("settings.defaultDisplayText", {
          values: { value },
        })
      : value;
  };

  onMount(() =>
    f7ready(() => {
      settings = new ContactSettings(contact, user);
      settings.addObserver(onUpdate);
      settings.notifyObservers(settings);
    })
  );

  const copyPopover = () => {};
</script>

<Page>
  <Navbar title={$_("contact.details.title")} backLink={$_("back")} />

  <BlockTitle>{$_("general")}</BlockTitle>
  <List strong inset dividers>
    <ListItem title="Name" after={contact.name} />
    <ListItem title={$_("linked-id")} after={contact.user === "" ? $_("none") : contact.user} />
    <ListItem title={$_("balance")} after={`${contact.balance}€`} />
    {#if contact.user !== ""}
      <ListItem title={$_("statistics.show")} after={showStatistics} />
    {/if}
  </List>
  <BlockFooter class="margin-bottom-half"
    >{$_("created")} {formatMonthlyExact(contact.created)}</BlockFooter
  >

  {#if contact.courier}
    <CourierDetails {contact} {transactions} />
  {/if}

  <TransactionStatistics {transactions} {contact} disableLoader />

  <ContactOptions bind:contact bind:settings />

  <BlockTitle>{$_("transaction.history")} - {transactions.length}</BlockTitle>
  <List strong inset dividers>
    <ListButton
      title={$_("transaction.create.title")}
      href={`/transactions/create/?contact=${contact.id}`}
    />
    {#each transactions as transaction, index (transaction.id)}
      {#if renderDailyDivider(index, transactions)}
        <ListItem groupTitle title={formatDailyDate(transaction.date)} />
      {/if}
      <TransactionListItem {transaction} detailed />
    {/each}
    {#if transactions.length === 0}
      <ListItem title={$_("none-yet")} />
    {/if}
  </List>
</Page>
