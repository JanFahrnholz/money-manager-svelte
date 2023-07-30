<script>
  import { ListItem } from "framework7-svelte";
  import { clientId } from "../../pocketbase";
  import ContactListItemAvatar from "./contact-list-item-avatar.svelte";

  export let contact;

  let title = contact.name;

  if (contact.owner === clientId && contact.user !== "") {
    title += " 🔗";
  }
</script>

<ListItem
  {title}
  after={`${contact.balance}€`}
  link={`/contacts/${contact.id}/`}
>
  <i slot="media" class="icon">
    <ContactListItemAvatar {contact} />
  </i>
</ListItem>
