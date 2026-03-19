/*
   게시글 리스트 (TILES 전용)
*/
window.initList = function (root) {
  if (!root || root.id !== "content") return;

  const listEl = root.querySelector("#postList");
  if (!listEl) return;

  let posts = [];
  let currentPage = 1;
  let pageSize = 10;

  fetch("../data/backend/post.json")
    .then(res => {
      if (!res.ok) throw new Error("post.json 로드 실패");
      return res.json();
    })
    .then(data => {
      posts = data.sort((a, b) => b.date.localeCompare(a.date));
      render();
    })
    .catch(err => {
      console.error("게시글 로드 실패:", err);
    });

  function render() {
    renderList();
    renderPagination();
  }

  function renderList() {
    listEl.innerHTML = "";

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    posts.slice(start, end).forEach(post => {
      const li = document.createElement("li");
      li.innerHTML = `
        <h3>
          <a href="#" data-page="${post.url}">
            ${post.title}
          </a>
        </h3>
        <small>${post.date}</small>
        <p>${post.summary}</p>
      `;
      listEl.appendChild(li);
    });
  }

  function renderPagination() {
    const pager = root.querySelector("#pagination");
    pager.innerHTML = "";

    const totalPages = Math.ceil(posts.length / pageSize);
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.disabled = i === currentPage;
      btn.onclick = () => {
        currentPage = i;
        render();
      };
      pager.appendChild(btn);
    }
  }

  root.querySelector("#pageSize")?.addEventListener("change", e => {
    pageSize = Number(e.target.value);
    currentPage = 1;
    render();
  });
};