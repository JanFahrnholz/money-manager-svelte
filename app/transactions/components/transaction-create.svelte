<script lang="ts">
  import {
    BlockFooter,
    Link,
    List,
    ListInput,
    ListItem,
    NavRight,
    Navbar,
    Page,
    Toggle,
    f7,
    useStore,
  } from "framework7-svelte";
  import { _ } from "svelte-i18n";
  import { writable } from "svelte/store";
  import InfoPopover from "../../components/info-popover.svelte";
  import Numpad from "../../components/numpad.svelte";
  import ContactSmartSelect from "../../contacts/components/contact-smart-select.svelte";
  import { clientId } from "../../pocketbase";
  import store from "../../store";
  import { ErrorDialog } from "../../utils/errors";
  import { formatTransactionType } from "../../utils/formatter";
  import { ContactCollection } from "../../utils/iterator";
  import { storable } from "../../utils/storable";

  export let f7router;
  export let f7route;

  let contact = storable("last-selected-contact", null);
  let type = storable("last-selected-type", "Income");
  let contacts = useStore(store, "contacts", (v) => (contacts = v));
  let manager = writable(null);
  $: contacts = new ContactCollection(contacts);
  let disablePlanned = false;
  let isOwner = clientId === $contact?.owner;
  let isUser = clientId === $contact?.user;
  let data = {
    amount: 0,
    planned: false,
    info: "",
    courier: "",
    owner: "",
  };

  if (f7route.query.contact) {
    $contact = contacts.find((c) => c.id === f7route.query.contact);
  }

  $: {
    disablePlanned =
      $type === "Restock" ||
      $type === "Collect" ||
      $type === "Redeem" ||
      !!$contact?.manager;
    $manager = contacts?.getManager($contact?.owner);
  }

  const onContactChange = (event) => {
    delete event.detail.selected.expand;
    $contact = event.detail.selected;

    if ((!$contact?.courier && !!$contact) || !!$contact.manager)
      $type = "Income";
  };

  const onTransactionTypeChange = (event) => {
    $type = event.target.value;
  };

  const save = () => {
    if (!$contact)
      return new ErrorDialog($_("transaction.create.error.no-contact"));
    if (data.amount === 0)
      return new ErrorDialog($_("transaction.create.error.amount-zero"));

    f7.dialog.preloader();

    if (!isOwner && !isUser) {
      data.courier = $manager?.courier;
    }

    store
      .dispatch("createTransaction", {
        ...data,
        owner: $contact.owner,
        contact: $contact.id,
        type: $type,
      })
      .then(() => f7router.back())
      .finally(() => f7.dialog.close());
  };
</script>

<Page name={$_("transaction.create.title")}>
  <Navbar title={$_("transaction.create.title")} backLink={$_("back")}>
    <NavRight>
      <Link on:click={save}>{$_("save")}</Link>
    </NavRight>
  </Navbar>

  <h1
    style="text-align: center; font-size: 300%; overflow-x: hidden;"
    class="no-margin-bottom"
  >
    {data.amount.toFixed(2)}€
  </h1>
  {#if $manager}
    <BlockFooter class="text-center margin-bottom-half no-margin-top">
      Your bonus: {(
        data.amount *
        ($manager?.expand?.courier?.bonusPercentage / 100)
      ).toFixed(2)}€
    </BlockFooter>
  {/if}

  <List strong inset dividers>
    <ContactSmartSelect selected={$contact} on:change={onContactChange} />

    <span
      class={`item-link smart-select smart-select-init transaction-type-select-sheet ${!!$contact?.manager ? "disabled" : ""}`}
      data-open-in="sheet"
      data-set-value-text={false}
      data-close-on-select={true}
      data-popup-push={true}
    >
      <select
        name={$_("transaction.type.title")}
        value={$type}
        on:change={onTransactionTypeChange}
      >
        {#if !!$contact?.courier}
          <optgroup label="Courier transactions">
            <option value="Restock"
              >{formatTransactionType($_, { type: "Restock" }, true)}</option
            >
            <option value="Collect"
              >{formatTransactionType($_, { type: "Collect" }, true)}</option
            >
            <option value="Redeem"
              >{formatTransactionType($_, { type: "Redeem" }, true)}</option
            >
          </optgroup>
        {/if}
        <optgroup label="Contact transactions">
          <option value="Income"
            >{formatTransactionType($_, { type: "Income" })}</option
          >
          <option value="Expense"
            >{formatTransactionType($_, { type: "Expense" })}</option
          >
          <option value="Invoice"
            >{formatTransactionType($_, { type: "Invoice" })}</option
          >
          <option value="Refund"
            >{formatTransactionType($_, { type: "Refund" })}</option
          >
        </optgroup>
      </select>
      <div class="item-content">
        <div class="item-inner">
          <div class="item-title">
            {$_("transaction.type.title")}
            <InfoPopover key="transaction-type">
              Rechnung Subtrahiert den Betrag vom Kontostand" Rückzahlung
              Addiert den Betrag vom Kontostand"
            </InfoPopover>
          </div>
          <div class="item-after">
            {formatTransactionType($_, { type: $type })}
          </div>
        </div>
      </div>
    </span>
    <ListItem title={$_("transaction.create.planned")}>
      <span slot="after">
        <Toggle
          disabled={disablePlanned}
          onChange={(e) => (data.planned = e.target.checked)}
        />
      </span>
    </ListItem>
    <!-- {#if data.planned}
      <ListItem title="Location">
        <PickAPlace {leaflet} on:update={(e) => console.log(e)} />
      </ListItem>
    {/if} -->
    <ListInput
      label={$_("transaction.create.info")}
      placeholder="(optional)"
      type="textarea"
      resizable
      onChange={(e) => (data.info = e.target.value)}
    />
  </List>
  <Numpad
    on:change={(e) => (data.amount = +e.detail)}
    on:clear={() => (data.amount = 0)}
  />
</Page>
