/*
   게시글 리스트 (TILES 전용)
   - 검색 (페이지번호 / 제목)
   - 엔터키 검색 UX
   - 페이징
   - 페이지 사이즈 변경
*/
window.initList = function (root) {
  if (!root || root.id !== "content") return;

  const listEl = root.querySelector("#postList");
  const pagerEl = root.querySelector("#pagination");
  const pageSizeEl = root.querySelector("#pageSize");
  const searchTypeEl = root.querySelector("#searchType");
  const searchKeywordEl = root.querySelector("#searchKeyword");
  const searchBtnEl = root.querySelector("#searchBtn");

  if (!listEl || !pagerEl) return;

  let allPosts = [];       // 서버에서 받은 전체 데이터
  let filteredPosts = []; // 검색 결과
  let currentPage = 1;
  let pageSize = 10;

  /* ===============================
     Data Load
  ================================ */
  fetch("../data/backend/post.json")
    .then(res => {
      if (!res.ok) throw new Error("post.json 로드 실패");
      return res.json();
    })
    .then(data => {
      // 날짜 기준 최신순
      allPosts = data.sort((a, b) => b.date.localeCompare(a.date));
      filteredPosts = [...allPosts];
      render();
    })
    .catch(err => {
      console.error("게시글 로드 실패:", err);
    });

  /* ===============================
     Render
  ================================ */
  function render() {
    renderList();
    renderPagination();
  }

  function renderList() {
    listEl.innerHTML = "";

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    filteredPosts.slice(start, end).forEach(post => {
      const li = document.createElement("li");
      li.className = "post-item";

      li.innerHTML = `
        <a href="${post.url}">
            <div class="post-no">${post.no}</div>

            <div class="post-main">
                <div class="post-top">
                    <div class="post-title">${post.title}</div>
                    <div class="post-date">${post.date}</div>
                </div>

                <div class="post-summary">
                    ${post.summary}
                </div>
            </div>
        </a>
      `;

      listEl.appendChild(li);
    });
  }

  function renderPagination() {
    pagerEl.innerHTML = "";

    const totalPages = Math.ceil(filteredPosts.length / pageSize);
    if (totalPages === 0) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.disabled = i === currentPage;

      btn.addEventListener("click", () => {
        currentPage = i;
        render();
      });

      pagerEl.appendChild(btn);
    }
  }

  /* ===============================
     Page Size Change
  ================================ */
  pageSizeEl?.addEventListener("change", e => {
    pageSize = Number(e.target.value);
    currentPage = 1;
    render();
  });

  /* ===============================
     Search Logic
  ================================ */
  function search() {
    const type = searchTypeEl.value;
    const keyword = searchKeywordEl.value.trim();

    currentPage = 1;

    if (!keyword) {
      filteredPosts = [...allPosts];
    } else {
      filteredPosts = allPosts.filter(post => {
        if (type === "no") {
          return String(post.no) === keyword;
        }

        if (type === "title") {
          return post.title.includes(keyword);
        }

        // 전체 검색
        return (
          String(post.no).includes(keyword) ||
          post.title.includes(keyword)
        );
      });
    }

    render();
  }

  /* ===============================
     Search Events (UX)
  ================================ */
  searchBtnEl?.addEventListener("click", search);

  // 엔터키 검색
  searchKeywordEl?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      search();
    }
  });
};