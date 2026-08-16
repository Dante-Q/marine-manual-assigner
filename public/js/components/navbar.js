import { state } from "../state.js";

export function renderNavbar(onNavigate) {
  const navbar = document.getElementById("navbar");

  if (!navbar) {
    return;
  }

  navbar
    .querySelectorAll(".nav-button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === state.currentPage
      );

      button.onclick = () => {
        onNavigate(button.dataset.page);
      };

    });
}