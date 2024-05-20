<script>
  import { AreaChart, Block, BlockTitle } from "framework7-svelte";
  import { formatDailyDate, formatMonthlyExact } from "../../utils/formatter";

  export let contact;
  export let dateRangeStart;
  export let dateRangeEnd;

  let labels = [];
  let values = [];
  let zero;

  function normalizeWithZeroLine(data) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const shift = Math.abs(min);
    const shiftedData = data.map((value) => value + shift);

    return {
      values: shiftedData,
      zeroValue: shift,
      min,
      max,
    };
  }

  function aggregateBalanceHistory(balanceHistory, startDate, endDate) {
    const dailyBalances = {},
      result = [];
    startDate =
      startDate === null ? new Date(contact.created) : new Date(startDate);

    balanceHistory.forEach((p) => {
      const dateString = new Date(p.date).toISOString().split("T")[0];
      dailyBalances[dateString] = p.balance;
    });

    let previousBalance =
      dailyBalances[startDate.toISOString().split("T")[0]] ||
      balanceHistory
        .filter((p) => new Date(p.date) < new Date(startDate))
        .at(-1)?.balance ||
      0;

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateString = d.toISOString().split("T")[0];

      if (dailyBalances.hasOwnProperty(dateString)) {
        previousBalance = dailyBalances[dateString];
      }

      result.push({
        date: dateString,
        value: previousBalance,
      });
    }
    return result;
  }
  const refreshHistory = (start, end) => {
    const data = aggregateBalanceHistory(
      contact.expand?.statistics?.balanceHistory || [],
      start,
      end
    );

    const normalized = normalizeWithZeroLine(data.map((data) => data.value));

    labels = data.map((data) => data.date);
    values = normalized.values;
    zero = normalized.zeroValue;
  };

  $: {
    refreshHistory(dateRangeStart, dateRangeEnd);
  }
</script>

<BlockTitle>Balance history</BlockTitle>
<Block inset>
  <AreaChart
    axis
    axisLabels={labels}
    toggleDatasets
    tooltip
    lineChart
    legend
    formatTooltipAxisLabel={(date) => formatMonthlyExact(date)}
    formatAxisLabel={(date) => formatDailyDate(date)}
    formatTooltipDataset={(label, value) => {
      if (label === "Balance") return value - zero;

      return 0;
    }}
    formatTooltipTotal={() => ""}
    datasets={[
      {
        label: "Balance",
        color: "#ffd600",
        values,
      },
      {
        label: "Zero",
        color: "#333",
        values: values.map(() => zero),
      },
    ]}
  />
</Block>
