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

async function fetchPostData(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      console.warn(`⚠️ 파일을 찾을 수 없습니다 (Status: ${res.status}): ${path}`);
      return [];
    }
    const data = await res.json();
    return (data && Array.isArray(data)) ? data : [];
  } catch (e) {
    console.error(`❌ Fetch Error (${path}):`, e);
    return [];
  }
}

function renderPostList(containerId, posts , checkPrivate = false) {
  const listEl = document.getElementById(containerId);
  if (!listEl) return;

  if (posts.length === 0) {
    listEl.innerHTML = `
      <li class="no-data">
        <p>게시물이 없습니다. 곧 새로운 소식으로 찾아뵙겠습니다!</p>
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
      </li>`;
  }).join('');

  listEl.querySelectorAll('.tile-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const idx = this.getAttribute('data-index');
      const post = posts[idx];

      if (checkPrivate && post.private_page === "Y") {
        showPopup("🤖 봇이 최신 데이터를 인덱싱 중입니다. \n누락된 정보가 없도록 꼼꼼히 검토한 뒤 공개하겠습니다.", "modalPopup");
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

/* 최근 게시물 (3개) */
async function initProjectPosts() {
  setTimeout(async () => {
    const posts = await fetchPostData("../data/recent_3.json");
    renderPostList("recent-post-list", posts, true);
  }, 50);
}

/* 트러블슈팅 게시물 */
async function initFeaturedProjects() {
  const posts = await fetchPostData("../data/project/shooting_post/list.json");
  renderPostList("trouble-post-list", posts, false);
}

function professionalExperience() {
  if (typeof changePage === 'function') {
    changePage('experience');
  }
}

function initProjectSection() {
  initModal();
  initFeaturedProjects();
  initProjectPosts();
}

window.initProjectSection = initProjectSection;