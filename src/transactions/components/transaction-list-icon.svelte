<script lang="ts">
  import { Icon } from "framework7-svelte";

  export let transaction;

  let icon = "currency_exchange";
  let iconColor = "primary";

  if (transaction.type === "Income" || transaction.type === "Refund")
    iconColor = "green";

  if (transaction.type === "Expense" || transaction.type === "Invoice")
    iconColor = "red";

  switch (transaction.type) {
    case "Income":
      icon = "add";
      break;
    case "Expense":
      icon = "remove";
      break;
    case "Invoice":
      icon = "person_remove";
      break;
    case "Refund":
      icon = "person_add";
      break;
  }
</script>

<Icon material={icon} color={iconColor} />
