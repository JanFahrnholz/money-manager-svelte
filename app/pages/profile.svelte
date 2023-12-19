<script>
  import {
    BlockTitle,
    List,
    ListButton,
    ListItem,
    Navbar,
    Page,
    Toggle,
  } from "framework7-svelte";
  import store from "../store";
  import AppVersion from "../components/app-version.svelte";
  import UserSettings from "../user/components/user-settings.svelte";

  let notificationPermission = Notification.permission;

  const logout = () => {
    store.dispatch("logout");
  };

  const allowNotifications = async () => {
    notificationPermission = await Notification.requestPermission();
  };
</script>

<UserSettings />

<List inset strong>
  {#if notificationPermission !== "granted"}
    <ListButton
      title="Allow notifications"
      color="blue"
      onClick={allowNotifications}
    />
  {/if}
</List>

<List inset strong>
  <ListButton title="Logout" color="red" onClick={logout} />
</List>

<AppVersion />
