<script lang="ts">
  import { BlockTitle, List, ListItem, Toggle, f7ready, useStore } from "framework7-svelte";
  import store from "../../store";
  import UserSettingsItem from "./user-settings-item.svelte";
  import { Settings, UserSettings } from "../../utils/settings";
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import LocaleSelect from "../../components/locale-select.svelte";
  let settings
  let list = [];
  let user = useStore(store, "user", (value) => {
    user = value;
  });
    
  onMount(() => f7ready(() => {
    settings = new UserSettings(user)
    settings.addObserver((settings) => {
      store.dispatch("setUser", {
        settings: settings.serialized()
      })
    })
  }))
  
    
</script>

<BlockTitle>{$_("settings.text")}</BlockTitle>
<List strong inset>
  {#each settings?.getSettings() || [] as setting (setting.key)}
    <UserSettingsItem key={setting.key} {settings} type={setting.dataType} />
  {/each}
  <LocaleSelect />
</List>
