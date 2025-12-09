import { usersApi } from "../api/usersApi.js";

class UsersService {
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
    const cleanPage = Number(page);
    const safePage =
      Number.isInteger(cleanPage) && cleanPage > 0 ? cleanPage : 1;
    const limit = this.meta.limit;
    const offset = (safePage - 1) * limit;

    const res = await usersApi.listPublic({
      limit,
      offset,
      orderBy: this.meta.orderBy,
      orderDir: this.meta.orderDir,
    });

    if (!res.ok) {
      throw new Error("USERS_LIST_FAILED");
    }

    const payload = res.data;
    if (!payload || !Array.isArray(payload.items) || !payload.meta) {
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

  async loadAvatar(file) {
    if (!file) {
      throw new Error("FILE_REQUIRED");
    }

    const res = await usersApi.createAvatar({ file });

    if (!res.ok) {
      throw new Error("USERS_AVATAR_FAILED");
    }
    const payload = res.data;

    return payload;
  }

  async toggleLike({ targetId }) {
    const res = await usersApi.toggleLike({ objetivoId: targetId });

    if (!res.ok) {
      throw new Error("USER_LIKE_FAILED");
    }

    const payload = res.data;

    return payload;
  }
}

export const usersService = new UsersService();
