<script lang="ts">
  import {
    List,
    ListItem,
    useStore
  } from "framework7-svelte";
  import InfoPopover from "../../components/info-popover.svelte";
  import store from "../../store";

  let totalContactBalances = useStore(
    store,
    "totalContactBalances",
    (value) => (totalContactBalances = value)
  );
</script>

<InfoPopover key="contact-info" disablePadding>
  <List strong inset>
    <ListItem
    title="Total negative"
    after={`${totalContactBalances.negative}€`}
    />
    <ListItem
    title="Total positive"
    after={`${totalContactBalances.positive}€`}
    />
    <ListItem title="Count neutral" after={`${totalContactBalances.neutral}`} />
  </List>
</InfoPopover>
