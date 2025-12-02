import { authGuard } from "../auth/authGuard.js";
import { productosService } from "../auth/productosService.js";
import * as bootstrap from "bootstrap";
import { roleUI } from "../auth/roleUI.js";
import { authService } from "../auth/authService.js";
import { categoriasService } from "../auth/categoriasService.js";

class ProductosPage {
  constructor() {
    this.welcome = document.getElementById("productos-welcome");
    // Filtros / búsqueda
    this.searchInput = document.getElementById("search");
    this.orderBySelect = document.getElementById("orderBy");
    this.orderDirSelect = document.getElementById("orderDir");
    this.pageSizeSelect = document.getElementById("pageSize");
    this.buttonCsv = document.getElementById("exportar-csv");
    // Tabla
    this.tableBody = document.getElementById("tbody-productos");

    // Paginación
    this.btnPrev = document.getElementById("btn-prev");
    this.btnNext = document.getElementById("btn-next");
    this.pagingInfo = document.getElementById("paging-info");
    // Alertas y logout
    this.alertBox = document.getElementById("productos-alert");
    this.logoutBtn = document.getElementById("logout-btn");
    this.createAlertModal = document.getElementById("modal-crear-alert");
    // Modales y formularios
    this.modalCrearEl = document.getElementById("modalCrear");
    this.modalEditarEl = document.getElementById("modalEditar");
    this.formCrear = document.getElementById("form-crear");
    this.formEditar = document.getElementById("form-editar");

    // Inputs crear
    this.crearNombreInput = document.getElementById("crear-nombre");
    this.crearPrecioInput = document.getElementById("crear-precio");
    this.crearStockInput = document.getElementById("crear-stock");
    this.crearCategoriaSelect = document.getElementById("crear-categoria");
    this.crearNota = document.getElementById("crear-nota");
    // Inputs editar
    this.editarIdInput = document.getElementById("editar-id");
    this.editarNota = document.getElementById("editar-nota");
    this.editarNombreInput = document.getElementById("editar-nombre");
    this.editarPrecioInput = document.getElementById("editar-precio");
    this.editarStockInput = document.getElementById("editar-stock");
    this.editarCategoriaSelect = document.getElementById("editar-categoria");

    // Instancias de modales (Bootstrap)
    this.modalCrear = this.modalCrearEl
      ? new bootstrap.Modal(this.modalCrearEl)
      : null;
    this.modalEditar = this.modalEditarEl
      ? new bootstrap.Modal(this.modalEditarEl)
      : null;

    this.currentUser = null;
    this.searchTerm = "";
    this.localItems = [];
  }

