<script lang="ts">
  import {
    BlockFooter,
    BlockTitle,
    List,
    ListItem,
    Navbar,
    Page,
    Progressbar,
    f7,
  } from "framework7-svelte";
  import { _ } from "svelte-i18n";
  import { client } from "../../pocketbase";
  import { ApiError } from "../../utils/errors";
  import CourierTransactions from "../couriers/courier-transactions.svelte";

  export let courier;
  export let transactions;
  const contact = courier.expand?.contacts_via_courier[0];
  let progress = 0;

  $: {
    progress =
      (courier?.salesBalance /
        (courier?.inventoryBalance + courier?.salesBalance)) *
      100;

    if (isNaN(progress)) progress = 0;
    if (progress === Infinity) progress = 100;
  }

  const editBonusPercentage = () => {
    f7.dialog.prompt("enter percentage", null, async (value) => {
      await client
        .collection("couriers")
        .update(courier.id, {
          bonusPercentage: +value,
        })
        .catch((e) => new ApiError(e).dialog())
        .then(() => {});
    });
  };
</script>

<Page>
  <Navbar title={$_("page.courier.title")} backLink={$_("back")} />

  <List strong inset>
    <ListItem title={$_("page.courier.name")} after={contact.name} />
  </List>
  <BlockFooter>{$_("page.courier.helper-1")}</BlockFooter>

  <List strong inset dividers>
    <ListItem
      title={$_("page.courier.inventory")}
      after={`${courier?.inventoryBalance || 0}€`}
    />
    <ListItem
      title={$_("page.courier.sales")}
      after={`${courier?.salesBalance || 0}€`}
    />
    <Progressbar {progress} />
    <ListItem
      title={$_("courier.progress")}
      after={`${progress.toFixed(2)}%`}
    />
  </List>
  <BlockFooter>{$_("page.courier.helper-2")}</BlockFooter>

  <List strong inset dividers>
    <ListItem
      title={$_("page.manager.bonus.balance")}
      after={`${courier?.bonusBalance}€`}
    ></ListItem>
    <ListItem
      link="#"
      title={$_("page.manager.bonus.current")}
      after={`${courier?.bonusPercentage}%`}
      onClick={editBonusPercentage}
    ></ListItem>
  </List>
  <BlockFooter
    >{$_("page.courier.helper-bonus", {
      values: { percentage: courier?.bonusPercentage },
    })}</BlockFooter
  >

  <BlockTitle>{$_("transactions")} - {transactions.length}</BlockTitle>
  <CourierTransactions {courier} {transactions} />
</Page>
