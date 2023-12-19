<script>
  import { ListItem, Toggle } from "framework7-svelte";
  import store from "../../store";

  export let user;
  export let type;
  export let key;
  export let title;
  export let text;
  let value;

  const isBoolean = type === "boolean";

  if(!title) title = key;

  if(!user.settings){
    user.settings = {};
  }

  if (isBoolean) {
    value = user.settings[key] ? user.settings[key] : false;
  }
  const change = (event) => {
    if (isBoolean) {
      store.dispatch("updateSetting", { key, value: event.target.checked }).then(() =>{
        value != value;
      });
    }
  };

  console.log(value);
  
</script>

{#if isBoolean}
  <ListItem {title} footer={text}>
    <span slot="after">
      <Toggle checked={value} {value} onChange={change} />
    </span>
</ListItem>
{/if}
