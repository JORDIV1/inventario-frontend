import { authGuard } from "../auth/authGuard.js";
import { authService } from "../auth/authService.js";
import { roleUI } from "../auth/roleUI.js";
import { usersAdmin } from "../auth/usersAdminService.js";
import * as bootstrap from "bootstrap";

class UsersAdminPage {
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
    this.alertModal = document.getElementById("create-alert");
    this.alertModalPatch = document.getElementById("patch-alert");
    // Modales y formularios
    this.modalCrearEl = document.getElementById("modalCrear");
    this.modalEditarEl = document.getElementById("modalEditar");
    this.formCrear = document.getElementById("form-crear");
    this.formEditar = document.getElementById("form-editar");

    // Inputs crear
    this.crearNombreInput = document.getElementById("crear-nombre");
    this.crearEmailInput = document.getElementById("crear-email");
    this.crearRolSelect = document.getElementById("crear-rol");
    this.crearPasswordInput = document.getElementById("crear-password");

    // Inputs editar
    this.editarIdInput = document.getElementById("editar-id");
    this.editarNombreInput = document.getElementById("editar-nombre");
    this.editarEmailInput = document.getElementById("editar-email");
    this.editarRolSelect = document.getElementById("editar-rol");

    // Instancias Bootstrap
    this.modalCrear = this.modalCrearEl
      ? new bootstrap.Modal(this.modalCrearEl)
      : null;
    this.modalEditar = this.modalEditarEl
      ? new bootstrap.Modal(this.modalEditarEl)
      : null;

