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

    // Tabla
    this.tableBody = document.getElementById("tbody-productos");

    // Paginación
    this.btnPrev = document.getElementById("btn-prev");
    this.btnNext = document.getElementById("btn-next");

    // Alertas y logout
    this.alertBox = document.getElementById("productos-alert");
    this.logoutBtn = document.getElementById("logout-btn");

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

    // Inputs editar
    this.editarIdInput = document.getElementById("editar-id");
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
      //eventos
      await this.loadCategoriesOptions();
      this.bindEvents();
      //cargar
      await this.loadAndRenderPage(1);
    } catch (error) {
      //quitar despues
      console.error(error);
      this.showError("No se pudieron cargar los productos.");
    }
  }
  renderWelcome(user) {
    const nombre = user.nombre;
    const rol = user.esAdmin() ? "Admin" : "Usuario";
    this.welcome.textContent = `Hola ${nombre} Rol - ${rol}`;
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
        this.searchTerm = this.searchInput.value.trim().toLowerCase();
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

          //prueba fallo boostrap

          await productosService.create(dto);

          await this.loadAndRenderPage(1);
          this.formCrear.reset();
          if (this.modalCrear) this.modalCrear.hide();
          //////////
        } catch (err) {
          this.showError("No se pudo crear el producto.");
          // } finally {
          //   window.location.reload();
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
          console.error(err);
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
            this.clearError();
            this.applyLocalFilter();
            await this.loadAndRenderPage(productosService.page);
          } catch (err) {
            this.showError("No se pudo eliminar el producto.");
          }
        }
      });
    }
  }

  async loadAndRenderPage(page) {
    this.clearError();
    try {
      await productosService.loadPage(page);
      this.renderTable();
      this.updatePagingButtons();
      this.applyLocalFilter();
    } catch (err) {
      this.showError("Error al cargar los productos.");
    }
  }
  renderTable() {
    if (!this.tableBody) return;
    const items = productosService.items || [];
    if (!items.length) {
      this.tableBody.innerHTML = `
       <tr>
        <td colspan="6" class="text-center text-muted py-4">
            No hay productos para mostrar.
         </td>
        </tr>    
       `;
      return;
    }
    const rowsHtml = items
      .map((p) => {
        const precioNumber = Number(p.precioCents ?? 0) / 100;
        const precioCo = new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
        }).format(precioNumber);

        const categoria =
          p.categoriaNombre ??
          (p.categoriaId != null ? String(p.categoriaId) : "Sin categoría");

        return `
      <tr data-id="${p.id}">
        <td>${p.id}</td>
        <td class="col-nombre">${p.nombre}</td>
        <td class="text-end">${precioCo}</td>
        <td class="text-end">${p.stock}</td>
        <td class="col-categoria">${categoria}</td>
        <td class="text-end">
         <div class="btn-group btn-group-sm">
            <button
              type="button"
              class="btn btn-outline-primary d-none"
              data-role="admin-only"
              data-action="edit"
              data-bs-toggle="modal"
              data-bs-target="#modalEditar"
               >
                Editar
              </button>
              <button
               type="button"
               class="btn btn-outline-danger d-none"
               data-role="admin-only"
               data-action="delete"
                >
                  Eliminar
                </button>
              </div>
          </td>
        </tr>      
      `;
      })
      .join("");
    this.tableBody.innerHTML = rowsHtml;

    // Reaplicar rol a los botones recién pintados
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
    if (!this.tableBody) return;
    const term = this.searchTerm.trim().toLowerCase();
    const rows = Array.from(this.tableBody.querySelectorAll("tr"));
    if (!term) {
      rows.forEach((row) => row.classList.remove("filtered-out"));
      return;
    }

    rows.forEach((row) => {
      const nombre =
        row.querySelector(".col-nombre")?.textContent.trim().toLowerCase() ||
        "";
      const categoria =
        row.querySelector(".col-categoria")?.textContent.trim().toLowerCase() ||
        "";
      const match = nombre.includes(term) || categoria.includes(term);
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
    if (!nombre || precioRaw < 0 || stock < 0) {
      throw new Error("PRODUCT_CREATE_INVALID_INPUT");
    }
    const precioCents = Math.round(precioRaw * 100);
    return { nombre, precioCents, stock, categoriaId };
  }
  getEditarDTO() {
    const nombre = this.editarNombreInput?.value.trim();
    const precioRaw = Number(this.editarPrecioInput?.value ?? 0);
    const stock = Number(this.editarStockInput?.value ?? 0);
    const categoriaIdValue = this.editarCategoriaSelect?.value ?? "";
    const categoriaId = categoriaIdValue ? Number(categoriaIdValue) : null;
    if (!nombre || precioRaw < 0 || stock < 0) {
      throw new Error("PRODUCT_UPDATE_INVALID_INPUT");
    }
    const precioCents = Math.round(precioRaw * 100);
    return { nombre, precioCents, stock, categoriaId };
  }
  async loadCategoriesOptions() {
    await categoriasService.loadPage(1);

    const categorias = categoriasService.items || [];
    if (!categorias.length) {
      return;
    }

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
