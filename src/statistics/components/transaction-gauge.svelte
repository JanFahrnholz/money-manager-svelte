<script>
  import { Block, Gauge, f7, useStore } from "framework7-svelte";
  import TransactionStatistics from "../transaction-statistics";
  import TransactionStatisticsOptions from "./transaction-statistics-options.svelte";
  let percentage;
  let type;
  let total;
  let statistics;
  let transactions = useStore("transactions", (value) => {
    statistics = new TransactionStatistics(value.items);
    transactions = value;
    refresh();
  });

  const refresh = () => {
    if (!statistics) return;

    percentage = statistics.getPercentage();
    percentage = percentage ? `${percentage.toFixed(2)}%` : "0%"
    total = statistics.getTotalAmount();
    type = TransactionStatistics.type;
  };
</script>

<Block class="text-align-center">
  <Gauge
    type="circle"
    value={percentage / 100}
    size={200}
    borderWidth={10}
    borderBgColor={f7.colors.primary}
    valueText={percentage}
    valueFontSize={41}
    valueTextColor={f7.colors.primary}
    labelText={`total of ${total || "0"}€`}
  />
</Block>
<TransactionStatisticsOptions
  defaultDateRange={30}
  defaultType="Income"
  on:refresh={refresh}
/>