    // Estado
    this.currentUser = null;
    this.searchTerm = "";
    this.localItems = [];
  }
  renderWelcome(user) {
    const nombre = user.nombre ?? "Usuario";
    const rol = user.esAdmin() ? "Administrador" : "Usuario";
    this.welcomeEl.textContent = `Hola ${nombre} Rol - ${rol}`;
  }
  showErrorModalPatch(message) {
    this.alertModalPatch.textContent = message;
    this.alertModalPatch.classList.remove("d-none");
  }
  showErrorModalCreate(message) {
    this.alertModal.textContent = message;
    this.alertModal.classList.remove("d-none");
  }
  showError(message) {
    this.alertBox.textContent = message;
    this.alertBox.classList.remove("d-none");
  }
  hideError() {
    this.alertBox.textContent = "";
    this.alertModal.textContent = "";
    this.alertModalPatch.textContent = "";
    this.alertModalPatch.classList.add("d-none");
    this.alertModal.classList.add("d-none");
    this.alertBox.classList.add("d-none");
  }

  async init() {
    try {
      const user = await authGuard.requireAdmin();
      if (!user) return null;
      this.currentUser = user;
      this.renderWelcome(user);
      roleUI.apply(user);
      const orderBy = this.orderBySelect.value || "createdAt";
      const orderDir = this.orderDirSelect.value || "DESC";
      const limit = Number(this.pageSizeSelect.value || 20);

      usersAdmin.setOrdering({ orderBy, orderDir, limit });

      this.bindEvents();
      await this.loadAndRender(1);
    } catch (err) {
      this.showError("No se pudieron cargar los usuarios");
    }
  }
  async loadAndRender(page) {
    this.hideError();
    try {
      await usersAdmin.loadPage(page);
      this.localItems = [...usersAdmin.items];
      this.applyLocalFilter();
      this.updatePagingButtons();
      this.pagingInfo.textContent = `Página ${usersAdmin.page}`;
    } catch (err) {
      this.showError("Error al cargar los usuarios");
    }
  }
  getCrearDTO() {
    const nombre = this.crearNombreInput.value.trim();
    const email = this.crearEmailInput.value.trim().toLowerCase();
    const password = this.crearPasswordInput.value;
    const rolIdValue = this.crearRolSelect.value ?? "";
    const rolId = rolIdValue ? Number(rolIdValue) : null;
    if (!nombre || !email || !password) {
      throw new Error("USER_CREATE_INVALID_INPUT");
    }
    if (!/^(?=.*[A-Z])(?=.*\d).{10,}$/.test(password)) {
      throw new Error("PASSWORD_WEAK");
    }
    return { nombre, email, rolId, password };
  }
  getEditarDTO() {
    const patch = {};
    const rawNombre = this.editarNombreInput.value;
    const nombre = rawNombre.trim();
    if (nombre !== "") {
      patch.nombre = nombre;
    }
    const rawEmail = this.editarEmailInput.value;
    const email = rawEmail.trim().toLowerCase();
    if (email !== "") {
      patch.email = email;
    }
    const rolIdValue = this.editarRolSelect.value;
    if (rolIdValue !== "" && rolIdValue != null) {
      const rolId = Number(rolIdValue);
      patch.rolId = rolId;
    }

    return patch;
  }
  applyLocalFilter() {
    const term = String(this.searchTerm ?? "")
      .trim()
      .toLowerCase();
    const base = this.localItems || [];

    if (!term) {
      this.renderTable(base);
      return;
    }
    const filtrado = base.filter((item) => {
      const nombre = String(item.nombre).trim().toLowerCase();
      const rolId = String(item.rolId === 1 ? "administrador" : "usuario")
        .trim()
        .toLowerCase();
      const email = String(item.email).trim().toLowerCase();

      return (
        nombre.includes(term) || rolId.includes(term) || email.includes(term)
      );
    });
    this.renderTable(filtrado);
  }
  updatePagingButtons() {
    this.btnPrev.disabled = !usersAdmin.hasPrev;
    this.btnNext.disabled = !usersAdmin.hasNext;
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
      const limit = Number(this.pageSizeSelect.value || 20);
      usersAdmin.setOrdering({ orderBy, orderDir, limit });
      await this.loadAndRender(1);
    };
    this.orderBySelect?.addEventListener("change", handleOrderingChange);
    this.orderDirSelect?.addEventListener("change", handleOrderingChange);
    this.pageSizeSelect?.addEventListener("change", handleOrderingChange);

    this.btnPrev?.addEventListener("click", async () => {
      if (!usersAdmin.hasPrev) return;
      await this.loadAndRender(usersAdmin.page - 1);
    });

    this.btnNext?.addEventListener("click", async () => {
      if (!usersAdmin.hasNext) return;
      await this.loadAndRender(usersAdmin.page + 1);
    });
    if (this.formCrear) {
      this.formCrear.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          const dto = this.getCrearDTO();
          await usersAdmin.create(dto);
          await this.loadAndRender(1);
          this.formCrear.reset();
          if (this.modalCrear) {
            this.modalCrear.hide();
          }
        } catch (err) {
          const code = err?.message;
          switch (code) {
            case "EMAIL_INVALID":
              this.showErrorModalCreate("Email invalido");
              this.crearEmailInput.focus();
              break;
            case "EMAIL_TAKEN":
              this.showErrorModalCreate("Email ya existe");
              this.crearEmailInput.focus();
              break;
            case "PASSWORD_WEAK":
              this.showErrorModalCreate("Contraseña invalida");
              this.crearPasswordInput.focus();
              break;
            default:
              this.showErrorModalCreate("No se pudo crear el usuario.");
          }
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

          await usersAdmin.updatedPartial(id, dto);
          await this.loadAndRender(usersAdmin.page);
          if (this.modalEditar) {
            this.modalEditar.hide();
          }
        } catch (err) {
          const code = err?.message;
          switch (code) {
            case "EMAIL_TAKEN":
              this.showErrorModalPatch("Email ya existe");
              this.editarEmailInput.focus();
              break;
            case "EMAIL_INVALID":
              this.showErrorModalPatch("Email invalido");
              this.editarEmailInput.focus();
              break;
            default:
              this.showErrorModalPatch("No se pudo actualizar el usuario.");
          }
        }
      });
    }
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
            "¿Seguro que deseas eliminar este usuario?"
          );
          if (!ok) {
            return;
          }
          try {
            await usersAdmin.remove(id);
            await this.loadAndRender(usersAdmin.page);
          } catch (err) {
            const msg = err.message;

            switch (msg) {
              case "USER_IN_USE":
                alert(
                  `Usuario con id: ${id} tiene movimientos, no se puede eliminar`
                );
                return;
            }
            this.showError("No se pudo eliminar el usuario.");
          }
        }
      });
    }
  }
  openEditModal(id) {
    const usuario = usersAdmin.items.find((u) => u.id === id);
    if (!usuario || !this.modalEditar) return;
    this.editarRolSelect.value = String(usuario.rolId);
    this.editarIdInput.value = usuario.id;
    this.editarNombreInput.value = usuario.nombre;
    this.editarEmailInput.value = usuario.email;
    this.modalEditar.show();
  }
  renderTable(items) {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = "";
    if (!items.length) {
      this.tableBody.innerHTML = `
       <tr>
        <td colspan="6" class="text-center text-muted py-4">
            No hay usuarios para mostrar.
         </td>
        </tr>    
       `;
      return;
    }
    const fragment = document.createDocumentFragment();

    for (const user of items) {
      const tr = document.createElement("tr");
      tr.dataset.id = String(user.id);

      const tdId = document.createElement("td");
      tdId.textContent = user.id;
      tr.appendChild(tdId);

      const tdNombre = document.createElement("td");
      tdNombre.className = "col-nombre";
      tdNombre.textContent = user.nombre ?? "";
      tr.appendChild(tdNombre);

      const tdEmail = document.createElement("td");
      tdEmail.textContent = user.email ?? "";
      tdEmail.className = "col-email";
      tr.appendChild(tdEmail);

      const tdRol = document.createElement("td");
      const rol = user.rolId === 1 ? "Administrador" : "Usuario";
      tdRol.textContent = rol;
      tr.appendChild(tdRol);

      const tdCreado = document.createElement("td");
      if (user.createdAt) {
        const fecha = new Date(user.createdAt);
        tdCreado.textContent = fecha.toLocaleString("es-CO");
      } else {
        tdCreado.textContent = "-";
      }
      tr.appendChild(tdCreado);

      const tdActualizado = document.createElement("td");

      if (user.updatedAt) {
        const fecha = new Date(user.updatedAt);
        tdActualizado.textContent = fecha.toLocaleString("es-CO");
      } else {
        tdActualizado.textContent = "-";
      }
      tr.appendChild(tdActualizado);

      const tdAcciones = document.createElement("td");
      tdAcciones.className = "text-end";
      const btnGroup = document.createElement("div");
      btnGroup.className = "btn-group btn-group-sm";

      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn btn-outline-primary d-none";
      btnEdit.dataset.role = "admin-only";
      btnEdit.dataset.action = "edit";
      btnEdit.textContent = "Editar";

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
      fragment.appendChild(tr);
    }
    this.tableBody.appendChild(fragment);
    if (this.currentUser) {
      roleUI.apply(this.currentUser);
    }
  }
}

new UsersAdminPage().init();
