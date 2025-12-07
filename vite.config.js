import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        login: "login.html",
        dashboard: "dashboard.html",
        perfil: "perfilUsuario.html",
        productos: "productos.html",
        categorias: "categorias.html",
        movimientos: "mov.html",
        register: "register.html",
        unauthorized: "unauthorized.html",
        usersAdmin: "usersAdmin.html",
        usersCard: "usersCard.html",
      },
    },
  },
});
