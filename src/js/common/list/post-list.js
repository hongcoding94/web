/*
   게시글 리스트 + 검색 + UX 강화
*/
window.initList = function (root) {
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

  /*
     Data Load
  */
  fetch("../data/backend/post.json")
    .then(res => res.json())
    .then(data => {
      posts = data.sort((a, b) => b.date.localeCompare(a.date));
      filtered = posts;
      render();
    })
    .catch(err => {
      console.error("[post-list] data load failed", err);
    });

  /*
     Render
  */
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
      <a href="#" data-tile="${post.data_url}" class="tile-link">
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

    // 🔥 private_page 처리
    const link = li.querySelector("a");

    if (post.private_page === "y") {
      link.addEventListener("click", (e) => {
        e.preventDefault();       // 이동 차단
        e.stopPropagation();     // tiles 전파 차단
        alert("아직 공개되지 않은 글입니다");
      });

      // (선택) 시각적 힌트
      li.classList.add("post-private");
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

  /*
     Search
  */
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

  /*
     Event Binding
  */
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