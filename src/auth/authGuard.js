// src/auth/authGuards.js
import { authService } from "./authService.js";

class AuthGuard {
  async requireAuth({ redirectTo = "/login.html" } = {}) {
    let user;
    try {
      user = await authService.loadSessionFromProfile();
    } catch (err) {
      if (err.network) {
        alert("Conexión inestable, intenta de nuevo");
        return null;
      }
      throw err;
    }
    if (!user) {
      window.location.replace(redirectTo);
      return null;
    }
    return user;
  }

  async requireAdmin({
    redirectIfNoAuth = "/login.html",
    redirectIfNotAdmin = "/unauthorized.html",
  } = {}) {
    let user;
    try {
      user = await authService.loadSessionFromProfile();
    } catch (err) {
      if (err.network) {
        alert("Conexión inestable, intenta de nuevo");
        return null;
      }
      throw err;
    }
    if (!user) {
      window.location.replace(redirectIfNoAuth);
      return null;
    }
    if (!user.esAdmin()) {
      window.location.replace(redirectIfNotAdmin);
      return null;
    }
    return user;
  }
}

export const authGuard = new AuthGuard();
