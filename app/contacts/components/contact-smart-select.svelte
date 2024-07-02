<script lang="ts">
  import { ListItem, f7ready, useStore } from "framework7-svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import { clientId } from "../../pocketbase";
  import { Contact, ContactCollection } from "../../utils/iterator";
  import { _ } from "svelte-i18n";
  import { groupByProperty } from "../../utils/functions";

  const dispatch = createEventDispatcher();

  export let selected = null;
  /**
   * @var {{[key]: string: object[]}} manageable
   */
  let manageable = []
  let owned = [];
  let couriers = [];

  let contacts = useStore("contacts", (value) => {
    contacts = value;
  });

  $: {
    contacts = new ContactCollection(contacts);
    owned = contacts.getDefaults().items();
    couriers = contacts.getCouriers().items();
    manageable = contacts.getManageable().items();
  }

  const getManager = (owner) => {
    return contacts.find((i) => i.owner === owner && i.user === clientId)
  }

  const onChange = (event) => {
    const filter = (contact) => contact.id === event.target.value;
    selected = contacts.find(filter);
    dispatch("change", { selected });
  };
</script>

<ListItem
  title={$_("contact.title")}
  footer={selected ? `${$_("balance")}: ${selected?.balance}` : ""}
  after={selected ? selected?.name : $_("select")}
  smartSelect
  smartSelectParams={{
    openIn: "popup",
    searchbar: true,
    searchbarPlaceholder: $_("search"),
    pageTitle: $_("contact.select.title"),
    setValueText: false
  }}
  required
>
  <select name="contact" value={selected?.id} on:change={onChange}>
    {#if manageable.length > 0}
        {#each Object.entries(groupByProperty(manageable, "owner")) as [owner, manageables] (owner)}
          {@const manager = getManager(owner)}
          <optgroup
            label={$_("your.manageable.from", {
              values: {
                owner: manager?.linkedName || owner,
              },
            })}
          >
            {#each manageables as contact (contact.id)}
            {contact.id}
              <option value={contact.id}>{contact.name}</option>
            {/each}
          </optgroup>
        {/each}
    {/if}

    {#if couriers.length > 0}
      <optgroup label={$_("your.couriers")}>
        {#each couriers as contact (contact.id)}
          <option value={contact.id}>{contact.name}</option>
        {/each}
      </optgroup>
    {/if}
    <optgroup label={$_("your.contacts")}>
      {#each owned as contact (contact.id)}
        <option value={contact.id}>{contact.name}</option>
      {/each}
    </optgroup>
  </select>
</ListItem>
