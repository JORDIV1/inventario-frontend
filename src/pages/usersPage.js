import { DEFAULT_BASE_URL } from "../api/apiClient.js";
import { authGuard } from "../auth/authGuard.js";
import { authService } from "../auth/authService.js";
import { usersService } from "../auth/usersService.js";
import "../tailwind.css";
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
      console.log(err);

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

    for (const user of items) {
      user.avatarUrl = user.avatar
        ? `${DEFAULT_BASE_URL}/usuarios/${user.id}/avatar?v=${Date.now()}`
        : "/placeholder-avatar.png";
    }

    const fragment = document.createDocumentFragment();

    for (const user of items) {
      const col = document.createElement("div");
      col.className = "col-12 col-sm-6 col-md-4 col-lg-3 mb-4";

      const card = document.createElement("div");
      card.className =
        "card user-feed-card h-100 border-0 rounded-4 " +
        "shadow-[0_18px_40px_rgba(15,23,42,0.10)] bg-slate-100";

      const imgWrapper = document.createElement("div");
      imgWrapper.className = "user-feed-wrapper overflow-hidden";

      const img = document.createElement("img");

      img.className = user.avatar
        ? "user-feed-img"
        : "user-feed-img user-feed-img--placeholder";

      img.src = user.avatarUrl;
      img.alt = user.nombre;

      imgWrapper.appendChild(img);
      card.appendChild(imgWrapper);
      //OJO AQUI , TAILWIND
      const body = document.createElement("div");
      body.className =
        "card-body d-flex flex-column justify-content-between pt-3 pb-3";

      const title = document.createElement("h5");
      title.className =
        "mb-1 text-sm font-semibold text-slate-900 tracking-tight";
      title.textContent = user.nombre;
      //rol y like juntos
      const topRow = document.createElement("div");
      topRow.className =
        "d-flex justify-content-between align-items-center gap-2 mb-2";

      const rol = document.createElement("span");
      let rolClasses =
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold " +
        "tracking-wide uppercase shadow-sm border ";

      if (user.rolId === 1) {
        rolClasses +=
          "bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent " +
          "border-sky-400 text-sky-900 user-role-admin";
        rol.textContent = "Administrador";
      } else {
        rolClasses += "bg-slate-100 border-slate-300 text-slate-700";
        rol.textContent = "Usuario";
      }
      rol.className = rolClasses;

      const likeBtn = document.createElement("button");
      likeBtn.type = "button";
      likeBtn.className =
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium " +
        "border border-red-300 text-red-600 bg-red-50 " +
        "hover:bg-red-100 hover:border-red-400 " +
        "transition-colors duration-150";
      likeBtn.dataset.action = "like";
      likeBtn.dataset.userId = String(user.id);
      likeBtn.dataset.liked = String(user.likedByMe);

      const likeLabel = document.createElement("span");
      likeLabel.dataset.role = "like-label";
      likeLabel.textContent = user.likedByMe ? "❤️ Unlike" : "❤️ Like";

      const likeCount = document.createElement("span");
      likeCount.dataset.role = "like-count";
      likeCount.className = "like-anim ms-1 text-[11px] text-slate-500";
      likeCount.textContent = String(user.likesCount);

      likeBtn.appendChild(likeLabel);
      likeBtn.appendChild(likeCount);

      topRow.appendChild(rol);
      topRow.appendChild(likeBtn);

      const fecha = document.createElement("p");
      fecha.className = "card-text small text-muted";
      fecha.textContent = user.createdAt
        ? "Creado: " + new Date(user.createdAt).toLocaleDateString("es-CO")
        : "Creado: -";

      body.appendChild(title);
      body.appendChild(topRow);

      body.appendChild(fecha);

      card.appendChild(body);
      col.appendChild(card);
      fragment.appendChild(col);
    }

    this.grid.appendChild(fragment);
  }
  updateLikeDOM(btn, liked, likesCount) {
    btn.dataset.liked = String(liked);

    const label = btn.querySelector("[data-role='like-label']");
    label.textContent = liked ? "❤️ Unlike" : "❤️ Like";

    const countSpan = btn.querySelector("[data-role='like-count']");
    countSpan.textContent = String(likesCount);
    countSpan.classList.add("pop");
    setTimeout(() => {
      countSpan.classList.remove("pop");
    }, 150);
    countSpan.classList.add("like-shake");
    setTimeout(() => {
      countSpan.classList.remove("like-shake");
    }, 180);
    if (liked) {
      btn.classList.remove(
        "bg-red-50",
        "text-red-600",
        "hover:bg-red-100",
        "hover:border-red-400",
        "border-red-300"
      );

      btn.classList.add(
        "bg-gray-100",
        "text-gray-600",
        "hover:bg-gray-200",
        "hover:border-gray-400",
        "border-gray-400"
      );
    } else {
      btn.classList.remove(
        "bg-gray-100",
        "text-gray-600",
        "hover:bg-gray-200",
        "hover:border-gray-400",
        "border-gray-400"
      );

      btn.classList.add(
        "bg-red-50",
        "text-red-600",
        "hover:bg-red-100",
        "hover:border-red-400",
        "border-red-300"
      );
    }
  }
  bindEvents() {
    this.grid.addEventListener("click", async (e) => {
      const target = e.target;
      const btn = target.closest("button[data-action='like']");
      if (!btn) {
        return;
      }
      const userId = Number(btn.dataset.userId);

      btn.disabled = true;
      try {
        const { liked, likesCount } = await usersService.toggleLike({
          targetId: userId,
        });
        this.updateLikeDOM(btn, liked, likesCount);
      } catch (err) {
      } finally {
        btn.disabled = false;
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
