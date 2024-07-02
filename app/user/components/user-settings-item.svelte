<script lang="ts">
  import { ListItem, Toggle } from "framework7-svelte";
  import { _ } from "svelte-i18n";
  export let settings;
  export let type;
  export let key;
  let value;

  const isBoolean = type === "boolean";
  let disabled = false;

  const e = (key) => {
    return $_(key) !== key ? $_(key) : undefined;
  };

  $: value = settings?.get(key);

  const change = async (event) => {
    try {
      disabled = true;
      await settings.set(key, event);
      value = event;
    } catch (error) {
      value = settings.get(key);
    } finally {
      disabled = false;
    }
  };
</script>

{#if isBoolean}
  <ListItem
    title={$_(`settings.user.${key}.title`)}
    footer={e(`settings.user.${key}.text`)}
  >
    <span slot="after">
      <Toggle {disabled} {value} checked={value} onToggleChange={change} />
    </span>
  </ListItem>
{/if}
