<script>
  import { BlockTitle, List, ListItem, Toggle, useStore } from "framework7-svelte";
  import store from "../../store";
  import UserSettingsItem from "./user-settings-item.svelte";
  let user = useStore(store, "user", (value) => {
    user = value;
  });
</script>

<BlockTitle>Settings</BlockTitle>
<List strong inset>
  <UserSettingsItem {user} key="showContactStatistics" title="Show statistics to linked users" type="boolean" />
</List>
