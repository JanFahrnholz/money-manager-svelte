<script lang="ts">
  import { ListItem, useStore } from "framework7-svelte";
  import { clientId } from "../../pocketbase";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let contacts = useStore("contacts", (value) => (contacts = value));
  contacts = contacts.filter((contact) => contact.owner === clientId);
  const contactIds = contacts.map((contact) => contact.id);

  let currentContactBalance;

  const onChange = (event) => {
    const contact = contacts.find(
      (contact) => contact.id === event.target.value
    );
    currentContactBalance = contact.balance;
    dispatch("change", contact);
  };
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
  <select name="contact" value={contactIds} on:change={(e) => onChange(e)}>
    {#each contacts as contact}
      <option value={contact.id}>{contact.name}</option>
    {/each}
  </select>
</ListItem>
