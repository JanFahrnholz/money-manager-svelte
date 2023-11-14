<script>
  import {
    BlockTitle,
    List,
    ListButton,
    f7,
    useStore,
  } from "framework7-svelte";
  import store from "../../store";

  export let contact;
  export let settings = contact.settings;

  let user = useStore("user", (v) => (user = v));
  let showStatistics = user.settings?.showContactStatistics;

  if (settings?.showContactStatistics !== undefined) {
    showStatistics = settings?.showContactStatistics;
  }

  const changeShowStatistics = () => {
    // confirmUpdate(
    //   `Do you want to ${
    //     showStatistics ? "hide" : "show"
    //   } the transaction statistics to linked user? They won't be able to see statistics older than 6 months`,
    //   {
    //     settings: {
    //       ...contact.settings,
    //       showContactStatistics: !showStatistics,
    //     },
    //   }
    // );

    store
      .dispatch("updateContact", {
        ...contact,
        settings: {
          ...contact.settings,
          showContactStatistics: settings?.showContactStatistics ? !settings?.showContactStatistics : !showStatistics,
        },
      })
      .then((updated) => {
        settings = { ...settings, ...updated.settings };
        console.log(settings);
      })
      .catch((error) => console.log(error));
  };

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
    <ListButton
      on:click={changeShowStatistics}
      title={`${settings?.showContactStatistics ? "hide" : "show"} statistics`}
      color="blue"
    />

    {#if contact.courier}
      <ListButton on:click={removeCourier} title="remove courier" color="red" />
    {:else}
      <ListButton on:click={addCourier} title="make courier" color="blue" />
      <ListButton on:click={removeLink} title="remove link" color="red" />
    {/if}
  {/if}

  <ListButton on:click={deleteContact} title="delete contact" color="red" />
</List>
