<script lang="ts">
  import { List, ListItem } from "framework7-svelte";
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";

  export let data = [];
  export let options;
  export let selectedOption;
  export let reverse = options[0]?.reverse === "desc";
  export let defaultIndex = 0;

  const dispatch = createEventDispatcher();
  const icon = (reverse) => (reverse === "asc" ? "&#8595;" : "&#8593;");

  const sort = (value, reverse) => {
    data =
      data.sort((a, b) => {
        if (a[value] < b[value]) return -1;
        if (a[value] > b[value]) return 1;
        return 0;
      }) || [];

    if (reverse) data.reverse();
  };

  const handleSortChange = (event) => {
    const [value, dir] = event.target.value.split("-");
    selectedOption = event.target.value;
    reverse = dir === "asc" ? false : true;

    sort(value, reverse);
    dispatch("sortChange", selectedOption);
  };

  $: {
    data.length;
    handleSortChange({
      target: {
        value: selectedOption,
      },
    });
  }
</script>

<List strong inset class="margin-bottom-half no-border">
  <ListItem
    title={$_("sort.title")}
    after={`${selectedOption?.replace("-", " ")}`}
    smartSelect
    smartSelectParams={{ openIn: "popover", setValueText: false }}
  >
    <select value={selectedOption} on:change={handleSortChange}>
      {#each options as option}
        {#each ["asc", "desc"] as direction (`${option}-${direction}`)}
          <option value={`${option}-${direction}`}>
            {option}
            {icon(direction)}
          </option>
        {/each}
      {/each}
    </select>
  </ListItem>
</List>

<style>
  .no-border {
    border: none;
    border-radius: 0;
  }
</style>
