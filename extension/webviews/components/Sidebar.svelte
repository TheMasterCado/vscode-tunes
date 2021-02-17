<script lang="ts">
  import { onMount } from "svelte";
  let users: any[] = [];
  let currentUser: any = null;
  let accessToken = null;
  let loading = true;

  const playSong = (song: any) => {
    tsvscode.postMessage({ type: "playSong", value: song });
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
            const responseList = await fetch(`${apiBaseUrl}/users`, {
              headers: {
                authorization: `Bearer ${accessToken}`,
              },
            });
            if (responseList.status === 200) {
              const data = await responseList.json();
              users = data.users.filter(
                (u: any) => u.uuid !== currentUser.uuid
              );
            }
          }
          loading = false;
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

{#if loading}
  <div>Loading...</div>
{:else if currentUser}
  <div class="sidebar-container">
    <div class="user">
      <p class="user-name">You are listening to</p>
      <p class="song-info" class:nothing={!currentUser.currentlyPlayingName}>
        {currentUser.currentlyPlayingName || "Nothing"}
      </p>
    </div>
    <hr class="current-user-separator" />
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
  </div>
{:else}
  <p>Please log in to use VSCode tunes.</p>
  <button>Log in with Spotify</button>
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
  .current-user-separator {
    border-color: var(--vscode-tab-inactiveBackground);
    margin: 10px 0 15px 0;
  }
  .play-song-btn {
    margin-left: 5px;
    cursor: pointer;
    color: var(--vscode-gitDecoration-ignoredResourceForeground);
  }
  .play-song-btn:hover {
    color: var(--vscode-textLink-activeForeground);
  }
</style>
