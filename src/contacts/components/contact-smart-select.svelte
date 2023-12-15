<script lang="ts">
  import { ListItem, f7ready, useStore } from "framework7-svelte";
  import { clientId } from "../../pocketbase";
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();

  export let selected = null;

  let contacts = useStore("contacts", (value) => {
    contacts = value.filter((contact) => contact.owner === clientId);
  });
  const contactIds = contacts.map((contact) => contact.id);

  let currentContactBalance;

  const onChange = (event) => {
    const contact = contacts.find(
      (contact) => contact.id === event.target.value
    );
    selected = contact;
    if(contact) currentContactBalance = contact.balance;
    dispatch("change", contact);
  };

  onMount(() => f7ready(() => {
    if(selected !== null) onChange({target: {value: selected.id}})
  }));
</script>

<ListItem
  title="Contact"
  footer={currentContactBalance !== undefined
    ? `balance ${currentContactBalance}`
    : ""}
  smartSelect
  smartSelectParams={{
    openIn: "popup",
    searchbar: true,
    searchbarPlaceholder: "Search contact",
  }}
  required
>
  <select name="contact" value={selected?.id} on:change={(e) => onChange(e)}>
    {#each contacts as contact (contact.id)}
      <option value={contact.id}>{contact.name}</option>
    {/each}
  </select>
</ListItem>
