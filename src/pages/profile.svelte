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

  const logout = () => {
    store.dispatch("logout");
  };
</script>

<UserSettings />

<List inset strong>
  <ListButton title="Logout" color="red" onClick={logout} />
</List>

<AppVersion />
