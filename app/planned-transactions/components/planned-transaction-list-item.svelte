<script lang="ts">
  import {
    AccordionContent,
    BlockTitle,
    Button,
    Link,
    List,
    ListItem,
    Sheet,
    SwipeoutActions,
    SwipeoutButton,
    Toolbar,
    f7,
  } from "framework7-svelte";
  import { createEventDispatcher, tick } from "svelte";
  import ContactListItemAvatar from "../../contacts/components/contacts-list/contact-list-item-avatar.svelte";
  import store from "../../store";
  import TransactionListIcon from "../../transactions/components/transaction-list-icon.svelte";
  import { isInvoice, isRefund } from "../../utils/transactions";
  import { _ } from "svelte-i18n";
  import { formatTransactionType } from "../../utils/formatter";

  export let transactions = [];
  let sheetOpen = false;
  let contact = transactions?.at(0)?.expand.contact;
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
    store
      .dispatch("confirmPlannedTransaction", transaction)
      .then(() => {
        f7.sheet.close(`.confirm-sheet-${transaction.id}`);
        dispatch("close");
      })
      .catch((e) => console.log(e));
  };
  const remove = (id) => {
    store.dispatch("deletePlannedTransaction", id).then(() => {
      f7.sheet.close(`.confirm-sheet-${id}`);
      sheetOpen = false
      dispatch("close");
    });
  };

  const openSheet = async (transaction) => {
    f7.sheet.open(`.confirm-sheet-${transaction.id}`);
  };
</script>

<ListItem
  onAccordionOpen={open}
  onAccordionBeforeClose={close}
  accordionItem
  title={contact.name}
  footer={`${$_("balance")}: ${contact.balance}`}
>
  <i slot="media">
    <ContactListItemAvatar {contact} />
  </i>
  <AccordionContent>
    <List dividers>
      {#each transactions as transaction (transaction.id)}
        <ListItem
          title={`${transaction.amount}€`}
          footer={formatTransactionType($_, transaction)}
          after={`${transaction.info}`}
          on:click={() => openSheet(transaction)}
        >
          <i slot="media" class="icon">
            <TransactionListIcon {transaction} />
          </i>
          <!-- <SwipeoutActions left>
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
          </SwipeoutActions> -->
        </ListItem>
        <Sheet
          class={`confirm-sheet-${transaction.id}`}
          style="height: auto"
          swipeToClose
        >
          <div class="swipe-handler" />
          <Toolbar>
            <div class="left">
              {contact.name}
            </div>
            <div class="rigth">
              <Link sheetClose>{$_("cancel")}</Link>
            </div>
          </Toolbar>
          <div class="padding">
            <div
              class="display-flex justify-content-space-between align-items-center"
            >
              <div style="font-size: 18px">
                <b
                  >{formatTransactionType($_, transaction, true)}
                  {transaction?.amount}€
                </b>
              </div>
              <div style="font-size: 16px">
                {isInvoice(transaction) || isRefund(transaction)
                  ? $_("planned-transaction.confirm.new-balance", {
                      values: {
                        balance: isInvoice(transaction)
                          ? contact.balance - transaction.amount
                          : contact.balance + transaction.amount,
                      },
                    })
                  : ""}
              </div>
            </div>
            <p class="grid grid-cols-2 grid-gap">
              <Button on:click={() => remove(transaction?.id)} large outline
                >{$_("delete")}</Button
              >
              <Button
                on:click={() => confirm(transaction)}
                large
                fill
                textColor="black"
                >{$_("planned-transaction.confirm.title")}</Button
              >
            </p>
          </div>
        </Sheet>
      {/each}
      <!-- <ListButton title="confirm all" /> -->
    </List>
  </AccordionContent>
</ListItem>
