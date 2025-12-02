import { authService } from "../auth/authService.js";

class LoginPage {
  constructor() {
    this.form = document.getElementById("login-form");
    this.emailInput = document.getElementById("email");
    this.passwordInput = document.getElementById("password");
    this.alertBox = document.getElementById("login-alert");
    this.submitBtn = document.getElementById("login-submit");

    if (
      !this.form ||
      !this.emailInput ||
      !this.passwordInput ||
      !this.alertBox ||
      !this.submitBtn
    ) {
      throw new Error("LOGIN_DOM_NOT_FOUND");
    }
  }

  init() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.handleSubmit();
    });
  }

  showError(message) {
    this.alertBox.textContent = message;
    this.alertBox.classList.remove("d-none");
  }

  hideError() {
    this.alertBox.textContent = "";
    this.alertBox.classList.add("d-none");
  }

  setLoading(isLoading) {
    this.submitBtn.disabled = isLoading;
    this.submitBtn.textContent = isLoading ? "Ingresando..." : "Entrar";
  }

  async handleSubmit() {
    this.hideError();

    const email = this.emailInput.value.trim().toLowerCase();
    const password = this.passwordInput.value;

    if (!email || !password) {
      this.showError("Ingresa tu correo y contraseña.");
      return;
    }

    this.setLoading(true);

    try {
      const user = await authService.login({ email, password });

      if (user) {
        window.location.replace("/dashboard.html");
      }
    } catch (err) {
      const msg =
        err.message === "INVALID_CREDENTIALS"
          ? "Credenciales inválidas."
          : "No se pudo iniciar sesión. Intenta nuevamente.";
      this.showError(msg);
    } finally {
      this.setLoading(false);
    }
  }
}

new LoginPage().init();
