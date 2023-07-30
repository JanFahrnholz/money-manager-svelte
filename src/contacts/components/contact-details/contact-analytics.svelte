<script lang="ts">
  import { BlockTitle, List, ListItem, f7ready } from "framework7-svelte";
  import TransactionStatistics from "../../../analytics/transaction-statistics";
  import Statistics from "../../../analytics/statistics";
  import { onMount } from "svelte";
  import { formatMonthlyExact } from "../../../utils/formatter";

  let totalIncome;
  let averageIncome;
  let averageInvoice;

  export let transactions;

  const statistics = new TransactionStatistics(transactions);

  let lastInvoice = transactions.find(
    (transaction) => transaction.type === "Invoice"
  );

  lastInvoice = !lastInvoice ? "none" : formatMonthlyExact(lastInvoice.date);

  const onDateRangeChange = (event) => {
    if (event.target.value === "last 30 days") Statistics.setLastNDays(30);
    if (event.target.value === "last 14 days") Statistics.setLastNDays(14);
    if (event.target.value === "last 7 days") Statistics.setLastNDays(7);
    totalIncome = statistics.getTotalAmountByType("Income")
      ? `${statistics.getTotalAmountByType("Income").toFixed(2)}€`
      : "none";
    averageIncome = statistics.getAverageByType("Income")
      ? `Ø ${statistics.getAverageByType("Income").toFixed(2)}€`
      : "none";
    averageInvoice = statistics.getAverageByType("Invoice")
      ? `Ø ${statistics.getAverageByType("Invoice").toFixed(2)}€`
      : "none";
  };

  onMount(() =>
    f7ready(() => onDateRangeChange({ target: { value: "last 7 days" } }))
  );
</script>

<BlockTitle>Analytics</BlockTitle>

<List strong inset dividers>
  <ListItem
    title=" date range"
    smartSelect
    smartSelectParams={{ openIn: "sheet" }}
  >
    <select on:change={onDateRangeChange} value={"last 7 days"}>
      <option value={"last 30 days"}>last 30 days</option>
      <option value={"last 14 days"}>last 14 days</option>
      <option value={"last 7 days"}>last 7 days</option>
    </select>
  </ListItem>
  <ListItem title="last invoice" after={lastInvoice} />
  <ListItem title="total income" after={totalIncome} />
  <ListItem title="average income" after={averageIncome} />
  <ListItem title="average invoice" after={averageInvoice} />
</List>
