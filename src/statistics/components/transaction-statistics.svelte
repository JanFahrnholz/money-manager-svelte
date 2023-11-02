<script lang="ts">
  import { BlockTitle, List, ListItem, f7ready } from "framework7-svelte";
  import { onMount } from "svelte";
  import { format } from "timeago.js";
  import Statistics from "../statistics";
  import TransactionStatistics from "../transaction-statistics";
  import Date from "../../components/date.svelte";
  import { formatMonthlyExact } from "../../utils/formatter";

  let totalAmount;
  let totalAverage;
  let firstEntry;
  let firstEntryDate;
  let lastEntry;
  let lastEntryDate;
  let type;
  let date;
  let absolute = false;
  export let transactions;

  const statistics = new TransactionStatistics(transactions);

  let formatDate = (date) => {
    console.log("date",date);
    if (!date) return "none";
    if (!absolute) return format(date);
    if (absolute) return formatMonthlyExact(date);
  };

  const refreshDate = () => {
    firstEntryDate = formatDate(firstEntry?.date);
    lastEntryDate = formatDate(lastEntry?.date);
  }

  const toggleDate = () => {
    absolute = !absolute;
    refreshDate();
  }

  const refreshStatistics = () => {
    lastEntry = statistics.getLastEntry();
    firstEntry = statistics.getFirstEntry();
    type = statistics.type;
    totalAmount = statistics.getTotalAmount()
      ? `${statistics.getTotalAmount().toFixed(2)}€`
      : "none";
    totalAverage = statistics.getAverage()
      ? `Ø ${statistics.getAverage().toFixed(2)}€`
      : "none";
    refreshDate()
    console.log("range start",Statistics.dateRangeStart, statistics.type, statistics.getDataByType());
  };

  const onDateRangeChange = (event) => {
    if (event.target.value === "all time") Statistics.setLastNDays(0);
    if (event.target.value === "last 30 days") Statistics.setLastNDays(30);
    if (event.target.value === "last 14 days") Statistics.setLastNDays(14);
    if (event.target.value === "last 7 days") Statistics.setLastNDays(7);
    refreshStatistics();
  };

  const onTypeChange = (event) => {
    statistics.type = event?.target?.value !== "" ? event?.target?.value : null;
    refreshStatistics();
  };

  onMount(() =>
    f7ready(() => {
      refreshStatistics();
    })
  );
</script>

<BlockTitle>Statistics</BlockTitle>

<List strong inset dividers>
  <ListItem
    title="date range"
    smartSelect
    smartSelectParams={{ openIn: "sheet" }}
  >
    <select on:change={onDateRangeChange} value={"all time"}>
      <option value={"all time"}>all time</option>
      <option value={"last 30 days"}>last 30 days</option>
      <option value={"last 14 days"}>last 14 days</option>
      <option value={"last 7 days"}>last 7 days</option>
    </select>
  </ListItem>
  <ListItem title="type" smartSelect smartSelectParams={{ openIn: "sheet" }}>
    <select on:change={onTypeChange} value={null}>
      <option value={null}>any</option>
      <option value={"Income"}>Income</option>
      <option value={"Expense"}>Expense</option>
      <option value={"Invoice"}>Invoice</option>
      <option value={"Refund"}>Refund</option>
    </select>
  </ListItem>
</List>
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
  <ListItem title={`sum`} after={totalAmount} />
  <ListItem title={`average`} after={totalAverage} />
</List>
