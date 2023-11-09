<script lang="ts">
  import {
    AccordionContent,
    List,
    ListItem,
    SwipeoutActions,
    SwipeoutButton,
    f7,
  } from "framework7-svelte";
  import { createEventDispatcher } from "svelte";
  import ContactListItemAvatar from "../../contacts/components/contact-list-item-avatar.svelte";
  import store from "../../store";
  import TransactionListIcon from "../../transactions/components/transaction-list-icon.svelte";
  import { isInvoice, isRefund } from "../../utils/transactions";

  export let transactions = [];
  let contact = transactions[0].expand.contact;
  let balanceDiff = transactions.reduce((prev, item) => {
    if (isInvoice(item)) return prev - item.amount;
    if (isRefund(item)) return prev + item.amount;
    return prev;
  }, 0);

  const dispatch = createEventDispatcher();

  const open = () => {
    dispatch("open");
  };
  const close = () => {
    dispatch("close");
  };
  const confirm = (transaction) => {
    f7.dialog.confirm(
      `Are you sure you want to confirm ${transaction?.amount.toFixed(
        2
      )}€ from ${contact?.name}`,
      () => {
        store
          .dispatch("confirmPlannedTransaction", transaction)
          .then(() => dispatch("close"))
          .catch((e) => console.log(e));
      }
    );
  };
  const remove = (id) => {
    store.dispatch("deletePlannedTransaction", id);
    dispatch("close");
  };
</script>

<ListItem
  onAccordionOpen={open}
  onAccordionBeforeClose={close}
  accordionItem
  title={contact.name}
  footer={`Balance: ${contact.balance} ${
    !balanceDiff ? `${balanceDiff > 0 ? "+" : ""}${balanceDiff}€` : ""
  }`}
>
  <i slot="media">
    <ContactListItemAvatar {contact} />
  </i>
  <AccordionContent>
    <List dividers>
      {#each transactions as transaction}
        <ListItem
          title={`${transaction.amount}€`}
          footer={transaction.type}
          after={`${transaction.info}`}
          swipeout
          on:swipeoutDelete={() => remove(transaction.id)}
          on:swipeoutClose={() => confirm(transaction)}
        >
          <i slot="media" class="icon">
            <TransactionListIcon {transaction} />
          </i>
          <SwipeoutActions left>
            <SwipeoutButton color="green" overswipe close>
              confirm
            </SwipeoutButton>
          </SwipeoutActions>
          <SwipeoutActions right>
            <SwipeoutButton
              delete
              overswipe
              confirmText="Are you sure you want to delete this item?"
            >
              Delete
            </SwipeoutButton>
          </SwipeoutActions>
        </ListItem>
      {/each}
      <!-- <ListButton title="confirm all" /> -->
    </List>
  </AccordionContent>
</ListItem>
