<script lang="ts">
  import { f7, ListItem } from "framework7-svelte";
  import { _ } from "svelte-i18n";
  import { clientId } from "../../pocketbase";
  import store, { mainRouter } from "../../store";
  import { formatTime, formatTransactionType } from "../../utils/formatter";
  import TransactionListIcon from "./transaction-list-icon.svelte";

  export let transaction;
  export let detailed = false;

  const contact = transaction.expand?.contact;
  const courier = transaction.expand?.courier;
  const manager = courier?.expand?.contacts_via_courier?.at(0);
  let after = contact?.name;
  let isOwner = clientId === contact?.owner;
  let isUser = clientId === contact?.user;
  let isCourier = clientId === courier?.user;
  let title = `${transaction.amount}€ ${formatTransactionType($_, transaction)}`;
  let footer = formatTime(transaction.date);
  const ownerName = (isCourier ? manager : contact)?.linkedName
    ? (isCourier ? manager : contact)?.linkedName
    : contact?.owner;

  if (detailed) {
    after = `${transaction.amount}€`;
    //footer = formatTime(transaction.date)
  }

  let helper = `${transaction.amount.toFixed(2)}€ ${formatTransactionType($_, transaction, true)}`;
  if (isUser && !detailed) {
    after = $_("you");
    footer += `, ${$_("from")} ${ownerName}`;
    helper = `${helper} ${$_("at-you")} ${$_("from")} ${ownerName}`;
  }

  if (isCourier) {
    footer += `, ${$_("for")} ${ownerName}`;
    helper = `${helper} ${$_("at")} ${contact?.name} ${$_("for")} ${ownerName} `;
  }

  if (isOwner) {
    helper = `${helper} ${$_("at")} ${contact?.name}`;
  }

  if (isOwner && courier) {
    footer += `, ${$_("from")} ${manager?.name}`;
    helper = `${helper} ${$_("from")} ${manager?.name}`;
  }

  const deleteTransaction = () => {
    store.dispatch("deleteTransaction", transaction);
  };

  const buttons: any = [
    [
      {
        text: helper,
        label: true,
        strong: true,
      },
    ],
  ];

  if (transaction?.info)
    buttons[0].push({
      text: `Info: ${transaction.info}`,
      label: true,
    });

  if (isOwner || isUser)
    buttons[0].push({
      text: isOwner ? $_("transaction.actions.contact-details") : $_("contact.details.linked.title"),
      color: "blue",
      onClick: () => $mainRouter.navigate(`/contacts/${contact?.id}/`),
    });


  if (courier) {
    buttons[0].push({
      text: !isOwner ? $_("transaction.actions.manager-details") : $_("transaction.actions.courier-details"),
      color: "blue",
      onClick: () => $mainRouter.navigate(`/manager/${courier?.id}/`),
    });
  }
  if (contact?.courier) {
    buttons[0].push({
      text: !isOwner ? $_("transaction.actions.manager-details") : $_("transaction.actions.courier-details"),
      color: "blue",
      onClick: () => $mainRouter.navigate(`/manager/${contact?.courier}/`),
    });
  }

  if (isOwner || isCourier) {
    buttons.push([
      {
        text: $_("transaction.actions.delete.title"),
        color: "red",
        onClick: () => {
          f7.dialog.confirm(
            $_("transaction.actions.delete.confirm"),
            $_("transaction.actions.delete.title"),
            deleteTransaction
          );
        },
      },
    ]);
  }

  
  const onClick = () => {
    const actions = f7.actions.create({
      buttons,
    });
    actions.open();
  };
</script>

<ListItem {title} {after} {footer} on:click={onClick} link="#">
  <i slot="media" class="icon">
    <TransactionListIcon {transaction} />
  </i>
</ListItem>
