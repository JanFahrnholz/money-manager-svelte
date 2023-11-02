<script lang="ts">
  import {
    Link,
    List,
    ListInput,
    ListItem,
    NavRight,
    Navbar,
    Page,
    Toggle,
    f7,
    f7ready,
  } from "framework7-svelte";
  import Numpad from "../../components/numpad.svelte";
  import ContactSmartSelect from "../../contacts/components/contact-smart-select.svelte";
  import store from "../../store";
  import { storable } from "../../utils/storable";
  import { onMount } from "svelte";

  export let f7router;

  let contact = storable("last-selected-contact", null);
  let type = storable("last-selected-type", "Income");

  let data = {
    amount: 0,
    $contact,
    $type,
    planned: false,
    info: "",
  };

  const onContactChange = (event) => {
    $contact = event.detail;
  };

  const onTransactionTypeChange = (event) => {
    $type = event.target.value;
  };

  const save = () => {
    f7.dialog.preloader();
    
    store
      .dispatch("createTransaction", {
        ...data,
        contact: $contact.id,
        type: $type,
      })
      .then(() => f7router.back())
      .finally(() => f7.dialog.close());
  };
</script>

<Page name="create transaction">
  <Navbar title="Create transaction" backLink="Back">
    <NavRight>
      <Link on:click={save}>save</Link>
    </NavRight>
  </Navbar>

  <h1 style="text-align: center; font-size: 300%">{data.amount.toFixed(2)}€</h1>

  <List strong inset dividers form formStoreData>
    <ContactSmartSelect
      selected={$contact}
      on:change={(e) => onContactChange(e)}
    />
    <ListItem
      title="Transaction type"
      smartSelect
      smartSelectParams={{ openIn: "sheet" }}
    >
      <select
        name="Transaction type"
        value={$type}
        on:change={(e) => onTransactionTypeChange(e)}
      >
        <option value="Income">Income</option>
        <option value="Expense">Expense</option>
        <option value="Invoice">Invoice</option>
        <option value="Refund">Refund</option>
      </select>
    </ListItem>
    <ListItem title="Planned">
      <span slot="after">
        <Toggle onChange={(e) => (data.planned = e.target.checked)} />
      </span>
    </ListItem>
    <!-- {#if data.planned}
      <ListItem title="Location">
        <PickAPlace {leaflet} on:update={(e) => console.log(e)} />
      </ListItem>
    {/if} -->
    <ListInput
      label="Additional info"
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
