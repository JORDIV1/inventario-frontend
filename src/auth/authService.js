/**
 * AuthService
 *  - Usa cookies HttpOnly de forma implícita via ApiClient - fetch credentials: "include")
 *  - Mantiene en memoria al usuario autenticado (currentUser)
 *  - No toca tokens ni localStorage.
 */

import { authApi } from "../api/authApi.js";
import { User } from "../models/user.js";

export class AuthService {
  #currentUser = null;

  getCurrentUser() {
    return this.#currentUser;
  }

  isAuthenticated() {
    return this.#currentUser instanceof User;
  }

  async register({ nombre, email, password }) {
    const cleanNombre = String(nombre ?? "").trim();
    const cleanEmail = String(email ?? "")
      .trim()
      .toLowerCase();
    const passwordClean = String(password);

    if (!cleanEmail || !cleanEmail.includes("@") || cleanEmail.length < 5) {
      throw new TypeError("USER_INVALID_EMAIL");
    }
    if (!cleanNombre || cleanNombre.length < 3) {
      throw new TypeError("USER_INVALID_NAME");
    }
    if (passwordClean.length < 10) {
      throw new RangeError("PASSWORD_TOO_SHORT");
    }
    //al menos 1 mayúscula y 1 dígito
    if (!/[A-Z]/.test(passwordClean) || !/\d/.test(passwordClean)) {
      throw new RangeError("PASSWORD_WEAK");
    }

    const res = await authApi.register({
      nombre: cleanNombre,
      email: cleanEmail,
      password: passwordClean,
    });
    if (!res.ok) {
      const code = res.data?.error || res.status;
      switch (code) {
        case "EMAIL_INVALID":
          throw new Error("EMAIL_INVALID");
        case "EMAIL_TAKEN":
          throw new Error("EMAIL_TAKEN");
        case "PASSWORD_WEAK":
          throw new Error("PASSWORD_WEAK");

        case 400:
        case "REGISTER_BAD_REQUEST":
          throw new Error("REGISTER_BAD_REQUEST");

        case 503:
        case "AUTH_REPO_UNAVAILABLE":
          throw new Error("AUTH_SERVICE_UNAVAILABLE");

        default:
          throw new Error("REGISTER_FAILED");
      }
    }
    const payload = res.data;
    if (!payload.ok || !payload.user) {
      throw new Error("REGISTER_RESPONSE_INVALID");
    }
    const user = payload.user;
    this.#currentUser = User.fromDTO(user);
    return user;
  }

  async login({ email, password }) {
    const cleanEmail = String(email ?? "")
      .trim()
      .toLowerCase();
    if (!cleanEmail || !password) {
      throw new TypeError("LOGIN_CREDENTIALS_REQUIRED");
    }
    if (!cleanEmail.includes("@")) {
      throw new TypeError("USER_INVALID_EMAIL");
    }

    const res = await authApi.login({ email: cleanEmail, password });
    if (!res.ok) {
      const code = res.data?.error || res.status;
      switch (code) {
        case "INVALID_CREDENTIALS":
        case 401:
          throw new Error("INVALID_CREDENTIALS");
        case 400:
          throw new Error("LOGIN_BAD_REQUEST");
        case 503:
          throw new Error("AUTH_SERVICE_UNAVAILABLE");
        default:
          throw new Error("LOGIN_FAILED");
      }
    }
    const payload = res.data;

    if (!payload.ok || !payload.user) {
      throw new Error("LOGIN_RESPONSE_INVALID");
    }
    const user = User.fromDTO(payload.user);
    this.#currentUser = user;

    return user;
  }
  /**
   * Carga la sesión a partir de /auth/profile.
   *  simpre llamarlo al inicio de cada página protegida.
   *  - GET /auth/profile con cookies.
   *  - Si 200 + { ok: true, user } set currentUser.
   *  - Si 401  - no hay sesión - currentUser = null.
   *  - No redirige aquí; deja esa decisión a la capa que lo use guards/UI.
   */
  async loadSessionFromProfile() {
    if (this.#currentUser) return this.#currentUser;
    let res;
    try {
      res = await authApi.profile();
    } catch (err) {
      this.#currentUser = null;
      return null;
    }
    if (res.status === 401) {
      this.#currentUser = null;
      return null;
    }

    const payload = res.data;
    if (!payload?.ok || !payload?.user) {
      this.#currentUser = null;
      return null;
    }

    const user = User.fromDTO(payload.user);

    this.#currentUser = user;
    return user;
  }

  async logout() {
    try {
      await authApi.logout();
    } catch (error) {}
    this.#currentUser = null;
  }
}

export const authService = new AuthService();
