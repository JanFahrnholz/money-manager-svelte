<script lang="ts">
  import {
    Link,
    Icon,
    Popover,
    List,
    ListItem,
    useStore,
  } from "framework7-svelte";
  import store from "../../store";

  let totalContactBalances = useStore(
    store,
    "totalContactBalances",
    (value) => (totalContactBalances = value)
  );
</script>

<Link popoverOpen=".contact-summary-popover">
  <Icon size={18} ios="f7:info_circle_fill" md="material:info_outline" />
</Link>

<Popover class="contact-summary-popover">
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
</Popover>
