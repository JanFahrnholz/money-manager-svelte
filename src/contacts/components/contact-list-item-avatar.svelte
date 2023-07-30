<script lang="ts">
  import Avatar from "svelte-avatar";

  export let contact;

  let avatarColor = "#ffd600";
  if (contact.balance < 0) avatarColor = "#ff3b30";
  if (contact.balance > 0) avatarColor = "#4cd964";
</script>

<Avatar
  name={contact.name}
  bgColor={avatarColor}
  textColor="black"
  size="40px"
/>
