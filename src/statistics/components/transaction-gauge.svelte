<script>
  import { Block, Gauge, f7, useStore } from "framework7-svelte";
  import TransactionStatistics from "../transaction-statistics";
  import TransactionStatisticsOptions from "./transaction-statistics-options.svelte";
  let percentage;
  let percentageText;
  let type;
  let total;
  let avg;
  let statistics;
  let transactions = useStore("transactions", (value) => {
    statistics = new TransactionStatistics(value);
    transactions = value;
    refresh();
  });

  const refresh = () => {
    if (!statistics) return;

    percentage = statistics.getPercentage();
    percentageText = percentage ? `${percentage.toFixed(2)}%` : "0%"
    total = statistics.getTotalAmount();
    avg = statistics.getAverage();
    type = TransactionStatistics.type;
  };
</script>

<Block class="text-align-center">
  <Gauge
    type="circle"
    value={percentage / 100}
    size={170}
    borderWidth={10}
    borderColor={f7.colors.primary}
    valueText={percentageText}
    valueFontSize={30}
    valueTextColor={f7.colors.primary}
    labelText={`total ${total || "0"}€`}
  />
</Block>
<TransactionStatisticsOptions
  defaultDateRange={30}
  defaultType="Income"
  on:refresh={refresh}
/>
