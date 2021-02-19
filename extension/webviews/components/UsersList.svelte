<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { ApiService } from "../ApiService";

  export let apiService: ApiService;
  export let users: any[] = [];

  const dispatch = createEventDispatcher();

  const playSong = (song: any) => {
    tsvscode.postMessage({ type: "playSong", value: song });
  };

  const toggleFollow = async (user: any) => {
    if (user.followed && (await apiService.deleteFollowed(user.uuid))) {
      dispatch("unfollow", user);
    } else if (await apiService.putFollowed(user.uuid)) {
      dispatch("follow", user);
    }
  };
</script>

<ul class="no-bullets">
  {#each users as user (user.uuid)}
    <li class="user">
      <i
        class="user-btn left codicon"
        class:codicon-star-empty={!user.followed}
        class:codicon-star-full={user.followed}
        on:click|once={() => toggleFollow(user)}
      />
      <p class="user-name">{user.name}</p>
      <p class="song-info" class:nothing={!user.currentlyPlayingName}>
        {user.currentlyPlayingName || "Nothing"}
      </p>
      {#if user.currentlyPlayingUri}
        <i
          class="user-btn right codicon codicon-play-circle"
          on:click|once={() =>
            playSong({
              name: user.currentlyPlayingName,
              uri: user.currentlyPlayingUri,
            })}
        />
      {/if}
    </li>
  {:else}
    <p class="empty-msg">The list is empty</p>
  {/each}
</ul>

<style>
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
  .user-btn.left {
    margin-right: 5px;
  }
  .user-btn.right {
    margin-left: 5px;
  }
  .user-btn {
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
</style>
