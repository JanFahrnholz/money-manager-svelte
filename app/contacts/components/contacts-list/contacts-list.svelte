<script lang="ts">
  import { BlockFooter, BlockTitle, List, ListItem, Preloader, f7ready, useStore } from "framework7-svelte";
  import { _ } from "svelte-i18n";
  import InfoPopover from "../../../components/info-popover.svelte";
  import SortDropdown from "../../../components/sort-dropdown.svelte";
  import { ContactCollection } from "../../../utils/iterator";
  import ContactListInfo from "./contact-list-info.svelte";
  import ContactListItemAvatar from "./contact-list-item-avatar.svelte";
  import ContactsListItem from "./contacts-list-item.svelte";
  import ManagerCard from "../../../components/couriers/manager-card.svelte";
  import { onMount } from "svelte";
  import { storable } from "../../../utils/storable";

  let selectedSort = storable("last-contact-sort", "created-asc");
  let managers = [];
  let linked = [];
  let owned = [];
  let couriers = [];
  let loading = true;

  let contacts = useStore("contacts", (value) => {
    loading = !value 
    contacts = new ContactCollection(value);
    managers = contacts.getManagers().items();
    linked = contacts.getLinked().items();
    owned = contacts.getDefaults().items();
    couriers = contacts.getCouriers().items();
  });

  let options = [
    "created",
    "name",
    "balance",
  ];

</script>

<div id="contact-list">
  {#if managers.length > 0}
    <BlockTitle>
      {$_("your.managers")} - {managers.length}
    </BlockTitle>

    {#each managers as contact (contact.id)}
      <ManagerCard {contact} />
    {/each}
  {/if}
  {#if linked.length > 0}
    <BlockTitle>
      {$_("your.links")} - {linked.length}
      <InfoPopover key="linked-contacts">
        {$_("contact.helper.linked")}
      </InfoPopover>
    </BlockTitle>
    <List strong inset dividers>
      {#each linked as contact (contact.id)}
        <ListItem
          title={contact.linkedName ? contact.linkedName : contact.owner}
          after={`${contact.balance}€`}
          link={`/contacts/${contact.id}/`}
        >
          <i slot="media" class="icon">
            <ContactListItemAvatar {contact} />
          </i></ListItem
        >
      {/each}
    </List>
  {/if}
  {#if couriers.length !== 0}
    <BlockTitle>{$_("your.couriers")} - {couriers.length}</BlockTitle>

    <List strong inset dividers>
      {#each couriers as contact (contact.id)}
        <ContactsListItem {contact} />
      {/each}
    </List>
  {/if}

  <BlockTitle
    >{$_("your.contacts")} - {owned.length}
    <ContactListInfo />
  </BlockTitle>
  <SortDropdown
    {options}
    bind:data={owned}
    bind:selectedOption={$selectedSort}
  />
  {#if loading}
  <div class="text-center margin-top">
    <Preloader />
  </div>
  {/if}
  <List strong inset dividers contactsList class="margin-top-half">
    {#each owned as contact, index (contact.id)}
      <ContactsListItem {contact} />
    {/each}
  </List>
  {#if owned.length === 0 && !loading}
    <BlockFooter class="margin-top text-center">
      {$_("empty.contacts.owned")}
    </BlockFooter>
  {/if}
</div>
<br />
<br />
