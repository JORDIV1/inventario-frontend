import { apiClient } from "./apiClient.js";
class UsersApi {
  async listPublic({ limit, offset, orderBy, orderDir } = {}) {
    return apiClient.get("/usuarios/public", {
      params: { limit, offset, orderBy, orderDir },
    });
  }
  async listAdmin({ limit, offset, orderBy, orderDir }) {
    return apiClient.get("/usuarios/admin", {
      params: { limit, offset, orderBy, orderDir },
    });
  }

  async create({ nombre, email, password, rolId }) {
    return apiClient.post("/usuarios/admin", {
      nombre,
      email,
      password,
      rolId,
    });
  }
  async updatedPartial(id, { nombre, email, rolId }) {
    return apiClient.patch(`usuarios/admin/${id}`, {
      nombre,
      email,
      rolId,
    });
  }

  async createAvatar({ file }) {
    const formData = new FormData();
    formData.append("avatar", file);
    return apiClient.post("usuarios/me/avatar", formData);
  }

  async remove(id) {
    return apiClient.delete(`usuarios/admin/${id}`);
  }
}

export const usersApi = new UsersApi();
