<script lang="ts">
  import {
    BlockTitle,
    List,
    ListButton,
    f7,
    useStore,
  } from "framework7-svelte";
  import store from "../../store";
  import { ApiError } from "../../utils/errors";

  export let contact;
  export let settings;

  let user = useStore("user", (v) => (user = v));

  const changeName = () => {
    f7.dialog.prompt("enter name", (linkedName) => {
      store
        .dispatch("editLinkedName", {
          ...contact,
          linkedName,
        })
        .then((updated) => (contact = updated))
        .catch((e) => {
          console.log(e)
        });
    }, null, contact?.linkedName);
  };
</script>

<BlockTitle>Options</BlockTitle>
<List strong inset dividers>
    <ListButton on:click={changeName} title={!contact.linkedName ? "add name" : "edit name"} color="blue" />
</List>
