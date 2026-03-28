let modal = null;
let modalBody = null;

function initModal() {
  modal = document.getElementById("projectModal");
  modalBody = document.getElementById("modalBody");

  if (!modal || !modalBody) {
    console.error("❌ modal DOM not found (HTML not injected yet)");
    return;
  }

  const closeBtn = modal.querySelector(".modal-close");
  const backdrop = modal.querySelector(".modal-backdrop");

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

async function loadProjects() {
  const res = await fetch("../data/project/project_history.json");
  if (!res.ok) throw new Error("projects.json load failed");
  return await res.json();
}

async function initFeaturedProjects() {
  try {
    const projects = await loadProjects();
    renderProjects(projects);
    enableHorizontalDrag();
  } catch (e) {
    console.error(e);
  }
}

function renderProjects(projects) {
  const listEl = document.getElementById("projectList");
  if (!listEl) {
    // console.error("❌ projectList not found");
    return;
  }

  listEl.innerHTML = "";

  projects.forEach(p => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <h3>[${p.customer}] ${p.projectName}</h3>
      <p>${p.comment}</p>
      <span>${p.startDate} ~ ${p.endDate}</span>
    `;

    card.addEventListener("click", () => openModal(p));
    listEl.appendChild(card);
  });
}

function enableHorizontalDrag() {
  const slider = document.getElementById("projectList");
  if (!slider) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  slider.addEventListener("mousedown", e => {
    isDown = true;
    slider.classList.add("dragging");
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener("mouseleave", () => {
    isDown = false;
    slider.classList.remove("dragging");
  });

  slider.addEventListener("mouseup", () => {
    isDown = false;
    slider.classList.remove("dragging");
  });

  slider.addEventListener("mousemove", e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.2;
    slider.scrollLeft = scrollLeft - walk;
  });

  slider.addEventListener("wheel", e => {
    e.preventDefault();
    slider.scrollLeft += e.deltaY;
  });
}

function openModal(project) {
    modal = document.getElementById("projectModal");
    modalBody = document.getElementById("modalBody");

  if (!modal || !modalBody) {
    // console.error("❌ modal DOM not initialized");
    return;
  }

  modalBody.innerHTML = `
    <h2>[${project.customer}] ${project.projectName}</h2>
    <p>${project.comment}</p>
    <hr>
    <br/>
    <p><strong>기간 : </strong> ${project.startDate} ~ ${project.endDate}</p>
    <p><strong>내용 : </strong>
      ${project.detail.detail_comment}
    </p>
  `;

  modal.classList.remove("hidden");
}

window.closeModal = function () {
  modal.classList.add("hidden");
}

function initProjectSection() {
  initModal();
  initFeaturedProjects();
}

window.initProjectSection = initProjectSection;