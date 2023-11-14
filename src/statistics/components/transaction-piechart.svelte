<script>
  import { Block, Gauge, f7, useStore, PieChart } from "framework7-svelte";
  import TransactionStatistics from "../transaction-statistics";
  import TransactionStatisticsOptions from "./transaction-statistics-options.svelte";
  import { types } from "../../transactions/types/transaction-type";
  import {
    isExpense,
    isIncome,
    isInvoice,
    isRefund,
  } from "../../utils/transactions";
  let percentage;
  let type;
  let total;
  let statistics;
  let datasets = [];
  let transactions = useStore("transactions", (value) => {
    statistics = new TransactionStatistics(value);
    transactions = value;
    refresh();
  });

  const getColor = (type) => {
    let color = "#ffd600";
    if (isExpense({ type })) color = "#ff3b30";
    if (isIncome({ type }) || isRefund({ type })) color = "#4cd964";
    return color;
  };

  const refresh = () => {
    if (!statistics) return;
    datasets = [];
    types.forEach((type) => {
      datasets.push({
        label: type,
        value: statistics.getPercentage(type),
        color: getColor(type),
      });
    });

    percentage = statistics.getPercentage();
    percentage = percentage ? `${percentage.toFixed(2)}%` : "0%";
    total = statistics.getTotalAmount();
    type = TransactionStatistics.type;
  };
</script>

<Block class="text-align-center">
  <PieChart
    size={100}
    tooltip
    {datasets}
  />
</Block>
<TransactionStatisticsOptions
  defaultDateRange={30}
  defaultType="Income"
  on:refresh={refresh}
/>
