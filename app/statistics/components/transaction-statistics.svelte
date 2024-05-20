<script lang="ts">
  import { BlockTitle, List, ListItem, f7ready } from "framework7-svelte";
  import { onMount } from "svelte";
  import { format } from "timeago.js";
  import { formatMonthlyExact } from "../../utils/formatter";
  import TransactionStatistics from "../transaction-statistics";
  import TransactionStatisticsOptions from "./transaction-statistics-options.svelte";
  import Statistics from "../statistics";
  import BalanceHistory from "./balance-history.svelte";

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
  export let contact = null;
  export let transactions;
  export let disableAlltime = false;
  export let disableLoader = false;

  export const statistics = new TransactionStatistics(transactions);

  let formatDate = (date) => {
    if (!date) return "none";
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
    count = statistics.getData().length
    lastEntry = statistics.getLastEntry();
    firstEntry = statistics.getFirstEntry();
    type = TransactionStatistics.type;
    totalAmount = statistics.getTotalAmount()
      ? `${statistics.getTotalAmount().toFixed(2)}€`
      : "none";
    totalAverage = statistics.getAverage()
      ? `Ø ${statistics.getAverage().toFixed(2)}€`
      : "none";
    percentage = statistics.getPercentage();
    percentage = percentage ? `${percentage.toFixed(2)}%` : "none";
    refreshDate();
  };

  onMount(() =>
    f7ready(() => {
      refreshStatistics();
    })
  );
</script>

{#if contact}
  <BalanceHistory {contact} {dateRangeStart} {dateRangeEnd} />
{/if}

<BlockTitle>Statistics</BlockTitle>

<TransactionStatisticsOptions
  {disableAlltime}
  {disableLoader}
  bind:dateRangeStart
  bind:dateRangeEnd
  defaultDateRange={7}
  on:refresh={refreshStatistics}
/>
<List strong inset dividers>
  <ListItem
    title={`first entry`}
    footer={!firstEntry ? "" : `amount ${firstEntry?.amount}€`}
    on:click={toggleDate}
  >
    <span slot="after">{firstEntryDate}</span>
  </ListItem>
  <ListItem
    title={`last entry`}
    footer={!firstEntry ? "" : `amount: ${lastEntry?.amount}€`}
    on:click={toggleDate}
  >
    <span slot="after">{lastEntryDate}</span>
  </ListItem>
  <ListItem title={`count`} after={count} />
  <ListItem title={`sum`} after={totalAmount} />
  <ListItem title={`average`} after={totalAverage} />
  {#if type !== null}
    <ListItem title={`percentage`} after={percentage} />
  {/if}
</List>
