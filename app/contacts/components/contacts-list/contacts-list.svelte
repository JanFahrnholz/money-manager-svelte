<script lang="ts">
  import {
    BlockTitle,
    List,
    ListItem,
    f7ready,
    useStore
  } from "framework7-svelte";
  import { onMount } from "svelte";
  import InfoPopover from "../../../components/info-popover.svelte";
  import store from "../../../store";
  import ContactListInfo from "./contact-list-info.svelte";
  import ContactsListItem from "./contacts-list-item.svelte";

  let contacts = useStore("contactsSorted", (value) => {
    console.log("🚀 ~ file: contacts-list.svelte:18 ~ contacts:", contacts);
    return (contacts = value);
  });
  onMount(() => {
    f7ready(() => {
      store.dispatch("getContacts", {});
    });
  });
</script>

<div id="contact-list">
  <BlockTitle>
    Network IDs - {contacts.external.length}
    <InfoPopover key="network-contacts">
      // TODO: Add request allow deny feature
        These contacts represent your identity in the linked a network
        These user linked your id to their contacts and
        granted you access to their network.
    </InfoPopover>

  </BlockTitle>
  <List strong inset dividers>
    {#if contacts.external.length === 0}
      <ListItem title="No contacts yet" footer="share your ID" />
    {/if}
    {#each contacts.external as contact (contact.id)}
      <ListItem
        title={contact.owner}
        after={`${contact.balance}€`}
        link={`/contacts/${contact.id}/`}
      />
    {/each}
  </List>
  {#if contacts.couriers.length !== 0}
    <BlockTitle>Couriers - {contacts.couriers.length}</BlockTitle>

    <List strong inset dividers>
      {#each contacts.couriers as contact (contact.id)}
        <ContactsListItem {contact} />
      {/each}
    </List>
  {/if}

  <BlockTitle
    >Your contacts - {contacts.internal.length}
    <ContactListInfo />
  </BlockTitle>
  <List strong inset dividers>
    {#each contacts.internal as contact (contact.id)}
      <ContactsListItem {contact} />
    {/each}
  </List>
</div>
