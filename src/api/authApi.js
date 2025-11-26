import { apiClient } from "./apiClient.js";

/**
 * Capa  HTTP para endpoints de autenticación.
 * No conoce POO de dominio, ni redirecciones, ni UI.
 * Solo hace llamadas a /auth/* y devuelve la respuesta estándar del ApiClient.
 */
export class AuthApi {
  /**
   * POST /auth/login
   * El backend:
   *  - Valida credenciales
   *  - Setea cookies HttpOnly (access_token, refresh_token)
   *  - Devuelve { ok: true, user }
   */
  async login({ email, password }) {
    return apiClient.post("/auth/login", { email, password });
  }
  /**
   * POST /auth/register
   * body: { nombre, email, password }
   * Backend:
   *  - Crea usuario
   *  - Setea cookies
   *  - Devuelve { ok: true, user }
   */
  async register({ nombre, email, password }) {
    return apiClient.post("/auth/register", { nombre, email, password });
  }
  /**
   * GET /auth/profile
   * Protegida con guard.
   * Si la cookie access_token es válida { ok: true, user }
   * Si  401 { ok: false, error: "UNAUTHORIZED" }
   */
  async profile() {
    return apiClient.get("/auth/profile");
  }
  /**
   * POST /auth/refresh
   * Usa refresh_token - cookie HttpOnly para emitir nuevo access_token..
   */
  async refresh() {
    return apiClient.post("/auth/refresh");
  }
  /**
   * POST /auth/logout
   * El backend:
   *  - Borrar cookies access_token y refresh_token
   *  - Responder { ok: true }
   */
  async logout() {
    return apiClient.post("/auth/logout");
  }
}

export const authApi = new AuthApi();
