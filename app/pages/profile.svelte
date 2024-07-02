<script>
  import {
    List,
    ListButton
  } from "framework7-svelte";
  import { _ } from "svelte-i18n";
  import AppVersion from "../components/app-version.svelte";
  import { worker } from "../main.js";
  import store from "../store";
  import UserSettings from "../user/components/user-settings.svelte";

  let notificationPermission = Notification.permission;

  const logout = () => {
    store.dispatch("logout");
  };

  const allowNotifications = async () => {
    notificationPermission = await Notification.requestPermission();
  };

  const notify = () => {
    if (worker) worker.showNotification("MoneyManager is great!");
  };
</script>

<UserSettings />

<!-- <List inset strong>
  {#if notificationPermission !== "granted"}
    <ListButton
      title="Allow notifications"
      color="blue"
      onClick={allowNotifications}
    />
  {/if}
  {#if notificationPermission === "granted"}
    <ListButton title="Test notification" color="blue" onClick={notify} />
  {/if}
</List> -->

<List inset strong>
  <ListButton title={$_("logout")} color="red" onClick={logout} />
</List>

<AppVersion />
