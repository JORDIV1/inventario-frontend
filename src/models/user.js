const ROLES = { ADMIN: 1, USER: 2 };

export class User {
  constructor({
    id,
    nombre,
    email,
    rolId,
    createdAt = null,
    updatedAt = null,
  }) {
    if (!Number.isInteger(id) || id <= 0)
      throw new TypeError("USER_INVALID_ID");
    if (typeof nombre !== "string" || nombre.trim().length < 3)
      throw new TypeError("USER_INVALID_NAME");

    if (typeof email !== "string" || !email.includes("@"))
      throw new TypeError("USER_INVALID_EMAIL");
    if (!Number.isInteger(rolId) || rolId <= 0)
      throw new TypeError("USER_INVALID_ROL");
    this.id = id;
    this.nombre = nombre.trim();
    this.email = email.trim().toLowerCase();
    this.rolId = rolId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    Object.freeze(this);
  }
  static fromDTO(dto = {}) {
    if (!dto || typeof dto !== "object") {
      throw new Error("USER_DTO_REQUIRED");
    }
    return new this({
      id: dto.id,
      nombre: dto.nombre,
      email: dto.email,
      rolId: Number(dto.rolId),
      createdAt: dto.createdAt ?? null,
      updatedAt: dto.updatedAt ?? null,
    });
  }

  esAdmin() {
    return this.rolId === ROLES.ADMIN;
  }
  esUsuario() {
    return this.rolId === ROLES.USER;
  }
}
