import { authGuard } from "../auth/authGuard.js";
import { movimientoService } from "../auth/movService.js";

class MovPage {
  constructor() {
    this.tableBody = document.getElementById("movimientos-tbody");
    this.pagingInfo = document.getElementById("paging-info");
    this.totalLabel = document.getElementById("movimientos-total");
    this.errorBox = document.getElementById("movimientos-error");

    this.btnPrev = document.getElementById("btn-prev");
    this.btnNext = document.getElementById("btn-next");
    this.buttonCsv = document.getElementById("exportar-csv");
    this.filterForm = document.getElementById("filter-form");
    this.filterTextInput = document.getElementById("filter-text");
    this.filterTipoSelect = document.getElementById("filter-tipo");
    this.filterOrderBySelect = document.getElementById("filter-order-by");
    this.filterOrderDirSelect = document.getElementById("filter-order-dir");
    this.filterLimitSelect = document.getElementById("filter-limit");

    this.localItems = [];
    this.currentUser = null;
    this.searchTerm = "";
  }

  async init() {
    try {
      const user = await authGuard.requireAuth("/login.html");
      if (!user) return null;
      this.currentUser = user;
      const limit = Number(this.filterLimitSelect.value || 10);
      const orderBy = this.filterOrderBySelect.value || "fecha";
      const orderDir = this.filterOrderDirSelect.value || "DESC";
      movimientoService.setOrdering({ limit, orderBy, orderDir });
      this.bindEvents();
      await this.loadAndRender(1);
    } catch (err) {
      this.showError("Error cargando movimientos");
    }
  }
  showError(message) {
    this.errorBox.textContent = message;
    this.errorBox.classList.remove("d-none");
  }
  hideError() {
    this.errorBox.textContent = "";
    this.errorBox.classList.add("d-none");
  }
  handleExportCsv() {
    const url = movimientoService.exportToCSV();
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  renderTable(items) {
    this.tableBody.innerHTML = "";
    if (!items.length) {
      this.tableBody.innerHTML = `
        <tr>
        <td colspan="6"class="text-center text-muted py-4">
            No hay movimientos para mostrar.
            </td>
        </tr>    
        `;
      return;
    }
    const fragment = document.createDocumentFragment();

    for (const m of items) {
      const tr = document.createElement("tr");
      tr.dataset.id = String(m.id);

      const tdfecha = document.createElement("td");
      tdfecha.className = "col-fecha";
      tdfecha.dataset.label = "Fecha";
      const fechaCo = m.fecha
        ? new Date(m.fecha).toLocaleString("es-CO")
        : "No se cargo la fecha";
      tdfecha.textContent = fechaCo;
      tr.appendChild(tdfecha);

      const tdProducto = document.createElement("td");
      tdProducto.className = "col-producto";
      tdProducto.dataset.label = "Producto";
      tdProducto.textContent = m.producto;
      tr.appendChild(tdProducto);

      const tdTipo = document.createElement("td");
      tdTipo.className = "col-tipo";
      tdTipo.dataset.label = "Tipo";
      tdTipo.textContent = m.tipo;
      tr.appendChild(tdTipo);

      const tdCantidad = document.createElement("td");
      tdCantidad.className = "col-cantidad";
      tdCantidad.dataset.label = "Cantidad";
      tdCantidad.textContent = m.cantidad;
      tr.appendChild(tdCantidad);

      const tdUsuario = document.createElement("td");
      tdUsuario.className = "col-usuario";
      tdUsuario.dataset.label = "Usuario";
      tdUsuario.textContent = m.usuario;
      tr.appendChild(tdUsuario);

      const tdNota = document.createElement("td");
      tdNota.className = "col-nota";
      tdNota.dataset.label = "Nota";
      tdNota.textContent = m.nota;
      tr.appendChild(tdNota);
      fragment.appendChild(tr);
    }
    this.tableBody.appendChild(fragment);
  }
  applyLocalFilter() {
    const base = this.localItems || [];
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.renderTable(base);
      return;
    }
    const filter = base.filter((i) => {
      const producto = String(i.producto).trim().toLowerCase();
      const usuario = String(i.usuario).trim().toLowerCase();
      return producto.includes(term) || usuario.includes(term);
    });
    this.renderTable(filter);
  }
  updatePagingButtons() {
    if (this.btnPrev) {
      this.btnPrev.disabled = !movimientoService.hasPrev;
    }
    if (this.btnNext) {
      this.btnNext.disabled = !movimientoService.hasNext;
    }
  }

  async loadAndRender(page) {
    this.hideError();
    try {
      await movimientoService.loadPage(page);
      this.localItems = [...movimientoService.items];
      this.pagingInfo.textContent = `Página ${movimientoService.page}`;
      this.applyLocalFilter();
      this.updatePagingButtons();
    } catch (err) {
      this.showError("Error cargando movimientos");
    }
  }
  bindEvents() {
    const handleOrderingChange = async () => {
      const orderBy = this.filterOrderBySelect.value || "fecha";
      const orderDir = this.filterOrderDirSelect.value || "DESC";
      const limit = Number(this.filterLimitSelect.value || 10);
      movimientoService.setOrdering({ limit, orderBy, orderDir });
      await this.loadAndRender(1);
    };

    this.filterOrderBySelect.addEventListener("change", handleOrderingChange);
    this.filterOrderDirSelect.addEventListener("change", handleOrderingChange);
    this.filterLimitSelect.addEventListener("change", handleOrderingChange);

    if (this.filterTextInput) {
      this.filterTextInput.addEventListener("input", () => {
        this.searchTerm = this.filterTextInput.value;
        this.applyLocalFilter();
      });
    }
    this.buttonCsv.addEventListener("click", () => {
      this.handleExportCsv();
    });
    this.btnPrev.addEventListener("click", async () => {
      if (!movimientoService.hasPrev) return;
      await this.loadAndRender(movimientoService.page - 1);
    });
    this.btnNext.addEventListener("click", async () => {
      if (!movimientoService.hasNext) return;
      await this.loadAndRender(movimientoService.page + 1);
    });

  }
}

new MovPage().init();
