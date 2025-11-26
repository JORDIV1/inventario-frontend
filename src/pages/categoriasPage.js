import { authGuard } from "../auth/authGuard.js";
import { categoriasService } from "../auth/categoriasService.js";
import * as bootstrap from "bootstrap";
import { roleUI } from "../auth/roleUI.js";
import { authService } from "../auth/authService.js";

class CategoriasPage {
  constructor() {
    this.welcomeEl = document.getElementById("categorias-welcome");
    // Tabla
    this.tableBody = document.getElementById("tbody-categorias");

    // Paginación
    this.btnPrev = document.getElementById("btn-prev");
    this.btnNext = document.getElementById("btn-next");
    this.pagingInfo = document.getElementById("categorias-paging-info");

    // Alertas y logout
    this.alertBox = document.getElementById("categorias-alert");
    this.logoutBtn = document.getElementById("logout-btn");

    // Modales y formularios
    this.modalCrearEl = document.getElementById("modalCrear");
    this.modalEditarEl = document.getElementById("modalEditar");
    this.formCrear = document.getElementById("form-crear");
    this.formEditar = document.getElementById("form-editar");

    // Inputs crear
    this.crearNombreInput = document.getElementById("crear-nombre");

    // Inputs editar
    this.editarIdInput = document.getElementById("editar-id");
    this.editarNombreInput = document.getElementById("editar-nombre");

    // Instancias Bootstrap
    this.modalCrear = new bootstrap.Modal(this.modalCrearEl);
    this.modalEditar = new bootstrap.Modal(this.modalEditarEl);

    // Filtros
    this.searchInput = document.getElementById("search");
    this.orderBySelect = document.getElementById("orderBy");
    this.orderDirSelect = document.getElementById("orderDir");
    this.pageSizeSelect = document.getElementById("pageSize");

    this.currentUser = null;
    this.searchTerm = "";

    this.modalCrear = this.modalCrearEl
      ? bootstrap.Modal.getOrCreateInstance(this.modalCrearEl)
      : null;

    this.modalEditar = this.modalEditarEl
      ? bootstrap.Modal.getOrCreateInstance(this.modalEditarEl)
      : null;
  }

  async init() {
    try {
      const user = await authGuard.requireAuth("/login.html");
      if (!user) return null;

      this.currentUser = user;
      roleUI.apply(user);
      this.renderWelcome(user);

      const orderBy = this.orderBySelect.value || "createdAt";
      const orderDir = this.orderDirSelect.value || "DESC";
      const limit = Number(this.pageSizeSelect.value || 10);
      categoriasService.setOrdering({ orderBy, orderDir, limit });

      this.bindEvents();
      await this.loadAndRenderPage(1);
    } catch (error) {
      this.showError("No se pudieron cargar las categorias.");
    }
  }

  async loadAndRenderPage(page) {
    this.clearError();
    try {
      await categoriasService.loadPage(page);

      //renderizar
      this.renderTable();
      this.applyLocalFilter();
      this.updatePagingButtons();
    } catch (error) {
      console.error(error);
      this.showError("Error al cargar las categorias");
    }
  }
  renderTable() {
    if (!this.tableBody) return;
    const items = categoriasService.items || [];
    //limpiar siempre
    this.tableBody.innerHTML = "";
    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.className = "text-center text-muted py-4";
      td.textContent = "No hay categorías para mostrar.";
      tr.appendChild(td);
      this.tableBody.appendChild(tr);
      return;
    }

    //crear fragmento
    const fragment = document.createDocumentFragment();
    //recorrer y crear filas
    for (const cat of items) {
      const tr = document.createElement("tr");

      tr.dataset.id = String(cat.id);

      //columna ID
      const tdId = document.createElement("td");
      tdId.textContent = String(cat.id);
      tr.appendChild(tdId);

      //columna nombre
      const tdNombre = document.createElement("td");
      tdNombre.className = "col-nombre";
      tdNombre.textContent = cat.nombre ?? "";
      tr.appendChild(tdNombre);

      //columna fecha - Nuevo
      const tdFecha = document.createElement("td");
      if (cat.createdAt) {
        const fecha = new Date(cat.createdAt);
        tdFecha.textContent = fecha.toLocaleString("es-CO");
      } else {
        tdFecha.textContent = "-";
      }
      tr.appendChild(tdFecha);

      //columna acciones
      const tdAcciones = document.createElement("td");
      tdAcciones.className = "text-end";
      const btnGroup = document.createElement("div");
      btnGroup.className = "btn-group btn-group-sm";

      //boton editar
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn btn-outline-primary d-none";
      btnEdit.dataset.role = "admin-only";
      btnEdit.dataset.action = "edit";
      btnEdit.dataset.bsToggle = "modal";
      btnEdit.dataset.bsTarget = "#modalEditar";
      btnEdit.textContent = "Editar";

      //boton eliminar
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn btn-outline-danger d-none";
      btnDelete.dataset.role = "admin-only";
      btnDelete.dataset.action = "delete";
      btnDelete.textContent = "Eliminar";

      btnGroup.appendChild(btnEdit);
      btnGroup.appendChild(btnDelete);
      tdAcciones.appendChild(btnGroup);

      tr.appendChild(tdAcciones);

      // Agregar la fila al fragment
      fragment.appendChild(tr);
    }

