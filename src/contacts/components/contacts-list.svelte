<script lang="ts">
  import {
    BlockTitle,
    Icon,
    Link,
    List,
    ListItem,
    Popover,
    f7ready,
    useStore,
  } from "framework7-svelte";
  import { onMount } from "svelte";
  import store from "../../store";
  import ContactsListItem from "./contacts-list-item.svelte";
  import ContactListInfo from "./contact-list-info.svelte";

  let contacts = useStore("contactsSorted", (value) => {
    console.log("🚀 ~ file: contacts-list.svelte:18 ~ contacts:", contacts);
    return (contacts = value);
  });
  onMount(() => {
    f7ready(() => {
      store.dispatch("getContacts", {});
      console.log(contacts);
    });
  });
</script>

<div id="contact-list">
  <BlockTitle>Networked contacts - {contacts.external.length}</BlockTitle>
  <List strong inset dividers>
    {#if contacts.external.length === 0}
      <ListItem title="No contacts yet" footer="share your ID" />
    {/if}
    {#each contacts.external as contact}
      <ListItem
        title={contact.name}
        after={`${contact.balance}€`}
        link={`/contacts/${contact.id}/`}
      />
    {/each}
  </List>
  {#if contacts.couriers.length !== 0}
    <BlockTitle>Couriers - {contacts.couriers.length}</BlockTitle>

    <List strong inset dividers>
      {#each contacts.couriers as contact}
        <ContactsListItem {contact} />
      {/each}
    </List>
  {/if}

  <BlockTitle
    >Your contacts - {contacts.internal.length}
    <ContactListInfo />
  </BlockTitle>
  <List strong inset dividers>
    {#each contacts.internal as contact}
      <ContactsListItem {contact} />
    {/each}
  </List>
</div>
