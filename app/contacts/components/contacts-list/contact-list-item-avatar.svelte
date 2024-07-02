<script>
    import Avatar from "svelte-avatar";
  import { clientId } from "../../../pocketbase";

    export let contact;
    let name = contact.name

    if(clientId !== contact.owner){
        name = contact.linkedName ? contact.linkedName : contact.owner
    }

    let avatarColor = "#ffd600";
    if (contact.balance < 0) avatarColor = "#ff3b30";
    if (contact.balance > 0) avatarColor = "#4cd964";
</script>

<Avatar
        src=""
        initials=""
        name={name}
        bgColor={avatarColor}
        textColor="black"
        size="40px"
/>
