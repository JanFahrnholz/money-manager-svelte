<script lang="ts">
  import {
    Button,
    List,
    ListInput,
    NavLeft,
    Navbar,
    Page
  } from "framework7-svelte";
  import store from "../../store";

  let password = "";
  let loading = false;
  
  const register = async () => {
    loading = true;
    try {
      await store.dispatch("register", { password });
    } catch (error) {
      
    } finally {
      loading = false;
    }
  };
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
  <p class="grid grid-cols-1 grid-gap font-black" style="padding: 4rem">
    <Button large fill on:click={register}>Create account</Button>
  </p>
</Page>
