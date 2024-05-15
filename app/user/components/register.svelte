<script lang="ts">
  import {
    Button,
    Link,
    List,
    ListInput,
    NavLeft,
    Navbar,
    Page,
    View,
  } from "framework7-svelte";

  let password = "";
</script>

<Page name="register">
  <Navbar>
    <NavLeft backLink="back" />
  </Navbar>
  <div style="height: 16rem;" />
  <div class="block-title-large text-white text-center">Register</div>
  <List strong inset dividers>
    <ListInput
      type="password"
      name="password"
      placeholder="master password"
      bind:value={password}
    />
    <ListInput
      type="password"
      name="password"
      placeholder="confirm master password"
      bind:value={password}
    />
  </List>
  <p class="grid grid-cols-1 grid-gap" style="padding: 4rem">
    <Button large fill on:click={null}>Create account</Button>
  </p>
</Page>
