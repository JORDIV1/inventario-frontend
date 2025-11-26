import { apiClient } from "./apiClient.js";

class CategoriasApi {
  async create({ nombre }) {
    return apiClient.post("/categorias", { nombre });
  }
  async list({ limit, offset, orderBy, orderDir } = {}) {
    return apiClient.get("/categorias", {
      params: { limit, offset, orderBy, orderDir },
    });
  }
  async patch(id, { nombre }) {
    return apiClient.patch(`/categorias/${id}`, {
      nombre,
    });
  }
  async remove(id) {
    return apiClient.delete(`/categorias/${id}`);
  }
}

export const categoriasApi = new CategoriasApi();
