<script lang="ts">
  import { Icon } from "framework7-svelte";
  import {
    isExpense,
    isIncome,
    isInvoice,
    isRefund,
  } from "../../utils/transactions";

  export let transaction;

  let icon = "currency_exchange";
  let iconColor = "primary";

  if (isIncome(transaction) || isRefund(transaction) || transaction.type === "Collect") iconColor = "green";
  if (isExpense(transaction) || isInvoice(transaction) || transaction.type === "Restock") iconColor = "red";

  if (isIncome(transaction)) icon = "add";
  if (isExpense(transaction)) icon = "remove";
  if (isInvoice(transaction)) icon = "person_remove";
  if (isRefund(transaction)) icon = "person_add";
  if (transaction.type === "Restock") icon = "local_shipping";
  if (transaction.type === "Collect") icon = "savings";
</script>

<Icon material={icon} color={iconColor} />
