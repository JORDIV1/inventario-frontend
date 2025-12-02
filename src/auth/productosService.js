import { productosApi } from "../api/productosApi.js";

class ProductosService {
  constructor() {
    //estado de la lista
    this.meta = null;
    this.items = [];
    //parametros de consulta
    this.page = 1;
    this.limit = 10;
    this.orderBy = "createdAt";
    this.orderDir = "DESC";
  }

  get hasPrev() {
    return this.page > 1;
  }
  get hasNext() {
    if (!this.meta) return false;
    const { total, offset } = this.meta;
    // Si offset + cantidad actual < total, hay siguiente página
    return offset + this.items.length < total;
  }
  /**
   * Cambia orden / límite y resetea a página 1.
   */
  setOrdering({ orderBy, orderDir, limit }) {
    if (orderBy) this.orderBy = orderBy;
    if (orderDir) this.orderDir = orderDir;
    if (limit != null) this.limit = Number(limit);
    this.page = 1;
  }
  /**
   * Carga una página desde el backend.
   */
  async loadPage(page = 1) {
    this.page = page;
    const offset = (this.page - 1) * this.limit;
    const res = await productosApi.list({
      limit: this.limit,
      offset: offset,
      orderBy: this.orderBy,
      orderDir: this.orderDir,
    });

    if (!res.ok) {
      throw new Error("PRODUCTS_LIST_FAILED");
    }
    const payload = res.data;
    if (!payload || !Array.isArray(payload.items) || !payload.meta) {
      throw new Error("PRODUCTS_LIST_INVALID_RESPONSE");
    }
    this.items = payload.items;

    this.meta = payload.meta;
    return {
      items: this.items,
      meta: this.meta,
    };
  }
  /**
   * Crear producto
   */

  async create({ nombre, precioCents, stock, categoriaId, nota }) {
    const res = await productosApi.create({
      nombre: nombre,
      precioCents: precioCents,
      stock: stock,
      categoriaId: categoriaId,
      nota,
    });
    console.warn(res.data);

    if (res.data?.error === "PRODUCT_NAME_TOO_SHORT") {
      throw new Error("PRODUCT_NAME_TOO_SHORT");
    }
    if (!res.ok) {
      throw new Error("PRODUCT_CREATE_FAILED");
    }
  }
  /**
   * Actualizar producto (PATCH) y recargar página actual.
   */
  async patch(id, { nombre, precioCents, stock, categoriaId, nota }) {
    const res = await productosApi.patch(id, {
      nombre: nombre,
      precioCents: precioCents,
      stock: stock,
      categoriaId: categoriaId,
      nota,
    });
    console.log(res);

    if (!res.ok) {
      throw new Error("PRODUCT_UPDATE_FAILED");
    }
  }
  async remove(id) {
    const res = await productosApi.remove(id);
    const code = res.data?.error;

    if (code === "PRODUCT_IN_USE") {
      throw new Error("PRODUCT_HAS_MOVEMENTS");
    }

    if (!res.ok) {
      throw new Error("PRODUCT_DELETE_FAILED");
    }
  }
  async topMasCaros() {
    const res = await productosApi.getTopMasCaros({ limit: 5 });
    if (!res.ok) {
      throw new Error("PRODUCT_TOP_CAROS_FAILED");
    }
    const payload = res.data;

    return payload.items;
  }

  async TopValorTotal() {
    const res = await productosApi.getTopValorTotal({ limit: 5 });

    if (!res.ok) {
      throw new Error("PRODUCT_TOP_VALOR_TOTAL_FAILED");
    }
    const payload = res.data;

    return payload.items;
  }
  exportToCSV() {
    return productosApi.getExportCsv();
  }
}

export const productosService = new ProductosService();
