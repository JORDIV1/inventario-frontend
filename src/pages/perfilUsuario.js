import { DEFAULT_BASE_URL } from "../api/apiClient.js";
import { authGuard } from "../auth/authGuard.js";
import { usersService } from "../auth/usersService.js";

class Perfilusuario {
  constructor() {
    this.avatarImg = document.getElementById("avatar-img");
    this.avatarInput = document.getElementById("avatarInput");
    this.avatarUploadBtn = document.getElementById("avatarUploadBtn");
    this.logoutBtn = document.getElementById("logout-btn");
    this.nombreInput = document.getElementById("perfil-nombre");
    this.emailInput = document.getElementById("perfil-email");
    this.welcomeEl = document.getElementById("perfil-welcome");
    this.errorEl = document.getElementById("perfil-error");
    this.msgFoto = document.getElementById("foto-subida");
    this.currentUser = null;
  }

  async init() {
    try {
      const user = await authGuard.requireAuth();
      if (!user) return null;
      this.currentUser = user;

      this.renderWelcome(user);
      this.bindEvents();
      this.loadAndRender();
    } catch (err) {
      this.showError("Error al cargar perfil");
    }
  }
  renderWelcome(user) {
    const rol = user.esAdmin() ? "Admin" : "Usuario";
    this.welcomeEl.textContent = `Hola ${user.nombre} Rol: ${rol}`;
  }
  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.classList.remove("d-none");
  }
  showSuccessMessage(message) {
    if (!this.msgFoto) return;
    this.msgFoto.textContent = message;
    this.msgFoto.classList.remove("d-none", "fade-out");
    setTimeout(() => {
      this.msgFoto.classList.add("fade-out");
      setTimeout(() => {
        this.msgFoto.classList.add("d-none");
      }, 800);
    }, 3000);
  }
  hideError() {
    this.errorEl.textContent = "";
    this.errorEl.classList.add("d-none");
  }
  async handleAvatarUpload() {
    const file = this.avatarInput.files?.[0];
    if (!file) {
      alert("Selecciona una imagen");
      return;
    }

    try {
      await usersService.loadAvatar(file);
      const avatarUrl = `${DEFAULT_BASE_URL}/usuarios/${this.currentUser.id}/avatar`;
      this.avatarImg.src = `${avatarUrl}?v=${Date.now()}`;
      this.showSuccessMessage("Foto actualizada correctamente");
    } catch (err) {
      this.showError("No se pudo subir el avatar");
    }
  }
  loadAndRender() {
    this.hideError();
    const { id, nombre, email } = this.currentUser;

    if (this.avatarImg && id) {
      const avatarUrl = `${DEFAULT_BASE_URL}/usuarios/${id}/avatar`;
      this.avatarImg.onerror = () => {
        this.avatarImg.onerror = null;
        this.avatarImg.src = "/placeholder-avatar.png";
      };
      this.avatarImg.src = `${avatarUrl}?v=${Date.now()}`;
    }
    this.nombreInput.value = nombre ?? "";
    this.emailInput.value = email ?? "";
  }

  bindEvents() {
    this.avatarUploadBtn?.addEventListener("click", async () => {
      const btn = this.avatarUploadBtn;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Subiendo...";
      }
      try {
        await this.handleAvatarUpload();
      } catch (err) {
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Subir nueva foto";
        }
      }
    });
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", async () => {
        try {
          await authService.logout();
        } finally {
          window.location.replace("/login.html");
        }
      });
    }
    this.avatarInput?.addEventListener("change", () => {
      const file = this.avatarInput.files?.[0];
      if (!file) return;

      const localUrl = URL.createObjectURL(file);
      this.avatarImg.src = localUrl;
    });
  }
}

new Perfilusuario().init();
