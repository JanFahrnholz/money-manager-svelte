<script>
    import {Block, Gauge, f7, useStore, ListItem, List} from "framework7-svelte";
    import TransactionStatistics from "../transaction-statistics";
    import TransactionStatisticsOptions from "./transaction-statistics-options.svelte";

    let percentage;
    let percentageText;
    let expenseIncomeDiff = 0;
    let invoiceRefundDiff = 0;
    let combinedDiff = 0;
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

        expenseIncomeDiff = statistics.getIncomeExpenseDifference().toFixed(2);
        if (expenseIncomeDiff > 0) expenseIncomeDiff = "+" + expenseIncomeDiff;
        expenseIncomeDiff += "€"

        invoiceRefundDiff = statistics.getRefundInvoiceDifference().toFixed(2);
        if (invoiceRefundDiff > 0) invoiceRefundDiff = "+" + invoiceRefundDiff;
        invoiceRefundDiff += "€"

        combinedDiff = statistics.getCombinedDifference().toFixed(2);
        combinedDiff += "€"
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
<List strong inset outline>
    <ListItem title="expense / income difference" after={expenseIncomeDiff}/>
    <ListItem title="invoice / refund difference" after={invoiceRefundDiff}/>
    <ListItem title="profit" after={combinedDiff}/>
</List>
<TransactionStatisticsOptions
        {transactions}
        defaultDateRange={30}
        defaultType="Income"
        on:refresh={refresh}
/>
