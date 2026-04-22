window.initList = function (root, state = {}) {
  if (!root || root.id !== "content") return;

  const pageEl = root.querySelector('[data-page="list"]');
  if (!pageEl) return;

  const listEl = pageEl.querySelector("#postList");
  const resultInfo = pageEl.querySelector("#resultInfo");
  const paginationEl = pageEl.querySelector("#pagination");
  const searchInput = pageEl.querySelector("#searchInput");
  const searchType = pageEl.querySelector("#searchType");
  const clearBtn = pageEl.querySelector("#clearSearch");
  const pageSizeSelect = pageEl.querySelector("#pageSize");

  let posts = [];
  let filtered = [];

  let currentPage = 1;
  let pageSize = Number(pageSizeSelect?.value || 10);

  const listPath = state.listPath;
  if (!listPath) {
      console.warn("[post-list] listPath missing in state");
      return;
  }
  
  fetch(listPath)
    .then(res => res.json())
    .then(data => {
        posts = data.sort((a, b) => b.date.localeCompare(a.date));
        filtered = posts;
        render();
    });

  function render() {
    renderList();
    renderPagination();
    renderResultInfo();
  }

  function renderResultInfo() {
    resultInfo.textContent =
      `총 ${posts.length}건 중 ${filtered.length}건 표시`;
  }

  function renderList() {
    listEl.innerHTML = "";

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    filtered.slice(start, end).forEach(post => {
    const li = document.createElement("li");
    li.className = "post-item";

    li.innerHTML = `
      <a data-tile="${post.data_url}" class="tile-link">
        <div class="post-no">${post.no}</div>

        <div class="post-main">
          <div class="post-top">
            <div class="post-title">
              ${highlight(post.title)}
            </div>
            <div class="post-date">${post.date}</div>
          </div>
          <div class="post-summary">${post.summary}</div>
        </div>
      </a>
    `;

    const link = li.querySelector("a");
    if (post.private_page === "Y") {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showPopup("아직 공개되지 않은 글입니다","modalPopup");
      });

      li.classList.add("post-private");
    } else {
      link.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        changePage('content', { markdownPath: post.data_url });
      });
    }
    
      listEl.appendChild(li);
    });
  }

  function renderPagination() {
    paginationEl.innerHTML = "";

    const totalPages = Math.ceil(filtered.length / pageSize);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.disabled = i === currentPage;
      btn.onclick = () => {
        currentPage = i;
        render();
      };
      paginationEl.appendChild(btn);
    }
  }

  /* Search */
  function applySearch() {
    const keyword = searchInput.value.trim();

    if (!keyword) {
      filtered = posts;
    } else {
      filtered = posts.filter(p => {
        if (searchType.value === "no") {
          return String(p.no).includes(keyword);
        }
        return p.title.includes(keyword);
      });
    }

    currentPage = 1;
    render();
  }

  function highlight(text) {
    const keyword = searchInput.value.trim();
    if (!keyword) return text;

    return text.replace(
      new RegExp(`(${keyword})`, "gi"),
      `<mark>$1</mark>`
    );
  }

    listEl.addEventListener("click", (e) => {
        const link = e.target.closest(".post-link");
        if (!link) return;

        e.preventDefault();

        const url = link.dataset.url;
        loadTile("content", url);
    });

  /* Event Binding */
  searchInput.addEventListener("input", applySearch);
  searchType.addEventListener("change", applySearch);

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    filtered = posts;
    currentPage = 1;
    render();
  });

  pageSizeSelect?.addEventListener("change", e => {
    pageSize = Number(e.target.value);
    currentPage = 1;
    render();
  });

};