  async init() {
    try {
      const user = await authGuard.requireAuth("/login.html");
      if (!user) return null;
      this.currentUser = user;
      //aplicar UI por rol
      roleUI.apply(user);
      this.renderWelcome(user);
      await this.loadCategoriesOptions();
      //config inicial del service
      const orderBy = this.orderBySelect.value || "createdAt";
      const orderDir = this.orderDirSelect.value || "DESC";
      const limit = Number(this.pageSizeSelect.value || 10);

      productosService.setOrdering({ orderBy, orderDir, limit });

      this.bindEvents();
      await this.loadAndRenderPage(1);
    } catch (error) {
      this.showError("No se pudieron cargar los productos.");
    }
  }
  renderWelcome(user) {
    const nombre = user.nombre;
    const rol = user.esAdmin() ? "Admin" : "Usuario";
    this.welcome.textContent = `Hola ${nombre} Rol - ${rol}`;
  }
  handleExportCsv() {
    const url = productosService.exportToCSV();
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    // Búsqueda  por nombre/categoría
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => {
        this.searchTerm = this.searchInput.value;
        this.applyLocalFilter();
      });
    }
    //cambio por orden/pagina
    const handleOrderingChange = async () => {
      const orderBy = this.orderBySelect.value || "createdAt";
      const orderDir = this.orderDirSelect.value || "DESC";
      const limit = Number(this.pageSizeSelect.value || 10);

      productosService.setOrdering({ orderBy, orderDir, limit });
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
    //botones de paginación
    if (this.btnPrev) {
      this.btnPrev.addEventListener("click", async () => {
        if (!productosService.hasPrev) return;
        await this.loadAndRenderPage(productosService.page - 1);
      });
    }
    if (this.btnNext) {
      this.btnNext.addEventListener("click", async () => {
        if (!productosService.hasNext) return;
        await this.loadAndRenderPage(productosService.page + 1);
      });
    }
    //Crear producto (form del modal)
    if (this.formCrear) {
      this.formCrear.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          const dto = this.getCrearDTO();

          await productosService.create(dto);

          await this.loadAndRenderPage(1);
          this.formCrear.reset();
          if (this.modalCrear) this.modalCrear.hide();
          this.hideCreateAlert();
        } catch (err) {
          const msg = err?.message;
          switch (msg) {
            case "PRODUCT_NAME_TOO_SHORT":
              return this.showCreateAlert(
                "El nombre del producto es muy corto."
              );
          }
          this.showError("No se pudo crear el producto.");
        }
      });
    }
    //editar producto
    if (this.formEditar) {
      this.formEditar.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = Number(this.editarIdInput.value);
        if (!id || id <= 0) {
          return;
        }
        try {
          const dto = this.getEditarDTO();

          await productosService.patch(id, dto);

          await this.loadAndRenderPage(productosService.page);
          if (this.modalEditar) this.modalEditar.hide();
          this.clearError();
          this.applyLocalFilter();
        } catch (err) {
          this.showError("No se pudo actualizar el producto.");
        }
      });
    }

    //editar- eliminar en la tabla delegación de eventos
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
            "¿Seguro que deseas eliminar este producto?"
          );
          if (!ok) {
            return;
          }
          try {
            await productosService.remove(id);
            await this.loadAndRenderPage(productosService.page);
          } catch (err) {
            const msg = err.message;
            switch (msg) {
              case "PRODUCT_HAS_MOVEMENTS":
                return alert(
                  `Producto con el id:${id} tiene movimientos, no se puede eliminar`
                );
            }
            this.showError("No se pudo eliminar el producto.");
          }
        }
      });
    }

    if (this.buttonCsv) {
      this.buttonCsv.addEventListener("click", () => {
        this.handleExportCsv();
      });
    }
  }

  async loadAndRenderPage(page) {
    this.clearError();
    try {
      await productosService.loadPage(page);
      this.localItems = [...productosService.items];
      this.applyLocalFilter();
      this.pagingInfo.textContent = `Página ${productosService.page} `;
      this.updatePagingButtons();
    } catch (err) {
      this.showError("Error al cargar los productos.");
    }
  }
  renderTable(items) {
    if (!this.tableBody) return;
    // Limpiar siempre la tabla antes de pintar
    this.tableBody.innerHTML = "";
    // Caso sin productos
    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "text-center text-muted py-4";
      td.textContent = "No hay productos para mostrar.";
      tr.appendChild(td);
      this.tableBody.appendChild(tr);
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const p of items) {
      const tr = document.createElement("tr");
      tr.dataset.id = String(p.id);

      // ID
      const tdId = document.createElement("td");
      tdId.textContent = String(p.id);
      tr.appendChild(tdId);

      // Nombre
      const tdNombre = document.createElement("td");
      tdNombre.className = "col-nombre";
      tdNombre.textContent = p.nombre ?? "";
      tr.appendChild(tdNombre);

      // Precio formateado COP
      const tdPrecio = document.createElement("td");
      tdPrecio.className = "text-end";
      const precioNumber = Number(p.precioCents ?? 0) / 100;
      const precioCo = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
      }).format(precioNumber);
      tdPrecio.textContent = precioCo;
      tr.appendChild(tdPrecio);

      // Stock
      const tdStock = document.createElement("td");
      tdStock.className = "text-end";
      tdStock.textContent = String(p.stock ?? 0);
      tr.appendChild(tdStock);

      // Categoría (texto)
      const tdCategoria = document.createElement("td");
      tdCategoria.className = "col-categoria";
      const categoria =
        p.categoriaNombre ??
        (p.categoriaId != null ? String(p.categoriaId) : "Sin categoría");
      tdCategoria.textContent = categoria;
      tr.appendChild(tdCategoria);

      // Acciones
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

    // Reaplicar roles a los botones recién pintados
    if (this.currentUser) {
      roleUI.apply(this.currentUser);
    }
  }
  updatePagingButtons() {
    if (this.btnPrev) {
      this.btnPrev.disabled = !productosService.hasPrev;
    }
    if (this.btnNext) {
      this.btnNext.disabled = !productosService.hasNext;
    }
  }
  applyLocalFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    const base = this.localItems || [];

    if (!term) {
      this.renderTable(base);
      return;
    }

    const filtrado = base.filter((p) => {
      const nombre = String(p.nombre ?? "")
        .trim()
        .toLowerCase();
      const categoria = String(
        p.categoriaNombre ??
          (p.categoriaId != null ? p.categoriaId : "sin categoría")
      )
        .trim()
        .toLowerCase();

      return nombre.includes(term) || categoria.includes(term);
    });

    this.renderTable(filtrado);
  }

  showCreateAlert(message) {
    this.createAlertModal.textContent = message;
    this.createAlertModal.classList.remove("d-none");
  }
  hideCreateAlert() {
    this.createAlertModal.textContent = "";
    this.createAlertModal.classList.add("d-none");
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

  openEditModal(id) {
    const productos = productosService.items.find((p) => p.id === id);
    if (!productos || !this.modalEditar) return;

    this.editarIdInput.value = productos.id;
    this.editarNombreInput.value = productos.nombre;
    this.editarPrecioInput.value = (productos.precioCents ?? 0) / 100;
    this.editarStockInput.value = productos.stock;

    if (this.editarCategoriaSelect) {
      this.editarCategoriaSelect.value =
        productos.categoriaId != null ? String(productos.categoriaId) : "";
    }

    this.modalEditar.show();
  }
  getCrearDTO() {
    const nombre = this.crearNombreInput.value.trim();
    const precioRaw = Number(this.crearPrecioInput.value ?? 0);
    const stock = Number(this.crearStockInput.value ?? 0);
    const categoriaIdValue = this.crearCategoriaSelect.value ?? "";
    const categoriaId = categoriaIdValue ? Number(categoriaIdValue) : null;
    const nota = this.crearNota.value?.trim() || null;
    if (!nombre || precioRaw < 0 || stock < 0) {
      throw new Error("PRODUCT_CREATE_INVALID_INPUT");
    }
    const precioCents = Math.round(precioRaw * 100);
    return {
      nombre,
      precioCents,
      stock,
      categoriaId,
      nota,
    };
  }
  getEditarDTO() {
    const nombre = this.editarNombreInput?.value.trim();
    const precioRaw = Number(this.editarPrecioInput?.value ?? 0);
    const stock = Number(this.editarStockInput?.value ?? 0);
    const categoriaIdValue = this.editarCategoriaSelect?.value ?? "";
    const categoriaId = categoriaIdValue ? Number(categoriaIdValue) : null;
    const nota = this.editarNota.value?.trim() || null;
    if (!nombre || precioRaw < 0 || stock < 0) {
      throw new Error("PRODUCT_UPDATE_INVALID_INPUT");
    }
    const precioCents = Math.round(precioRaw * 100);
    return { nombre, precioCents, stock, categoriaId, nota };
  }
  async loadCategoriesOptions() {
    await categoriasService.loadPage(1);

    const categorias = categoriasService.items || [];

    const buildOptionsFragment = () => {
      const fragment = document.createDocumentFragment();
      //sin categoria
      const optEmpty = document.createElement("option");
      optEmpty.value = "";
      optEmpty.textContent = "sin categoria";
      fragment.appendChild(optEmpty);
      //con categoria

      for (const cat of categorias) {
        const opt = document.createElement("option");
        opt.value = String(cat.id);
        opt.textContent = cat.nombre;
        fragment.appendChild(opt);
      }
      return fragment;
    };
    if (this.crearCategoriaSelect) {
      this.crearCategoriaSelect.innerHTML = "";
      this.crearCategoriaSelect.appendChild(buildOptionsFragment());
    }
    if (this.editarCategoriaSelect) {
      this.editarCategoriaSelect.innerHTML = "";
      this.editarCategoriaSelect.appendChild(buildOptionsFragment());
    }
  }
}

new ProductosPage().init();
