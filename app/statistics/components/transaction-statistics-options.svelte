<script lang="ts">
    import {List, ListItem, f7, f7ready} from "framework7-svelte";
    import {createEventDispatcher, onMount} from "svelte";
    import Statistics from "../statistics";
    import TransactionStatistics from "../transaction-statistics";
    import store from "../../store";
    import {getMonthStartAndEndDates} from "../../utils/functions";

    const dispatch = createEventDispatcher();

    export let transactions = [];
    export let defaultDateRange = 0;
    export let defaultType = null;
    export let disableAlltime = false;
    export let disableLoader = false;
    let dateRange = defaultDateRange;
    let type = defaultType;
    let months;
    $:  months = getMonthStartAndEndDates(transactions);
    //$: console.log(months, transactions)
    const onDateRangeChange = (event) => {
        const value = event.target.value;
        let days;

        if (isNaN(+value)) {
            Statistics.dateRangeStart = new Date(months[value].start)
            Statistics.dateRangeEnd = new Date(months[value].end)
            event.target.value = undefined;
        } else {
            days = +value;
            Statistics.setLastNDays(days);
        }

        if (!disableLoader) {
            const loader = f7.dialog.preloader("loading transaction");
            const filter = days !== 0 ? `date >= "${Statistics.dateRangeStart.toISOString()}"` : "";
            console.log("start", Statistics.dateRangeStart)
            console.log("end", Statistics.dateRangeEnd)
            loader.open();
            const action = days === 0 ? "getAllTransactions" : "getTransactions";
            store
                .dispatch(action, {filter})
                .then(() => {
                })
                .finally(() => {
                    loader.close();
                });
        }

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
            {#if !disableAlltime}
                <option value={0}>all time</option>
                <option value={365}>last year</option>
            {/if}
            <option value={365 / 2}>last 6 months</option>
            <option value={60}>last 2 month</option>
            <option value={30}>last 30 days</option>
            <option value={14}>last 14 days</option>
            <option value={7}>last 7 days</option>
            {#each Object.entries(months) as [key, month] (key)}
                <option value={key}>{month.label}</option>
            {/each}
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
