<div class="sidebar-container">
  <ul class="no-bullets">
    {#each users as user (user.uuid)}
      <li class="user">
        <p class="user-name">{user.name}</p> <div class="song-info-wrapper"><p class="song-info">{user.currentlyListening}</p></div>
      </li>
    {/each}
  </ul>
</div>

<script lang="ts">
import { onMount } from "svelte";


  let users = [
    {uuid: '1', name: 'Alexis Cadorette', currentlyListening: 'Very long song name by a very long author name that played the song and sang it'}
  ]

  onMount(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;
    });
  });
</script>

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
    animation: move 5s linear infinite
  }

  @keyframes move {
    from { transform: translateX(100%); }
    to { transform: translateX(-100%); }
  }
</style>