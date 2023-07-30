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

  const logout = () => {
    store.dispatch("logout");
  };
</script>

<BlockTitle>Settings</BlockTitle>
<List strong inset dividers>
  <ListItem
    title="Enable privacy mode"
    footer="allows you to hide sensitive information"
  >
    <span slot="after">
      <Toggle />
    </span>
  </ListItem>
  <ListItem title="Enable chats" footer="allows you to chat with your contacts">
    <span slot="after">
      <Toggle />
    </span>
  </ListItem>
</List>

<List inset strong>
  <ListButton title="Login" color="blue" link="/login/" />
  <ListButton title="Logout" color="red" onClick={logout} />
</List>

<AppVersion />
