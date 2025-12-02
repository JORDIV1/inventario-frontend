import { authGuard } from "../auth/authGuard.js";
import { authService } from "../auth/authService.js";
import { usersService } from "../auth/usersService.js";

export class UsersPage {
  constructor() {
    // Header
    this.welcomeEl = document.getElementById("usuarios-welcome");

    // Grid
    this.grid = document.getElementById("usuarios-grid");

    // Filtros
    this.searchInput = document.getElementById("search");
    this.orderBySelect = document.getElementById("orderBy");
    this.orderDirSelect = document.getElementById("orderDir");
    this.pageSizeSelect = document.getElementById("pageSize");

    // Paginación
    this.btnPrev = document.getElementById("btn-prev");
    this.btnNext = document.getElementById("btn-next");
    this.pagingInfo = document.getElementById("paging-info");

    // Alert y logout
    this.alertBox = document.getElementById("usuarios-alert");
    this.logoutBtn = document.getElementById("logout-btn");

    // Estado
    this.currentUser = null;
    this.searchTerm = "";
    this.localItems = [];
  }

  async init() {
    try {
      const user = await authGuard.requireAuth("/login.html");
      if (!user) return;

      this.currentUser = user;
      this.renderWelcome(user);

      const orderBy = this.orderBySelect.value || "createdAt";
      const orderDir = this.orderDirSelect.value || "DESC";
      const limit = Number(this.pageSizeSelect.value || 20);

      usersService.setOrdering({ orderBy, orderDir, limit });

      this.bindEvents();
      await this.loadAndRender(1);
    } catch (err) {
      this.showError("No se pudieron cargar los usuarios.");
    }
  }

  renderWelcome(user) {
    const rol = user.esAdmin?.() ? "Admin" : "Usuario";
    this.welcomeEl.textContent = `Hola ${user.nombre} Rol - ${rol}`;
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
      this.applyLocalFilter();
      this.updatePagingButtons();
      this.pagingInfo.textContent = `Página ${usersService.page}`;
    } catch (err) {
      this.showError("Error cargando usuarios.");
    }
  }

  updatePagingButtons() {
    this.btnPrev.disabled = !usersService.hasPrev;
    this.btnNext.disabled = !usersService.hasNext;
  }

  applyLocalFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    const base = this.localItems || [];

    if (!term) {
      this.renderCards(base);
      return;
    }

    const filtrado = base.filter((u) =>
      String(u.nombre ?? "")
        .toLowerCase()
        .includes(term)
    );

    this.renderCards(filtrado);
  }

  renderCards(items) {
    if (!this.grid) return;
    this.grid.innerHTML = "";

    if (!items.length) {
      this.grid.innerHTML = `
        <div class="col">
          <div class="text-center text-muted py-4">
            No hay usuarios para mostrar.
          </div>
        </div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const user of items) {
      const col = document.createElement("div");
      col.className = "col";

      const card = document.createElement("div");
      card.className = "card shadow-sm h-100";

      const body = document.createElement("div");
      body.className = "card-body";

      const title = document.createElement("h5");
      title.className = "card-title mb-1";
      title.textContent = user.nombre;

      const rol = document.createElement("p");
      rol.className = "card-subtitle text-muted mb-2";
      rol.textContent = user.rolId === 1 ? "Administrador" : "Usuario";

      const fecha = document.createElement("p");
      fecha.className = "card-text small text-muted";
      if (user.createdAt) {
        fecha.textContent =
          "Creado: " + new Date(user.createdAt).toLocaleDateString("es-CO");
      } else {
        fecha.textContent = "Creado: -";
      }

      body.appendChild(title);
      body.appendChild(rol);
      body.appendChild(fecha);
      card.appendChild(body);
      col.appendChild(card);
      fragment.appendChild(col);
    }

    this.grid.appendChild(fragment);
  }

  bindEvents() {
    // Logout
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", async () => {
        try {
          await authService.logout();
        } finally {
          window.location.replace("/login.html");
        }
      });
    }

    // Filtro
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => {
        this.searchTerm = this.searchInput.value;
        this.applyLocalFilter();
      });
    }

    const handleOrderingChange = async () => {
      const orderBy = this.orderBySelect.value || "createdAt";
      const orderDir = this.orderDirSelect.value || "DESC";
      const limit = Number(this.pageSizeSelect.value || 20);

      usersService.setOrdering({ orderBy, orderDir, limit });
      await this.loadAndRender(1);
    };

    this.orderBySelect?.addEventListener("change", handleOrderingChange);
    this.orderDirSelect?.addEventListener("change", handleOrderingChange);
    this.pageSizeSelect?.addEventListener("change", handleOrderingChange);

    // Paginación
    this.btnPrev?.addEventListener("click", async () => {
      if (!usersService.hasPrev) return;
      await this.loadAndRender(usersService.page - 1);
    });

    this.btnNext?.addEventListener("click", async () => {
      if (!usersService.hasNext) return;
      await this.loadAndRender(usersService.page + 1);
    });
  }
}

new UsersPage().init();
