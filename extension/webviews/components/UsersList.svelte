<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { ApiService } from "../ApiService";

  export let apiService: ApiService;
  export let users: any[] = [];
  export let showListen = true;

  const dispatch = createEventDispatcher();

  const playSong = (song: any) => {
    tsvscode.postMessage({ type: "playSong", value: song });
  };

  const toggleFollow = async (user: any) => {
    if (user.followed && (await apiService.deleteFollowed(user.uuid))) {
      dispatch("unfollow", user);
      user.followed = false;
    } else if (await apiService.putFollowed(user.uuid)) {
      dispatch("follow", user);
      user.followed = true;
    }
  };
</script>

<ul class="no-bullets">
  {#each users as user (user.uuid)}
    <li class="user">
      <p class="user-name">
        <i
          class="user-btn left codicon"
          class:codicon-star-empty={!user.followed}
          class:codicon-star-full={user.followed}
          class:active={user.followed}
          on:click={() => toggleFollow(user)}
        />
        {user.name}
      </p>
      <div class="song-wrapper">
        <div class="song-info-wrapper">
          <p
            class="song-info"
            class:nothing={!user.currentlyPlayingName || !user.active}
          >
            {user.currentlyPlayingName || "Nothing"}
          </p>
        </div>
        {#if showListen && user.currentlyPlayingUri}
          <i
            class="user-btn right codicon codicon-play-circle"
            on:click={() =>
              playSong({
                name: user.currentlyPlayingName,
                uri: user.currentlyPlayingUri,
              })}
          />
        {/if}
      </div>
    </li>
  {:else}
    <p class="empty-msg">The list is empty</p>
  {/each}
</ul>

<style>
  ul.no-bullets {
    padding: 0;
  }
  ul.no-bullets li {
    list-style-type: none;
    margin: 0;
    margin-bottom: 15px;
    padding: 0;
  }
  .user-name {
    width: 100%;
    display: flex;
    align-items: center;
    font-size: medium;
    font-weight: bold;
    white-space: nowrap;
    margin-right: 7px;
  }
  .user {
    overflow: hidden;
  }
  .song-wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .song-info-wrapper {
    overflow: hidden;
  }
  .song-info {
    color: green;
    display: flex;
    align-items: center;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex-shrink: 1;
  }
  .song-info:hover:not(.nothing) {
    animation-name: songNameScroll;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    animation-duration: 7s;
  }
  .song-info.nothing {
    color: var(--vscode-gitDecoration-ignoredResourceForeground);
  }
  .user-btn.left {
    margin-right: 5px;
  }
  .user-btn.right {
    margin-left: 5px;
  }
  .user-btn.active {
    color: var(--vscode-textLink-activeForeground);
  }
  .user-btn {
    color: var(--vscode-foreground);
    cursor: pointer;
  }
  .user-btn:hover {
    color: var(--vscode-menu-selectionForeground);
  }
  .empty-msg {
    width: 100%;
    text-align: center;
    color: var(--vscode-gitDecoration-ignoredResourceForeground);
  }

  @keyframes songNameScroll {
    0% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(-120%);
    }
    50.1% {
      transform: translateX(120%);
    }
    100% {
      transform: translateX(0);
    }
  }
</style>
