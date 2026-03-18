window.initSidebar = () => {
    const sidebar = document.querySelector(".sidebar-menu");
    if (!sidebar) return;

    sidebar.addEventListener("click", (e) => {

        const title = e.target.closest(".menu-title");
        const item  = e.target.closest(".menu-item");

        /** 폴더 토글 */
        if (title) {
            e.stopPropagation();

            const group = title.closest(".menu-group");
            if (!group) return;

            const submenu = group.querySelector(":scope > .submenu");
            if (!submenu) return;

            const icon = title.querySelector(".toggle-icon");
            const isOpen = submenu.classList.toggle("open");

            if (icon) icon.textContent = isOpen ? "-" : "+";
            return;
        }

        /** 페이지 이동 */
        if (item) {
            e.stopPropagation();

            const page = item.dataset.page;
            if (!page) return;

            changePage(page);
        }
    });
};

/* ===============================
   TOC 생성 + 초기화 통합 버전
================================ */
window.buildTOC = (root) => {
    const toc = document.getElementById("toc");
    if (!toc) return;

    /* ===============================
       1. 무조건 초기화 (핵심)
    ============================== */
    // 기존 TOC 제거
    toc.innerHTML = "";
    toc.style.display = "none";

    // 기존 content에 남아있는 toc-id 제거
    document.querySelectorAll("[id^='toc-']").forEach(el => {
        el.removeAttribute("id");
    });

    /* ===============================
       2. content 아닌 경우 차단
    ============================== */
    if (!root || root.id !== "content") {
        return;
    }

    /* ===============================
       3. header 탐색 (content 내부만)
    ============================== */
    const headers = root.querySelectorAll(".c1, .c2, .c3");

    if (!headers.length) {
        return;
    }

    /* ===============================
       4. TOC 생성 시작
    ============================== */
    toc.style.display = "block";

    headers.forEach((el, idx) => {
        const id = "toc-" + idx;
        el.id = id;

        const link = document.createElement("a");
        link.href = "#"; // ❗ hash 방지
        link.textContent = el.textContent;

        // depth 스타일
        if (el.classList.contains("c1")) link.className = "toc-c1";
        if (el.classList.contains("c2")) link.className = "toc-c2";
        if (el.classList.contains("c3")) link.className = "toc-c3";

        /* ===============================
           5. 스크롤 이동 (핵심)
        ============================== */
        link.addEventListener("click", (e) => {
            e.preventDefault();

            const target = document.getElementById(id);
            if (!target) return;

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        toc.appendChild(link);
    });
};