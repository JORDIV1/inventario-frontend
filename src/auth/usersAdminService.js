import { usersApi } from "../api/usersApi";

class UsersAdmin {
  constructor() {
    this.items = [];
    this.meta = {
      total: 0,
      limit: 10,
      offset: 0,
      orderBy: "createdAt",
      orderDir: "DESC",
    };
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
    const cleanPage = Number(this.page);
    const safePage =
      Number.isInteger(cleanPage) && cleanPage > 0 ? cleanPage : 1;
    const limit = this.meta.limit;

    const offset = (safePage - 1) * limit;
    const res = await usersApi.listAdmin({
      limit,
      offset,
      orderBy: this.meta.orderBy,
      orderDir: this.meta.orderDir,
    });
    if (!res.ok) {
      throw new Error("USERS_LIST_ADMIN_FAILED");
    }

    const payload = res.data;
    if (!payload || !Array.from(payload.items) || !payload.meta) {
      throw new Error("USERS_LIST_INVALID_RESPONSE");
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

  async create({ nombre, email, password, rolId }) {
    const res = await usersApi.create({ nombre, email, password, rolId });
    if (!res.ok) {
      const backendCode = res.data?.error;

      switch (backendCode) {
        case "EMAIL_INVALID":
          throw new Error("EMAIL_INVALID");
        case "EMAIL_TAKEN":
          throw new Error("EMAIL_TAKEN");
        case "PASSWORD_WEAK":
          throw new Error("PASSWORD_WEAK");
        default:
          throw new Error("USER_CREATE_FAILED");
      }
    }
  }

  async updatedPartial(id, { nombre, email, rolId }) {
    const res = await usersApi.updatedPartial(id, { nombre, email, rolId });

    if (!res.ok) {
      const backendCode = res.data?.error;
      switch (backendCode) {
        case "EMAIL_TAKEN":
          throw new Error("EMAIL_TAKEN");
        default:
          throw new Error("USER_PATCH_FAILED");
      }
    }
  }
  async remove(id) {
    const res = await usersApi.remove(id);

    if (res.data?.error === "USER_IN_USE") {
      throw new Error("USER_IN_USE");
    }
    if (!res.ok) {
      throw new Error("USER_DELETE_FAILED");
    }
    return true;
  }
}

export const usersAdmin = new UsersAdmin();
