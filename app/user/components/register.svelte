<script lang="ts">
  import {
    Button,
    List,
    ListInput,
    NavLeft,
    Navbar,
    Page,

    f7

  } from "framework7-svelte";
  import store from "../../store";
  import { errorToast } from "../../utils/toast";
  import { ApiError } from "../../utils/errors";
  import { ClientResponseError } from "pocketbase";
  import { _ } from "svelte-i18n";

  export let f7router;
  let username
  let password = "";
  let password2 = "";
  let loading = false;
  let error
  
  const register = async () => {
    loading = true;
    try {
      if(password !== password2) throw new Error("Passwords do not match")
      await store.dispatch("register", { username, password });
      await store.dispatch("setActiveTab", 1);
      f7router.navigate("/")
    } catch (e) {
      new ApiError(e).dialog()
    } finally {
      loading = false;
    }
  };
</script>

<Page name={$_("page.register.title")}>
  <Navbar>
    <NavLeft backLink={$_("back")} />
  </Navbar>
  <div style="height: 14rem;" />
  <div class="block-title-large text-white text-center">{$_("page.register.title")}</div>
  <List strong inset dividers>
    <ListInput
      type="text"
      name="username"
      placeholder={$_("page.register.nickname.placeholder")}
      bind:value={username}
    />
    </List>

  <List strong inset dividers>
    <ListInput
      type="password"
      name="password"
      placeholder={$_("page.register.password.placeholder-1")}
      bind:value={password}
    />
    <ListInput
      type="password"
      name="password"
      placeholder={$_("page.register.password.placeholder-2")}
      bind:value={password2}
    />
  </List>
  <p class="grid grid-cols-1 grid-gap" style="padding: 4rem">
    <Button large fill textColor="black" on:click={register}>{$_("page.register.submit")}</Button>
  </p>
</Page>
