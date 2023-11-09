<script>
  import { f7, List, ListButton, BlockTitle } from "framework7-svelte";
  import store from "../../store";

  export let contact;

  console.log(contact);

  const confirmUpdate = (message, data) => {
    f7.dialog
      .confirm(message, () => {
        store
          .dispatch("updateContact", {
            ...contact,
            ...data,
          })
          .then((updated) => (contact = updated));
      })
      .setTitle("Are you sure?");
  };

  const deleteContact = () => {
    f7.dialog.confirm(
      `All transactions for this contact will be deleted as well`,
      `Are you sure?`,
      () => {
        store.dispatch("deleteContact", contact.id).then(() => f7router.back());
      }
    );
  };

  const removeCourier = () => {
    confirmUpdate(
      "This user won't be able to create transactions for your contacts anymore.",
      {
        courier: false,
      }
    );
  };

  const addCourier = () => {
    confirmUpdate(
      "This user will be able to create transactions for your contacts.",
      {
        courier: true,
      }
    );
  };


  const removeLink = () => {
    confirmUpdate(
    "The user won't be able to see their transactions anymore. ",
      {
        user: "",
      }
    );
  };
  
  const addLink = () => {
    f7.dialog.prompt("Add user id", (user) => {
      if (user === "") return;
      store
        .dispatch("updateContact", {
          ...contact,
          user,
        })
        .then((updated) => (contact = updated));
    });
  };
</script>

<BlockTitle>Options</BlockTitle>
<List strong inset dividers>
  {#if contact.user === ""}
    <ListButton on:click={addLink} title="link user id" color="blue" />
  {:else}
    {#if contact.courier}
      <ListButton on:click={removeCourier} title="remove courier" color="red" />
    {:else}
      <ListButton on:click={addCourier} title="make courier" color="blue" />
    {/if}

    <ListButton on:click={removeLink} title="remove link" color="red" />
  {/if}
  <ListButton on:click={deleteContact} title="delete contact" color="red" />
</List>
