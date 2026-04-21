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
  const res = await fetch("../data/project/shooting_post/list.json");
  if (!res.ok) throw new Error("projects.json load failed");
  return await res.json();
}

async function initFeaturedProjects() {
  try {
    const projects = await loadProjects();
    renderProjects(projects);
  } catch (e) {
    console.error(e);
  }
}

async function initProjectPosts() {
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

  projects.slice(0, 3).forEach(p => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.summary}</p>
      <span>${p.date}</span>
    `;

    card.addEventListener("click", () => moveTroubleshooting(p.data_url));
    listEl.appendChild(card);
  });
}

function moveTroubleshooting(url) {
  const newState = {
    tile: "./tiles/content.html",
    markdownPath: url
  };

  if (typeof window.loadTile === 'function') {
    window.loadTile("content", "./tiles/content.html", newState, true);
  }
  // alert("🚧 프로젝트 상세 페이지는 현재 준비 중입니다. \n최대한 빠르게 완성하여 공개하겠습니다. 감사합니다!");
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