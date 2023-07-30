<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import TransactionListIcon from "../../transactions/components/transaction-list-icon.svelte";
  import {
    ListItem,
    AccordionContent,
    List,
    SwipeoutActions,
    SwipeoutButton,
    ListButton,
  } from "framework7-svelte";
  import store from "../../store";
  import ContactListItemAvatar from "../../contacts/components/contact-list-item-avatar.svelte";

  export let transactions;
  let contact = transactions[0].expand.contact;

  const dispatch = createEventDispatcher();

  const open = () => {
    dispatch("open");
  };
  const close = () => {
    dispatch("close");
  };
  const confirm = (transaction) => {
    store
      .dispatch("confirmPlannedTransaction", transaction)
      .then(() => dispatch("close"))
      .catch((e) => console.log(e));
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
  footer={`Balance: ${contact.balance}`}
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
            <SwipeoutButton color="green" close>confirm</SwipeoutButton>
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
