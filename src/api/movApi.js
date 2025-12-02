import { apiClient, DEFAULT_BASE_URL } from "./apiClient.js";

class MovApi {
  async historialProductoUsuario({ limit, offset, orderBy, orderDir }) {
    return apiClient.get("/movimientos", {
      params: { limit, offset, orderBy, orderDir },
    });
  }
  getExportCsv() {
    return `${DEFAULT_BASE_URL}/movimientos/export`;
  }
}

export const movimientoApi = new MovApi();
