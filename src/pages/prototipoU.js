import { authGuard } from "../auth/authGuard.js";
import { authService } from "../auth/authService.js";
import { usersService } from "../auth/usersService.js";

class UsersPage {
  constructor() {
    // Header
    this.welcomeEl = document.getElementById("usuarios-welcome");

    // Tabla
    this.tableBody = document.getElementById("tbody-usuarios");

    // Filtros
    this.searchInput = document.getElementById("search");
    this.orderBySelect = document.getElementById("orderBy");
    this.orderDirSelect = document.getElementById("orderDir");
    this.pageSizeSelect = document.getElementById("pageSize");

    // Paginación
    this.btnPrev = document.getElementById("btn-prev");
    this.btnNext = document.getElementById("btn-next");
    this.pagingInfo = document.getElementById("usuarios-paging-info");

    // Alert y logout
    this.alertBox = document.getElementById("usuarios-alert");
    this.logoutBtn = document.getElementById("logout-btn");

    // Estado
    this.currentUser = null;
    this.searchTerm = "";
    // Estado local
    this.localItems = []; // para filtro local
  }

  async init() {
    try {
      const user = await authGuard.requireAuth("/login.html");
      if (!user) return null;
      this.currentUser = user;
      this.renderWelcome(user);
      const orderBy = this.orderBySelect.value || "createdAt";
      const orderDir = this.orderDirSelect.value || "DESC";
      const limit = Number(this.pageSizeSelect.value || 10);

      usersService.setOrdering({ orderBy, orderDir, limit });
      this.bindEvents();
      await this.loadAndRender(1);
      this.updatePagingButtons();
    } catch (err) {
      this.showError("No se pudieron cargar los usuarios.");
    }
  }
  renderWelcome(user) {
    const nombre = user.nombre;
    const rol = user.esAdmin() ? "Admin" : "Usuario";
    this.welcomeEl.textContent = `Hola ${nombre} Rol - ${rol}`;
  }
  hideError() {
    this.alertBox.textContent = "";
    this.alertBox.classList.add("d-none");
  }
  showError(message) {
    this.alertBox.textContent = message;
    this.alertBox.classList.remove("d-none");
  }
  async loadAndRender(page) {
    this.hideError();
    try {
      await usersService.loadPage(page);
      this.localItems = [...usersService.items];
      this.renderTable(this.localItems);
      this.applyLocalFilter();
    } catch (err) {
      console.error(err);
    }
  }
  applyLocalFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    const base = this.localItems || [];
    if (!term) {
      this.renderTable(base);
      return;
    }
    const filtrado = base.filter((item) => {
      const nombre = String(item.nombre ?? "").toLowerCase();
      return nombre.includes(term);
    });
    this.renderTable(filtrado);
  }
  renderTable(items) {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = "";
    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.className = "text-center text-muted py-4";
      td.textContent = "No hay usuarios para mostrar";
      tr.appendChild(td);
      this.tableBody.appendChild(tr);
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const user of items) {
      const tr = document.createElement("tr");
      tr.dataset.id = String(user.id);

      const tdId = document.createElement("td");
      tdId.textContent = String(user.id);
      tr.appendChild(tdId);

      const tdNombre = document.createElement("td");
      tdNombre.textContent = user.nombre;
      tr.appendChild(tdNombre);

      const tdRol = document.createElement("td");
      const rol = user.rolId === 1 ? "Administrador" : "Usuario";
      tdRol.textContent = rol;
      tr.appendChild(tdRol);

      const tdFecha = document.createElement("td");
      if (user.createdAt) {
        const fecha = new Date(user.createdAt);
        tdFecha.textContent = fecha.toLocaleString("es-CO");
      } else {
        tdFecha.textContent = "-";
      }
      tr.appendChild(tdFecha);

      fragment.appendChild(tr);
    }

    this.tableBody.appendChild(fragment);
  }
  updatePagingButtons() {
    if (this.btnPrev) {
      this.btnPrev.disabled = !usersService.hasPrev;
    }
    if (this.btnNext) {
      this.btnNext.disabled = !usersService.hasNext;
    }
  }

  bindEvents() {
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", async () => {
        try {
          await authService.logout();
        } finally {
          window.location.replace("/login.html");
        }
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => {
        this.searchTerm = this.searchInput.value;
        this.applyLocalFilter();
      });
    }

    const handleOrderingChange = async () => {
      const orderBy = this.orderBySelect.value || "createdAt";
      const orderDir = this.orderDirSelect.value || "DESC";
      const limit = Number(this.pageSizeSelect.value || 10);
      usersService.setOrdering({ orderBy, orderDir, limit });
      await this.loadAndRender(1);
    };
    if (this.orderBySelect) {
      this.orderBySelect.addEventListener("change", handleOrderingChange);
    }
    if (this.orderDirSelect) {
      this.orderDirSelect.addEventListener("change", handleOrderingChange);
    }
    if (this.pageSizeSelect) {
      this.pageSizeSelect.addEventListener("change", handleOrderingChange);
    }
    if (this.btnPrev) {
      this.btnPrev.addEventListener("click", async () => {
        if (!usersService.hasPrev) return;
        await this.loadAndRender(usersService.page - 1);
      });
    }
    if (this.btnNext) {
      this.btnNext.addEventListener("click", async () => {
        if (!usersService.hasNext) return;
        await this.loadAndRender(usersService.page + 1);
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const usersPage = new UsersPage();
  usersPage.init();
});
