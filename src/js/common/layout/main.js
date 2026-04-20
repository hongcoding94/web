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

async function initProjectPosts() {
  console.log("🔍 최근 게시물 초기화 시작...");
  
  setTimeout(async () => {
    try {
      const posts = await loadRecentPosts();
      renderRecentPosts(posts);
    } catch (e) {
      console.error("❌ 최근 게시물 초기화 중 예외 발생:", e);
    }
  }, 50);
}

async function loadRecentPosts() {
  const targetPath = "../data/recent_3.json";
  
  try {
    const res = await fetch(targetPath);
    
    if (!res.ok) {
      console.warn(`⚠️ 파일을 찾을 수 없습니다 (Status: ${res.status})`);
      return []; 
    }

    const data = await res.json();
    return (data && Array.isArray(data)) ? data : [];
  } catch (e) {
    console.error("❌ Recent Posts Fetch Error:", e);
    return [];
  }
}

function renderRecentPosts(posts) {
  const listEl = document.getElementById("dynamic-post-list");
  if (!listEl) return;

  if (posts.length === 0) {
    listEl.innerHTML = `
      <li class="no-data">
        <p>최근 게시물이 없습니다. 곧 새로운 소식으로 찾아뵙겠습니다!</p>
      </li>`;
    return;
  }

  listEl.innerHTML = posts.map((post, index) => {
    const category = (post.category || 'tech').toLowerCase();
    const title = post.title || "제목 없음";
    const displayTitle = typeof highlight === 'function' ? highlight(title) : title;
    const description = post.description || post.summary || '내용 요약이 없습니다.';
    const date = post.date || '-';

    return `
      <li data-cat="${category}">
        <a href="javascript:void(0);" class="tile-link" data-index="${index}">
          <strong>${displayTitle}</strong>
          <p>${description}</p>
          <span>${date}</span>
        </a>
      </li>
    `;
  }).join('');

  listEl.querySelectorAll('.tile-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault(); 
      
      const idx = this.getAttribute('data-index');
      const post = posts[idx];

      if (post.private_page === "Y") {
        alert("🤖 봇이 최신 데이터를 인덱싱 중입니다. \n누락된 정보가 없도록 꼼꼼히 검토한 뒤 공개하겠습니다.");
        return;
      }

      const newState = {
        tile: "./tiles/content.html",
        markdownPath: post.data_url
      };

      if (typeof window.loadTile === 'function') {
        window.loadTile("content", "./tiles/content.html", newState, true);
      }
    });
  });
}

function renderProjects(projects) {
  const listEl = document.getElementById("projectList");
  if (!listEl)  return;
  
  listEl.innerHTML = "";

  projects.forEach(p => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <h3>[${p.customer}] ${p.projectName}</h3>
      <p>${p.role}</p>
      <span>${p.period.start} ~ ${p.period.end}</span>
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
    return;
  }

  modalBody.innerHTML = `
    <h2>[${project.customer}] ${project.projectName}</h2>
    <p>${project.summary}</p>

    <hr><br/>

    <p><strong>역할 :</strong> ${project.role}</p>
    <p><strong>기간 :</strong> ${project.period.start} ~ ${project.period.end}
    <span className="project-status">
      ${project.status.active === "ACTIVE"
        ? "<strong>진행중</strong>"
        : project.status.active === "PLANNED"
          ? "<strong>진행예정</strong>"
          : "<strong>종료</strong>"}
    </span>
    </p>
    <br/>

    <h3>기술 스택</h3>
    <p><strong>OS :</strong> ${project.techStack.os.join(", ")}</p>
    <p><strong>DBMS :</strong> ${project.techStack.dbms.join(", ")}</p>
    <p><strong>Backend :</strong> ${project.techStack.backend.join(", ")}</p>
    <p><strong>Frontend :</strong> ${project.techStack.frontend.join(", ")}</p>
    
    <br/>

    <h3>상세 내용</h3>
    <p>${project.description}</p>

    <br/>

    <h3>태그</h3>
    <div class="tag-list">
      ${project.tags.map(tag => `<span class="tag">#${tag}</span>`).join("")}
    </div>
  `;

  document.body.classList.add("scroll-lock");
  modal.classList.remove("hidden");
}

window.closeModal = function () {
  document.body.classList.remove("scroll-lock");
  modal.classList.add("hidden");
}

function professionalExperience() {
  changePage('experience');
}

function initProjectSection() {
  initModal();
  initFeaturedProjects();
  initProjectPosts();
}

window.initProjectSection = initProjectSection;