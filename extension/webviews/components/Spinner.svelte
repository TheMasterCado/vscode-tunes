<script lang="ts">
  let spinning = true;
</script>

<div class="container">
  <i class="codicon codicon-loading" class:spinning />
</div>

<style>
  .container {
    padding: 20px;
    width: 100%;
    text-align: center;
  }

  .codicon.codicon-loading {
    font-size: x-large;
  }

  .spinning {
    animation: spin 1s infinite linear;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
