<script lang="ts">
  import { onMount } from "svelte";
  let users: any[] = [];
  let currentUser: any = null;
  let loading = true;

  onMount(async () => {
    const response = await fetch(`${apiBaseUrl}/me`, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.status === 200) {
      const data = await response.json();
      currentUser = data.user;
      users.push(currentUser);
    }
    loading = false;

    window.addEventListener("message", (event) => {
      console.log(event.data);
      const message = event.data;
      switch (message.type) {
        case "currentUserCurrentlyPlaying":
          currentUser.currentlyPlaying = message.value;
          users = [...users];
          break;
      }
    });
  });
</script>

{#if loading}
  <div>Loading...</div>
{:else if currentUser}
  <div class="sidebar-container">
    <ul class="no-bullets">
      {#each users as user (user.uuid)}
        <li class="user">
          <p class="user-name">{user.name}</p>
          <div class="song-info-wrapper">
            <p class="song-info">{user.currentlyPlaying || "Nothing"}</p>
          </div>
        </li>
      {/each}
    </ul>
  </div>
{:else}
  <div>Please log in to use VSCode tunes.</div>
{/if}

<style>
  .sidebar-container {
    padding: 10px 20px;
  }

  ul.no-bullets {
    padding: 0;
  }
  ul.no-bullets li {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }
  .user-name {
    font-weight: bold;
    white-space: nowrap;
    flex-grow: 1;
    margin-right: 7px;
  }
  .user {
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
  }
  .song-info-wrapper {
    overflow: hidden;
    white-space: nowrap;
  }
  .song-info {
    color: green;
    animation: move 5s linear infinite;
  }

  @keyframes move {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(-100%);
    }
  }
</style>
