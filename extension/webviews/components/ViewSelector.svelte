<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let view = "followed";

  const select = (newView: string) => {
    view = newView;
    dispatch("viewChange", view);
  };
</script>

<div class="container">
  <p
    class="view"
    class:active={view === "everyone"}
    on:click={() => select("everyone")}
  >
    Everyone
  </p>
  <p
    class="view"
    class:active={view === "followed"}
    on:click={() => select("followed")}
  >
    Followed
  </p>
</div>

<style>
  .container {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;
  }

  .view {
    margin-right: 5px;
  }

  .view:not(.active) {
    cursor: pointer;
  }

  .view:hover:not(.active) {
    color: var(--vscode-menu-selectionForeground);
  }

  .view.active {
    color: var(--vscode-textLink-activeForeground);
  }
</style>
