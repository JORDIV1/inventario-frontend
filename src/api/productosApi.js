import { apiClient, DEFAULT_BASE_URL } from "./apiClient.js";

class ProductosApi {
  async create({ nombre, precioCents, stock, categoriaId, nota }) {
    return apiClient.post("/productos", {
      nombre,
      stock,
      precioCents,
      categoriaId,
      nota,
    });
  }
  async list({ limit, offset, orderBy, orderDir }) {
    return apiClient.get("/productos", {
      params: { limit, offset, orderBy, orderDir },
    });
  }
  async getTopMasCaros({ limit }) {
    return apiClient.get("/productos/top-caros", {
      params: { limit },
    });
  }
  async getTopValorTotal({ limit }) {
    return apiClient.get("/productos/top-valor-total", {
      params: { limit },
    });
  }
  async patch(id, { nombre, precioCents, stock, categoriaId, nota }) {
    return apiClient.patch(`/productos/${id}`, {
      nombre,
      precioCents,
      stock,
      categoriaId,
      nota,
    });
  }

  async remove(id) {
    return apiClient.delete(`/productos/${id}`);
  }

  getExportCsv() {
    return `${DEFAULT_BASE_URL}/productos/export`;
  }
}
export const productosApi = new ProductosApi();
