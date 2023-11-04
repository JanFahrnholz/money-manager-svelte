<script lang="ts">
  import { List, ListItem, f7ready } from "framework7-svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import Statistics from "../statistics";
  import TransactionStatistics from "../transaction-statistics";

  const dispatch = createEventDispatcher();

  export let defaultDateRange = 0;
  export let defaultType = null;
  let dateRange = defaultDateRange;
  let type = defaultType;

  const onDateRangeChange = (event) => {
    Statistics.setLastNDays(+event.target.value);
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
    title="date range"
    smartSelect
    smartSelectParams={{ openIn: "sheet" }}
  >
    <select on:change={onDateRangeChange} value={dateRange}>
      <option value={0}>all time</option>
      <option value={30}>last 30 days</option>
      <option value={14}>last 14 days</option>
      <option value={7}>last 7 days</option>
    </select>
  </ListItem>
  <ListItem title="type" smartSelect smartSelectParams={{ openIn: "sheet" }}>
    <select on:change={onTypeChange} value={type}>
      <option value={null}>any</option>
      <option value={"Income"}>Income</option>
      <option value={"Expense"}>Expense</option>
      <option value={"Invoice"}>Invoice</option>
      <option value={"Refund"}>Refund</option>
    </select>
  </ListItem>
</List>
