<script>
  import { Block, Button } from "framework7-svelte";
  import { createEventDispatcher } from "svelte";

  export let initial = 0;
  export let value = initial !== 0 ? initial.toString() : "";
  export let maxDecimalPoints = 2;
  let decimalCount = 0;
  let isDecimal = false;

  const dispatch = createEventDispatcher();

  const select = (num) => () => {
    if (isDecimal) decimalCount++;
    if (decimalCount > maxDecimalPoints) return;
    value += num;
    dispatch("change", value);
  };

  const decimal = () => {
    value += ".";
    console.log(value);
    isDecimal = true;
    dispatch("decimal");
  };

  const clear = () => {
    value = "";
    decimalCount = 0;
    isDecimal = false;
    dispatch("clear");
  };
</script>

<Block strong inset>
  <div class="grid grid-cols-3 numpad">
    <Button class="numpad-button" outline large on:click={select(1)}>1</Button>
    <Button class="numpad-button" outline large on:click={select(2)}>2</Button>
    <Button class="numpad-button" outline large on:click={select(3)}>3</Button>
    <Button class="numpad-button" outline large on:click={select(4)}>4</Button>
    <Button class="numpad-button" outline large on:click={select(5)}>5</Button>
    <Button class="numpad-button" outline large on:click={select(6)}>6</Button>
    <Button class="numpad-button" outline large on:click={select(7)}>7</Button>
    <Button class="numpad-button" outline large on:click={select(8)}>8</Button>
    <Button class="numpad-button" outline large on:click={select(9)}>9</Button>
    <Button
      class="numpad-button"
      outline
      large
      on:click={clear}
      disabled={!value}>Clear</Button
    >
    <Button class="numpad-button" outline large on:click={select(0)}>0</Button>
    <Button
      class="numpad-button"
      outline
      large
      on:click={decimal}
      disabled={isDecimal}>.</Button
    >
  </div>
</Block>

<style>
  .numpad {
    grid-gap: 0.5em;
  }
</style>
