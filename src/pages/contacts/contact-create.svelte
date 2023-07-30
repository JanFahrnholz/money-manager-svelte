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

  export let f7router;

  let name = "";
  let user = "";

  const save = () => {
    store.dispatch("addContact", { name, user }).then(() => f7router.back());
  };
</script>

<Page name="create contact">
  <Navbar title="Create contact" backLink="Back">
    <NavRight>
      <Link text="save" on:click={save} />
    </NavRight>
  </Navbar>

  <List id="contact-create-form" strong inset dividers form formStoreData>
    <ListInput
      onChange={(e) => (name = e.target.value)}
      type="text"
      placeholder="Name"
      clearButton
    />
    <ListInput
      onChange={(e) => (user = e.target.value)}
      type="text"
      placeholder="User ID"
      info="Linked users can see their transactions, balance etc."
      clearButton
    />
  </List>
</Page>
