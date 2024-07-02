<script lang="ts">
  import {
    Link,
    List,
    ListInput,
    NavRight,
    Navbar,
    Page,
  } from "framework7-svelte";
  import store from "../../store";
  import { _ } from "svelte-i18n";

  export let f7router;

  let name = "";
  let user = "";

  const save = () => {
    store.dispatch("createContact", { name, user }).then(() => f7router.back());
  };
</script>

<Page name="create contact">
  <Navbar title={$_("contact.create")} backLink={$_("back")}>
    <NavRight>
      <Link text={$_("save")} on:click={save} />
    </NavRight>
  </Navbar>

  <List id="contact-create-form" strong inset dividers form >
    <ListInput
      onChange={(e) => (name = e.target.value)}
      type="text"
      placeholder="Name"
      clearButton
    />
    <ListInput
      onChange={(e) => (user = e.target.value)}
      type="text"
      placeholder="optional: user ID"
      info={$_("contact.create.helper")}
      clearButton
    />
  </List>
</Page>
