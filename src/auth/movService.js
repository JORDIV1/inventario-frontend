import { movimientoApi } from "../api/movApi.js";

class MovService {
  constructor() {
    this.items = [];
    this.meta = {
      total: 0,
      limit: 0,
      offset: 0,
      orderBy: "fecha",
      orderDir: "DESC",
    };
    this.page = 1;
  }

  get hasPrev() {
    return this.page > 1;
  }

  get hasNext() {
    if (!this.meta) return false;
    const { offset, total } = this.meta;
    return offset + this.items.length < total;
  }

  setOrdering({ limit, orderBy, orderDir }) {
    if (limit != null) this.meta.limit = Number(limit);
    if (orderBy) this.meta.orderBy = orderBy;
    if (orderDir) this.meta.orderDir = orderDir;
    this.page = 1;
  }

  async loadPage(page = 1) {
    const cleanPage = Number(page);
    const safePage =
      Number.isInteger(cleanPage) && cleanPage > 0 ? cleanPage : 1;
    const limit = this.meta.limit;
    const offset = (safePage - 1) * limit;

    const res = await movimientoApi.historialProductoUsuario({
      limit,
      offset,
      orderBy: this.meta.orderBy,
      orderDir: this.meta.orderDir,
    });
    if (!res.ok) {
      throw new Error("MOVIMIENTOS_LIST_FAILED");
    }
    const payload = res.data;
    if (!payload || !Array.isArray(payload.items) || !payload.meta) {
      throw new Error("MOVIMIENTOS_LIST_INVALID_RESPONSE");
    }
    const items = payload.items || [];
    const meta = payload.meta;
    this.items = items;
    this.meta = {
      ...this.meta,
      ...meta,
    };

    this.page = safePage;
  }
  exportToCSV() {
    return movimientoApi.getExportCsv();
  }
}

export const movimientoService = new MovService();
