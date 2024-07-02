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
  import { _ } from "svelte-i18n";

  export let contact;
  export let settings;

  let user = useStore("user", (v) => (user = v));

  const updateSetting = async (key, value) => {
    const loader = f7.dialog.preloader();
    try {
      await settings.set(key, value);
    } catch (error) {
      new ApiError(error).dialog();
    } finally {
      loader.close();
    }
  };

  const changeShowStatistics = () => {
    f7.dialog
      .create({
        title: "statistics visibility",
        closeByBackdropClick: true,
        buttons: [
          {
            text: "show",
            color: "blue",
            onClick: async () => {
              await updateSetting("showStatisticsContact", true);
            },
          },
          {
            text: "hide",
            color: "blue",
            onClick: async () => {
              await updateSetting("showStatisticsContact", false);
            },
          },
          {
            text: `default`,
            color: "blue",
            onClick: async () => {
              await updateSetting("showStatisticsContact", "default");
            },
          },
        ],
        verticalButtons: true,
      })
      .open();
  };

  const confirmUpdate = (message, data, action = "updateContact") => {
    f7.dialog
      .confirm(message, () => {
        store
          .dispatch(action, {
            ...contact,
            ...data,
          })
          .then((updated) => (contact = updated))
          .catch((e) => console.log(e));
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
    const message =
      "This user won't be able to create transactions for your contacts anymore.";
    confirmUpdate(message, {}, "removeCourier");
  };

  const addCourier = async () => {
    const message = "Do you want to make this contact a courier?";
    confirmUpdate(message, {}, "makeCourier");
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
    f7.dialog.prompt("enter user id", (user) => {
      if (user === "") return;
      store
        .dispatch("updateContact", {
          ...contact,
          user,
        })
        .then((updated) => (contact = updated))
        .catch(() => {});
    });
  };

  const changeName = () => {
    f7.dialog.prompt("enter name", (name) => {
      store
        .dispatch("updateContact", {
          ...contact,
          name,
        })
        .then((updated) => (contact = updated))
        .catch((e) => {
          console.log(e)
        });
    }, null, contact.name);
  };
</script>

<BlockTitle>Options</BlockTitle>
<List strong inset dividers>
  <ListButton on:click={changeName} title={$_("contact.actions.edit-name")} color="blue" />
  {#if contact.user === ""}
    <ListButton on:click={addLink} title={$_("contact.actions.add-link")} color="blue" />
    <ListButton on:click={deleteContact} title={$_("contact.actions.delete")} color="red" />
  {:else}
    <ListButton
      on:click={changeShowStatistics}
      title={$_("contact.actions.statistics-visibility")}
      color="blue"
    />

    {#if contact.courier}
      <ListButton on:click={removeCourier} title={$_("contact.actions.remove-courier")} color="red" />
    {:else}
      <ListButton on:click={addCourier} title={$_("contact.actions.make-courier")} color="blue" />
      <ListButton on:click={removeLink} title={$_("contact.actions.remove-link")} color="red" />
    {/if}
  {/if}
</List>
