import { apiClient } from "./apiClient.js";

class ProductosApi {
  async create({ nombre, precioCents, stock, categoriaId }) {
    return apiClient.post("/productos", {
      nombre,
      stock,
      precioCents,
      categoriaId,
    });
  }
  async list({ limit, offset, orderBy, orderDir }) {
    return await apiClient.get("/productos", {
      params: { limit, offset, orderBy, orderDir },
    });
  }
  async patch(id, { nombre, precioCents, stock, categoriaId }) {
    return apiClient.patch(`/productos/${id}`, {
      nombre,
      precioCents,
      stock,
      categoriaId,
    });
  }

  async remove(id) {
    return apiClient.delete(`/productos/${id}`);
  }
}
export const productosApi = new ProductosApi();
