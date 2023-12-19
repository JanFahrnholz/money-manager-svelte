<script>
  import { List, ListItem } from "framework7-svelte";
import { alerts } from "../store";
</script>

{#if $alerts}
    <List inset outline strong dividers>
        {#each $alerts as alert}
            <ListItem title={alert} bgColor="">
                <i slot="media" class="icon material:error" />
            </ListItem>
        {/each}
    </List>
{/if}
