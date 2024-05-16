<script>
  import { AreaChart, Block } from "framework7-svelte";
  import { format } from "timeago.js";
  import { formatMonthlyExact } from "../../utils/formatter";
  import Statistics from "../statistics";

  export let contact;

  function generateChartLabelsAndData(data, startDate, endDate, numLabels) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    data = data.filter(
      (d) => new Date(d.date) >= start && new Date(d.date) <= end
    );

    let labels = data.map((v, i, arr) => {
      const value = new Date(v.date);
      if (i === 0) return value;

      if (arr[i - 1] === value) return "";

      return value;
    });

    const values = data.map((v) => v.balance);
    console.log(start, end);

    return { labels, values };
  }

  let labels = [],
    values = [];
  $: {
    const res = generateChartLabelsAndData(
      contact.statistics.balanceHistory,
      Statistics.dateRangeStart,
      Statistics.dateRangeEnd,
      10
    );
    labels = res.labels;
    values = res.values;
  }
</script>

<Block inset>
  <AreaChart
    axis
    axisLabels={labels}
    toggleDatasets
    tooltip
    lineChart
    legend
    formatTooltipAxisLabel={(date) => formatMonthlyExact(date)}
    formatAxisLabel={(date) => format(date)}
    datasets={[
      {
        label: "Balance",
        color: "#ffd600",
        values,
      },
    ]}
  />
</Block>