    this.tableBody.appendChild(fragment);
    if (this.currentUser) {
      roleUI.apply(this.currentUser);
    }
  }
  updatePagingButtons() {
    if (this.btnPrev) {
      this.btnPrev.disabled = !categoriasService.hasPrev;
    }
    if (this.btnNext) {
      this.btnNext.disabled = !categoriasService.hasNext;
    }
  }
  applyLocalFilter() {
    if (!this.tableBody) return;
    const term = this.searchTerm.trim().toLowerCase();
    const rows = Array.from(this.tableBody.querySelectorAll("tr"));
    if (!term) {
      rows.forEach((r) => r.classList.remove("filtered-out"));
      return;
    }
    rows.forEach((row) => {
      const nombre =
        row.querySelector(".col-nombre")?.textContent.trim().toLowerCase() ||
        "";
      const match = nombre.includes(term);
      if (match) {
        row.classList.remove("filtered-out");
      } else {
        row.classList.add("filtered-out");
      }
    });
  }

  showError(message) {
    if (!this.alertBox) return;
    this.alertBox.textContent = message;
    this.alertBox.classList.remove("d-none");
  }
  clearError() {
    if (!this.alertBox) return;
    this.alertBox.textContent = "";
    this.alertBox.classList.add("d-none");
  }
  renderWelcome(user) {
    if (this.welcomeEl) {
      const rol = user.esAdmin() ? "Admin" : "Usuario";
      const usuario = user.nombre ? user.nombre : "Usuario";
      this.welcomeEl.textContent = `Hola ${usuario} Rol - ${rol}`;
    }
  }
  getCrearDTO() {
    const nombre = this.crearNombreInput.value.trim();
    if (!nombre) {
      throw new Error("CATEGORY_CREATE_INVALID_INPUT");
    }
    return { nombre };
  }
  getEditarDTO() {
    const nombre = this.editarNombreInput.value.trim();
    if (!nombre) {
      throw new Error("CATEGORY_UPDATE_INVALID_INPUT");
    }
    return { nombre };
  }

  openEditModal(id) {
    const categoria = categoriasService.items.find((c) => c.id === id);
    if (!categoria || !this.modalEditar) return;
    this.editarIdInput.value = categoria.id;
    this.editarNombreInput.value = categoria.nombre;

    this.modalEditar.show();
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

    //searchInput
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => {
        this.searchTerm = this.searchInput.value.trim().toLowerCase();
        this.applyLocalFilter();
      });
    }
    const handleOrderingChange = async () => {
      const orderBy = this.orderBySelect.value || "createdAt";
      const orderDir = this.orderDirSelect.value || "DESC";
      const limit = Number(this.pageSizeSelect.value || 10);

      categoriasService.setOrdering({ orderBy, orderDir, limit });
      await this.loadAndRenderPage(1);
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
    //paginacion
    if (this.btnPrev) {
      this.btnPrev.addEventListener("click", async () => {
        if (!categoriasService.hasPrev) return;
        await this.loadAndRenderPage(categoriasService.page - 1);
      });
    }
    if (this.btnNext) {
      this.btnNext.addEventListener("click", async () => {
        if (!categoriasService.hasNext) return;
        await this.loadAndRenderPage(categoriasService.page + 1);
      });
    }

    //formCrear form
    if (this.formCrear) {
      this.formCrear.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          const dto = this.getCrearDTO();
          await categoriasService.create(dto);
          await this.loadAndRenderPage(1);
          this.formCrear.reset();
          if (this.modalCrear) this.modalCrear.hide();
        } catch (err) {
          console.error(err);
          this.showError("No se pudo crear la categoria.");
        }
      });
    }
    if (this.formEditar) {
      this.formEditar.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = Number(this.editarIdInput.value);
        if (!id || id <= 0) {
          return;
        }
        try {
          const dto = this.getEditarDTO();

          await categoriasService.patch(id, dto);
          await this.loadAndRenderPage(categoriasService.page);
          if (this.modalEditar) this.modalEditar.hide();
        } catch (err) {
          console.error(err);
          this.showError("No se pudo actualizar categoria");
        }
      });
    }
    //delegacio de enventos
    if (this.tableBody) {
      this.tableBody.addEventListener("click", async (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        const row = target.closest("tr");
        const idAttr = row?.dataset.id;
        const id = idAttr ? Number(idAttr) : null;
     

        if (!action || !id) return;

        if (action === "edit") {
          this.openEditModal(id);
        } else if (action === "delete") {
          const ok = window.confirm(
            "¿Seguro que deseas eliminar esta categoria?"
          );
          if (!ok) {
            return;
          }
          try {
            await categoriasService.remove(id);
            await this.loadAndRenderPage(categoriasService.page);
          } catch (error) {
            this.showError("No se pudo eliminar la categoria.");
          }
        }
      });
    }
  }
}

new CategoriasPage().init();
