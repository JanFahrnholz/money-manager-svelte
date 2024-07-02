<script lang="ts">
  import {
    AccordionContent,
    List,
    ListButton,
    ListItem,
  } from "framework7-svelte";
  import TransactionListItem from "../../transactions/components/transaction-list-item.svelte";
  import {
    formatDailyDate,
    formatTransactionType,
  } from "../../utils/formatter";
  import { renderDailyDivider } from "../../utils/functions";
  import TransactionListIcon from "../../transactions/components/transaction-list-icon.svelte";
  import { _ } from "svelte-i18n";
  import { clientId } from "../../pocketbase";

  export let courier;
  export let transactions;
  const contact = courier.expand?.contacts_via_courier[0];

  const isOwner = contact.owner === clientId;
  const isUser = contact.user === clientId;

  function calculateBonus(amount) {
    return amount * (courier?.bonusPercentage / 100);
  }
  function groupAndCalculateBonuses(transactions) {
    let groupedTransactions = [];
    let currentGroup = null;

    transactions.forEach((transaction) => {
      if (transaction.type === "Restock" || transaction.type === "Collect") {
        // Push the current group if it exists
        if (currentGroup) {
          groupedTransactions.push(currentGroup);
          currentGroup = null;
        }
        // Push the restock/collect transaction
        groupedTransactions.push({
          type: "Single",
          transaction,
        });
      } else if (transaction.type === "Income") {
        // If there's no current group, start a new one
        if (!currentGroup) {
          currentGroup = {
            type: "IncomeGroup",
            transactions: [],
            totalCount: 0,
            totalAmount: 0,
            totalBonus: 0,
            startDate: transaction.date,
            endDate: transaction.date,
          };
        }
        // Add the transaction to the current group
        currentGroup.transactions.push(transaction);
        currentGroup.totalCount++;
        currentGroup.totalAmount += transaction.amount;
        currentGroup.totalBonus = calculateBonus(currentGroup.totalAmount);
        currentGroup.endDate = transaction.date;
      }
    });

    // Push the final group if it exists
    if (currentGroup) {
      groupedTransactions.push(currentGroup);
    }

    return groupedTransactions;
  }

  $: transactions = groupAndCalculateBonuses(transactions);
</script>

<List strong inset dividers accordionList>
  <ListButton
    title={$_("transaction.create.title")}
    href={`/transactions/create/${isOwner ? `?contact=${contact.id}` : ""}`}
  />

  {#each Array.isArray(transactions) ? transactions : [] as group, index (index)}
    {#if renderDailyDivider(index, transactions)}
      <ListItem groupTitle title={formatDailyDate(group.type === "Single" ? group.transaction?.date : group.startDate)} />
    {/if}
    {#if group.type === "Single"}
      <TransactionListItem transaction={group.transaction} detailed />
    {/if}
    {#if group.type === "IncomeGroup"}
      <ListItem
        accordionItem
        title={`${group.totalCount}x ${formatTransactionType($_, { type: "Income" })}`}
        after={`${$_("total")} ${group.totalAmount}€`}
      >
        <i slot="media" class="icon">
          <TransactionListIcon transaction={{ type: "Income" }} />
        </i>
        <AccordionContent>
          <List>
            {#each group.transactions as transaction}
              <TransactionListItem {transaction} detailed />
            {/each}
          </List>
        </AccordionContent>
      </ListItem>
    {/if}
  {/each}
</List>
