<script lang="ts">
  import { List, ListItem, f7, f7ready } from "framework7-svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import store from "../../store";
  import { getMonthStartAndEndDates } from "../../utils/functions";
  import Statistics from "../statistics";
  import TransactionStatistics from "../transaction-statistics";
  import { formatTransactionType } from "../../utils/formatter";
  import { _ } from "svelte-i18n";

  const dispatch = createEventDispatcher();

  export let transactions = [];
  export let defaultDateRange = 0;
  export let defaultType = null;
  export let disableAlltime = false;
  export let disableLoader = false;
  export let dateRangeStart = Statistics.dateRangeStart;
  export let dateRangeEnd = Statistics.dateRangeEnd;
  let dateRange = defaultDateRange;
  let type = defaultType;
  let months;
  $: months = getMonthStartAndEndDates(transactions);

  const onDateRangeChange = (event) => {
    const value = event.target.value;
    let days;

    if (isNaN(+value)) {
      Statistics.dateRangeStart = new Date(months[value].start);
      Statistics.dateRangeEnd = new Date(months[value].end);
      event.target.value = undefined;
    } else {
      days = +value;
      Statistics.setLastNDays(days);
    }

    if (disableLoader) {
      refresh();
      return;
    }
    const loader = f7.dialog.preloader("loading transactions");
    const filter =
      days !== 0 ? `date >= "${Statistics.dateRangeStart.toISOString()}"` : "";

    loader.open();
    const action = days === 0 ? "getAllTransactions" : "getTransactions";
    store
      .dispatch(action, { filter })
      .then(() => {})
      .finally(() => {
        loader.close();
      });

    refresh();
  };

  const onTypeChange = (event) => {
    TransactionStatistics.type =
      event?.target?.value !== "" ? event?.target?.value : null;
    refresh();
  };

  const refresh = () => {
    dateRange = Statistics.getLastNDays();
    type = TransactionStatistics.type;
    dateRangeStart = Statistics.dateRangeStart;
    dateRangeEnd = Statistics.dateRangeEnd;
    dispatch("refresh");
  };

  onMount(() =>
    f7ready(() => {
      Statistics.setLastNDays(defaultDateRange);
      TransactionStatistics.type = defaultType;
      refresh();
    })
  );
</script>

<List strong inset dividers>
  <ListItem
    title={$_("statistics.date-range")}
    smartSelect
    smartSelectParams={{ openIn: "sheet" }}
  >
    <select on:change={onDateRangeChange} value={dateRange}>
      {#if !disableAlltime}
        <option value={0}>all time</option>
        {/if}
      <option value={365}>last year</option>
      <option value={365 / 2}>last 6 months</option>
      <option value={60}>last 2 month</option>
      <option value={30}>last 30 days</option>
      <option value={14}>last 14 days</option>
      <option value={7}>last 7 days</option>
      {#each Object.entries(months) as [key, month] (key)}
        <option value={key}>{month?.label}</option>
      {/each}
    </select>
  </ListItem>
  <ListItem title={$_("transaction.type.title")} after={formatTransactionType($_, { type })} smartSelect smartSelectParams={{ openIn: "sheet", setValueText: false }}>
    <select on:change={onTypeChange} value={type}>
      <option value={null}>any</option>
      <option value={"Income"}>{$_("transaction.type.income")}</option>
      <option value={"Expense"}>{$_("transaction.type.expense")}</option>
      <option value={"Invoice"}>{$_("transaction.type.invoice")}</option>
      <option value={"Refund"}>{$_("transaction.type.refund")}</option>
    </select>
  </ListItem>
</List>
