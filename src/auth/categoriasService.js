import { categoriasApi } from "../api/categoriasApi.js";

class CategoriasService {
  constructor() {
    //estado de la lista
    this.items = [];
    this.meta = {
      total: 0,
      limit: 10,
      offset: 0,
      orderBy: "createdAt",
      orderDir: "DESC",
    };
    //parametros
    this.page = 1;
  }

  get hasPrev() {
    return this.page > 1;
  }

  get hasNext() {
    if (!this.meta) return false;
    const { total, offset } = this.meta;
    return offset + this.items.length < total;
  }

  setOrdering({ orderBy, orderDir, limit }) {
    if (orderBy) this.meta.orderBy = orderBy;
    if (orderDir) this.meta.orderDir = orderDir;
    if (limit != null) this.meta.limit = Number(limit);
    this.page = 1;
  }
  async loadPage(page = 1) {
    const cleanPage = Number(page);
    const safePage =
      Number.isInteger(cleanPage) && cleanPage > 0 ? cleanPage : 1;
    const limit = this.meta.limit;

    const offset = (safePage - 1) * limit;

    const res = await categoriasApi.list({
      limit: limit,
      offset: offset,
      orderBy: this.meta.orderBy,
      orderDir: this.meta.orderDir,
    });

    if (!res.ok) {
      throw new Error("CATEGORIES_LIST_FAILED");
    }
    const payload = res.data;

    if (!payload || !Array.isArray(payload.items) || !payload.meta) {
      throw new Error("CATEGORIES_LIST_INVALID_RESPONSE");
    }

    const items = payload.items;
    const meta = payload.meta;

    this.items = items;

    this.meta = {
      ...this.meta,
      ...meta,
    };
    this.page = safePage;
  }
  async create({ nombre }) {
    const res = await categoriasApi.create({ nombre });
    if (!res.ok) {
      throw new Error("CATEGORY_CREATE_FAILED");
    }
  }
  async patch(id, { nombre }) {
    if (!Number.isInteger(id) || id <= 0) {
      throw Error("CATEGORIA_UPDATE_INVALID_ID");
    }
    const res = await categoriasApi.patch(id, { nombre });
    if (!res.ok) {
      throw new Error("CATEGORY_UPDATE_FAILED");
    }
  }
  async remove(id) {
    if (!Number.isInteger(id) || id <= 0) {
      throw Error("CATEGORIA_DELETE_INVALID_ID");
    }
    const res = await categoriasApi.remove(id);
    if (!res.ok) {
      throw new Error("CATEGORY_DELETE_FAILED");
    }
    return true;
  }
}
export const categoriasService = new CategoriasService();
