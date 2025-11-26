import { authService } from "../auth/authService.js";

class RegisterPage {
  constructor() {
    this.registerAlert = document.getElementById("register-alert");
    this.formRegister = document.getElementById("form-register");
    this.btnRegister = document.getElementById("register-submit");
    this.inputNombre = document.getElementById("reg-nombre");
    this.inputEmail = document.getElementById("reg-email");
    this.inputPassword = document.getElementById("reg-password");
    if (
      !this.registerAlert ||
      !this.formRegister ||
      !this.btnRegister ||
      !this.inputNombre ||
      !this.inputEmail ||
      !this.inputPassword
    ) {
      throw new Error("REGISTER_DOM_NOT_FOUND");
    }
  }

  init() {
    this.formRegister.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }
  showError(message) {
    this.registerAlert.textContent = message;
    this.registerAlert.classList.remove("d-none");
  }
  hideError() {
    this.registerAlert.textContent = "";
    this.registerAlert.classList.add("d-none");
  }

  getRegisterDTO() {
    const nombre = this.inputNombre.value.trim();
    const email = this.inputEmail.value.trim().toLowerCase();
    const password = this.inputPassword.value;

    return { nombre, email, password };
  }
  async handleSubmit() {
    this.hideError();
    try {
      const dto = this.getRegisterDTO();
      console.log(dto);

      this.setLoading(true);
      const user = await authService.register(dto);
      if (user) {
        window.location.replace("/dashboard.html");
      }
    } catch (err) {
      console.error(err);
      switch (err.message) {
        case "INVALID_NAME":
          this.showError("El nombre debe tener al menos 3 caracteres.");
          this.inputNombre.focus();
          break;
        case "EMAIL_INVALID":
          this.showError("El email no tiene un formato válido.");
          this.inputEmail.focus();
          break;
        case "PASSWORD_TOO_SHORT":
          this.showError("La contraseña debe tener al menos 10 caracteres.");
          this.inputPassword.focus();
          break;
        case "PASSWORD_WEAK":
          this.showError(
            "La contraseña debe tener al menos una mayúscula y un número."
          );
          this.inputPassword.focus();
          break;
        case "EMAIL_TAKEN":
          this.showError("Ese correo ya está registrado.");
          this.inputEmail.focus();
          break;
        case "AUTH_SERVICE_UNAVAILABLE":
          this.showError("El servicio de autenticación no está disponible.");
          break;
        default:
          this.showError("No se pudo completar el registro.");
      }
    } finally {
      this.setLoading(false);
    }
  }
  setLoading(isLoading) {
    this.btnRegister.disabled = isLoading;
    this.btnRegister.textContent = isLoading ? "Creando..." : "Crear cuenta";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const registerPage = new RegisterPage();
  registerPage.init();
});
