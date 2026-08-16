import { state } from "./state.js";
import { fetchRecords } from "./api.js";
import { renderNavbar } from "./components/navbar.js";
import {
  renderInspector,
  initInspector
} from "./pages/inspector.js";
import { renderMatcher } from "./pages/matcher.js";

const app = document.getElementById("app");

async function startApp() {

  try {

    state.records =
      await fetchRecords();

    navigate(
      state.currentPage
    );

  } catch (error) {

    console.error(error);

    app.innerHTML = `
      <div class="error">
        Failed to load application data.
      </div>
    `;
  }
}

function navigate(page) {

  state.currentPage =
    page;

  renderNavbar(
    navigate
  );

  if (page === "inspector") {

    app.innerHTML =
      renderInspector();

    initInspector();

    return;
  }

  if (page === "matcher") {

    app.innerHTML =
      renderMatcher();

    return;
  }

  state.currentPage =
    "inspector";

  navigate(
    "inspector"
  );
}

startApp();