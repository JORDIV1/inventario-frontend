export class RoleUI {
  apply(user) {
    const isAdmin = user?.esAdmin() === true;
    document.querySelectorAll('[data-role="admin-only"]').forEach((el) => {
      if (isAdmin) {
        el.classList.remove("d-none");
      }
    });
    document.querySelectorAll('[data-role="user-only"]').forEach((el) => {
      if (!isAdmin) {
        el.classList.add("d-none");
      }
    });
  }
}

export const roleUI = new RoleUI();
