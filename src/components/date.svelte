<script lang="ts">
  import { format } from "timeago.js";
  import { formatMonthlyExact } from "../utils/formatter";
  import { f7ready } from "framework7-svelte";
  import { onMount } from "svelte";

  export let date;
  export let prefix = "";
  export let suffix = "";
  export let error = "none";
  export let absolute = false;
  export let toggle = false;

  let dateFormatted;

  export let refresh = () => {
    if (!absolute) dateFormatted = format(date);
    if (absolute) dateFormatted = formatMonthlyExact(date);
    if(!date) dateFormatted = error;
  };

  const handleClick = () => {
    console.log(absolute, date, "tt");
    if (!toggle) return;
    absolute = !absolute;
    refresh();
  };

  onMount(() =>
    f7ready(() => {
      refresh();
      setTimeout(() => refresh(), 1)
    })
  );
</script>


<span on:click={()=>handleClick()}>
    {prefix}{dateFormatted}{suffix}
</span>
