<script lang="ts">
  import { onMount } from "svelte";
  import { debounce } from "lodash-es";
  import ViewSelector from "./ViewSelector.svelte";
  import Spinner from "./Spinner.svelte";
  let users: any[] = [];
  let currentUser: any = null;
  let accessToken = "";
  let searchTerm = "";
  let currentView = "followed";
  let viewReady = false;
  let listLoading = true;

  const playSong = (song: any) => {
    tsvscode.postMessage({ type: "playSong", value: song });
  };

  const search = debounce((_e: any) => {
    tsvscode.postMessage({
      type: "onInfo",
      value: `Searched for ${searchTerm}`,
    });
  }, 1000);

  const viewChange = (event: CustomEvent) => {
    currentView = event.detail;
    loadUsers();
  };

  const loadUsers = async () => {
    listLoading = true;
    const responseList = await fetch(
      `${apiBaseUrl}/users?view=${currentView}&limit=50&offset=${users.length}`,
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (responseList.status === 200) {
      const data = await responseList.json();
      users = data.users.filter((u: any) => u.uuid !== currentUser.uuid);
    }
    listLoading = false;
  };

  onMount(async () => {
    window.addEventListener("message", async (event) => {
      const message = event.data;
      switch (message.type) {
        case "token": {
          accessToken = message.value;
          const response = await fetch(`${apiBaseUrl}/me`, {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          });
          if (response.status === 200) {
            const data = await response.json();
            currentUser = data.user;
          }
          if (currentUser) {
            await loadUsers();
          }
          viewReady = true;
          break;
        }
        case "currentUserCurrentlyPlaying": {
          currentUser.currentlyPlayingName = message.value.name;
          currentUser.currentlyPlayingUri = message.value.uri;
          break;
        }
      }
    });

    tsvscode.postMessage({ type: "getAccessToken", value: null });
  });
</script>

{#if !viewReady}
  <Spinner />
{:else if currentUser}
  <div class="sidebar-container">
    <ViewSelector on:viewChange={viewChange} />
    <input bind:value={searchTerm} placeholder="Search" on:input={search} />
    {#if listLoading}
      <Spinner />
    {:else}
      <ul class="no-bullets">
        {#each users as user (user.uuid)}
          <li class="user">
            <p class="user-name">{user.name}</p>
            <p class="song-info" class:nothing={!user.currentlyPlayingName}>
              {user.currentlyPlayingName || "Nothing"}
            </p>
            {#if user.currentlyPlayingUri}
              <i
                class="play-song-btn codicon codicon-play-circle"
                on:click|once={() =>
                  playSong({
                    name: user.currentlyPlayingName,
                    uri: user.currentlyPlayingUri,
                  })}
              />
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{:else}
  <p>Please log in to use VSCode tunes.</p>
  <button>Log in with Spotify</button>
{/if}

<style>
  .sidebar-container {
    padding: 5px 15px;
  }
  ul.no-bullets {
    padding: 0;
    margin-top: 15px;
  }
  ul.no-bullets li {
    list-style-type: none;
    margin: 0;
    margin-bottom: 5px;
    padding: 0;
  }
  .user-name {
    font-weight: bold;
    white-space: nowrap;
    margin-right: 7px;
  }
  .user {
    overflow: hidden;
    display: flex;
    align-items: center;
    flex-direction: row;
  }
  .song-info {
    color: green;
    flex-shrink: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .song-info.nothing {
    color: var(--vscode-gitDecoration-ignoredResourceForeground);
  }
  .play-song-btn {
    margin-left: 5px;
    cursor: pointer;
    /* color: var(--vscode-gitDecoration-ignoredResourceForeground); */
  }
  .play-song-btn:hover {
    color: var(--vscode-menu-selectionForeground);
  }
</style>
