<script lang="ts">
  import { List, ListItem, Progressbar } from "framework7-svelte";
  import { _ } from "svelte-i18n";
  import ContactListItemAvatar from "../../contacts/components/contacts-list/contact-list-item-avatar.svelte";
  export let contact;
  const courier = contact.expand?.courier;

  let progress =
    (courier?.salesBalance /
      (courier?.inventoryBalance + courier?.salesBalance)) *
    100;

  if (isNaN(progress)) progress = 0;
  if (progress === Infinity) progress = 100;
</script>

<List strong inset>
  <ListItem
    title={contact.linkedName ? contact.linkedName : contact.owner}
    link={`/manager/${courier.id}/`}
  >
    <i slot="media" class="icon">
      <ContactListItemAvatar {contact} />
    </i></ListItem
  >
  <Progressbar {progress} />
  <ListItem
    title={$_("page.courier.inventory")}
    after={`${courier?.inventoryBalance}€`}
  />
</List>
