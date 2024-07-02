<script lang="ts">
  import { BlockTitle, List, ListItem, f7ready } from "framework7-svelte";
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { format } from "timeago.js";
  import { formatMonthlyExact } from "../../utils/formatter";
  import Statistics from "../statistics";
  import TransactionStatistics from "../transaction-statistics";
  import BalanceHistory from "./balance-history.svelte";
  import TransactionStatisticsOptions from "./transaction-statistics-options.svelte";

  let dateRangeStart = Statistics.dateRangeStart;
  let dateRangeEnd = Statistics.dateRangeEnd;
  let count;
  let totalAmount;
  let totalAverage;
  let firstEntry;
  let firstEntryDate;
  let lastEntry;
  let lastEntryDate;
  let type;
  let percentage;
  let absolute = false;
  let statistics;
  export let contact = null;
  export let transactions;
  export let disableAlltime = false;
  export let disableLoader = false;

  let formatDate = (date) => {
    if (!date) return $_("none");
    if (!absolute) return format(date);
    if (absolute) return formatMonthlyExact(date);
  };

  const refreshDate = () => {
    firstEntryDate = formatDate(firstEntry?.date);
    lastEntryDate = formatDate(lastEntry?.date);
  };

  const toggleDate = () => {
    absolute = !absolute;
    refreshDate();
  };

  const refreshStatistics = () => {
    statistics = new TransactionStatistics(transactions);
    count = statistics.getCount();
    lastEntry = statistics.getLastEntry();
    firstEntry = statistics.getFirstEntry();
    type = TransactionStatistics.type;
    totalAmount = statistics.getTotalAmount()
      ? `${statistics.getTotalAmount().toFixed(2)}€`
      : $_("none");
    totalAverage = statistics.getAverage()
      ? `Ø ${statistics.getAverage().toFixed(2)}€`
      : $_("none");
    percentage = statistics.getPercentage();
    percentage = percentage ? `${percentage.toFixed(2)}%` : $_("none");
    refreshDate();
  };

  onMount(() =>
    f7ready(() => {
      refreshStatistics();
    })
  );
</script>

<BlockTitle>{$_("statistics.title")}</BlockTitle>

{#if contact}
  <BalanceHistory {contact} {dateRangeStart} {dateRangeEnd} />
{/if}
<List strong inset dividers>
  <ListItem
    title={$_("statistics.last")}
    footer={!firstEntry ? "" : `${$_("amount")}: ${lastEntry?.amount}€`}
    on:click={toggleDate}
  >
    <span slot="after">{lastEntryDate}</span>
  </ListItem>
  <ListItem title={$_("statistics.count")} after={count} />
  <ListItem title={$_("statistics.sum")} after={totalAmount} />
  <ListItem title={$_("statistics.average")} after={totalAverage} />
  {#if type !== null}
    <ListItem title={$_("statistics.percentage")} after={percentage} />
  {/if}
</List>

<TransactionStatisticsOptions
  {disableAlltime}
  {disableLoader}
  bind:dateRangeStart
  bind:dateRangeEnd
  defaultDateRange={30}
  defaultType="Income"
  on:refresh={refreshStatistics}
/>
