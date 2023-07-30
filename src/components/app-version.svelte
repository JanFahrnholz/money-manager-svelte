<script lang="ts">
  import { Block, BlockFooter } from "framework7-svelte";
  import { version } from "../../package.json";
</script>

<p class="text-center">
  <Block>
    <BlockFooter>
      v{version}
    </BlockFooter>
  </Block>
</p>
