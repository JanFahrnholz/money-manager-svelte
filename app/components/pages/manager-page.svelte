<script lang="ts">
  import {
    BlockFooter,
    BlockTitle,
    List,
    ListItem,
    Navbar,
    Page,
    Progressbar,
  } from "framework7-svelte";
  import { _ } from "svelte-i18n";
  import CourierTransactions from "../couriers/courier-transactions.svelte";

  export let courier;
  export let transactions;
  const contact = courier.expand?.contacts_via_courier[0];
  let progress = 0;
  let name = contact.linkedName ? contact.linkedName : contact.owner;

  $: {
    progress =
      (courier?.salesBalance /
        (courier?.inventoryBalance + courier?.salesBalance)) *
      100;

    if (isNaN(progress)) progress = 0;
    if (progress === Infinity) progress = 100;
  }
</script>

<Page>
  <Navbar title={$_("page.manager.title")} backLink={$_("back")} />

  <List strong inset>
    <ListItem title="Manager" after={name} />
  </List>
  <BlockFooter>{$_("page.manager.helper-1")}</BlockFooter>

  <List strong inset dividers>
    <ListItem
      title={$_("page.manager.inventory")}
      after={`${courier?.inventoryBalance || 0}€`}
    />
    <ListItem
      title={$_("page.manager.sales")}
      after={`${courier?.salesBalance || 0}€`}
    />
    <Progressbar {progress} />
    <ListItem
      title={$_("courier.progress")}
      after={`${progress.toFixed(2)}%`}
    />
  </List>
  <BlockFooter>{$_("page.manager.helper-2")}</BlockFooter>

  <List strong inset dividers>
    <ListItem
      title={$_("page.manager.bonus.balance")}
      after={`${courier?.bonusBalance}€`}
    ></ListItem>
    <ListItem
      title={$_("page.manager.bonus.current")}
      after={`${courier?.bonusPercentage}%`}
    ></ListItem>
  </List>
  <BlockFooter
    >{$_("page.manager.helper-bonus", {
      values: { percentage: courier?.bonusPercentage },
    })}</BlockFooter
  >

  <BlockTitle>{$_("transactions")} - {transactions.length}</BlockTitle>
  <CourierTransactions {courier} {transactions} />
</Page>
