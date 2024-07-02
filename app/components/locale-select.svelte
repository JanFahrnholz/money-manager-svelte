<script lang="ts">
  import { ListItem } from "framework7-svelte";
  import { _, locale, locales } from "svelte-i18n";

  const onChange = (event) => {
    const newLocale = event.target.value;
    localStorage.setItem("last-language", newLocale);
    $locale = newLocale;
  };
</script>

<ListItem
  title={$_("language")}
  smartSelect
  smartSelectParams={{ openIn: "sheet" }}
>
  <select value={$locale} on:change={onChange}>
    {#each $locales as locale}
      <option value={locale}>{$_(`languages.${locale}`)}</option>
    {/each}
  </select>
</ListItem>
