export class ApiService {
  public accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getMe() {
    const response = await fetch(`${apiBaseUrl}/me`, {
      headers: {
        authorization: `Bearer ${this.accessToken}`,
      },
    });
    if (response.status === 200) {
      const data = await response.json();
      return data.user;
    }
  }

  async getUsers(view: String, offset = 0) {
    const responseList = await fetch(
      `${apiBaseUrl}/users?view=${view}&limit=50&offset=${offset}`,
      {
        headers: {
          authorization: `Bearer ${this.accessToken}`,
        },
      }
    );
    if (responseList.status === 200) {
      const data = await responseList.json();
      return data.users;
    }
  }

  async putFollowed(uuid: string) {
    const response = await fetch(`${apiBaseUrl}/me/followed`, {
      method: "PUT",
      body: JSON.stringify({ user_uuid: uuid }),
      headers: {
        authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 200) {
      const data = await response.json();
      return data.followed;
    }
  }

  async deleteFollowed(uuid: string) {
    const response = await fetch(`${apiBaseUrl}/me/followed/${uuid}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${this.accessToken}`,
      },
    });
    if (response.status === 200) {
      const data = await response.json();
      return data.followed;
    }
  }
}
