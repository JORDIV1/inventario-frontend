import { authGuard } from "../auth/authGuard.js";
import { authService } from "../auth/authService.js";
import { roleUI } from "../auth/roleUI.js";
import { initTopCarosChart } from "../echarts/topCaros.js";
import { initTopValorChart } from "../echarts/topValorTotal.js";

class DashboardPage {
  constructor() {
    this.welcomeEl = document.getElementById("dashboard-welcome");
    this.logoutBtn = document.getElementById("logout-btn");
  }
  async init() {
    const user = await authGuard.requireAuth();

    if (!user) {
      return null;
    }

    roleUI.apply(user);
    await initTopCarosChart();
    await initTopValorChart();
    this.renderWelcome(user);
    this.bindEvents();
  }
  renderWelcome(user) {
    if (!this.welcomeEl) return;
    const rol = user.esAdmin() ? "Admin" : "Usuario";
    const nombre = user.nombre ? user.nombre : "Usuario";
    this.welcomeEl.textContent = `Bienvenid@ ${nombre}, Rol: ${rol}`;
  }
  bindEvents() {
    if (!this.logoutBtn) return;

    this.logoutBtn.addEventListener("click", async () => {
      await authService.logout();
      window.location.replace("/login.html");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dashboardPage = new DashboardPage();
  dashboardPage.init();
});
