<script lang="ts">
  import { onMount } from "svelte";
  import { debounce } from "lodash-es";
  import ViewSelector from "./ViewSelector.svelte";
  import Spinner from "./Spinner.svelte";
  import UsersList from "./UsersList.svelte";
  import { ApiService } from "../ApiService";
  let apiService: ApiService;
  let users: any[] = [];
  let currentUser: any = null;
  let accessToken = "";
  let searchTerm = "";
  let searchResults: any[] = [];
  let ws: WebSocket | undefined = undefined;
  let currentView = "followed";
  let viewReady = false;
  let listLoading = true;

  const authenticate = (provider: string) => {
    tsvscode.postMessage({ type: "authenticate", value: provider });
  };

  const search = debounce(async (_e: any) => {
    loadUsers();
  }, 1000);

  const viewChange = (event: CustomEvent) => {
    currentView = event.detail;
    searchTerm = "";
    loadUsers();
  };

  const follow = (event: CustomEvent) => {
    const user = event.detail;
    if (currentView === "followed") {
      users = [...users, user];
    } else {
      users = users;
    }
  };

  const unfollow = (event: CustomEvent) => {
    const user = event.detail;
    if (currentView === "followed") {
      users = users.filter((u: any) => u.uuid !== user.uuid);
    } else {
      users = users;
    }
  };

  const loadUsers = async () => {
    listLoading = true;
    users = (await apiService.getUsers(currentView, searchTerm)).filter(
      (u: any) => u.uuid !== currentUser.uuid || true
    );
    listLoading = false;
  };

  const setupWebsocket = () => {
    if (!ws || ws.readyState === ws.CLOSED) {
      ws = new WebSocket(apiWsUrl);

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.userUuid) {
          const user = users.find((u) => u.uuid === data.userUuid);
          if (user) {
            user.currentlyPlayingName = data.currentlyPlayingName;
            user.currentlyPlayingUri = data.currentlyPlayingUri;
            user.currentlyPlayingAt = data.currentlyPlayingAt;
            users = [...users];
          }
        }
      };

      ws.onclose = (e) => {
        console.log("closed! " + e.code);
        setupWebsocket();
      };
    }
  };

  onMount(async () => {
    window.addEventListener("message", async (event) => {
      const message = event.data;
      switch (message.type) {
        case "token": {
          accessToken = message.value;
          if (apiService) {
            apiService.accessToken = accessToken;
          } else {
            apiService = new ApiService(accessToken);
          }
          // if no token log out
          if (!accessToken) {
            currentUser = null;
            users = [];
            viewReady = true;
            return;
          }

          currentUser = await apiService.getMe();

          if (currentUser && users.length === 0) {
            loadUsers();
            setupWebsocket();
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
{:else}
  <div class="sidebar-container">
    {#if currentUser}
      <ViewSelector on:viewChange={viewChange} />
      <input bind:value={searchTerm} placeholder="Search" on:input={search} />
      {#if listLoading}
        <Spinner />
      {:else}
        <div class="users-list">
          <UsersList
            bind:apiService
            bind:users
            on:follow={follow}
            on:unfollow={unfollow}
          />
        </div>
      {/if}
    {:else}
      <p>Please log in to use VSCode tunes.</p>
      <button class="auth-btn" on:click={() => authenticate("spotify")}>
        Log in with Spotify
      </button>
    {/if}
  </div>
{/if}

<style>
  .sidebar-container {
    padding: 5px 15px;
  }
  .auth-btn {
    margin-top: 10px;
  }
  .users-list {
    margin-top: 15px;
  }
</style>
