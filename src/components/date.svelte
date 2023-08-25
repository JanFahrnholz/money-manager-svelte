<script lang="ts">
  import { format } from "timeago.js";
  import { formatMonthlyExact } from "../utils/formatter";

  export let date;
  export let prefix;
  export let suffix;
  export let absolut = false;

  let relativeDate = format(date);
</script>

{#if absolut}
  {prefix}{formatMonthlyExact(new Date(date))}{suffix}
{:else}
  {prefix}{relativeDate}{suffix}
{/if}
