window.initSidebar = async function () {
    const nav = document.getElementById("sidebarNav");

    if (!nav) {
        console.warn("[sidebar] sidebarNav not found");
        return;
    }

    console.log("[sidebar] init start");

    const res = await fetch("../data/chapter/chapter_list.json");
    if (!res.ok) {
        console.error("[sidebar] json fetch failed");
        return;
    }

    const data = await res.json();
    console.log("[sidebar] json loaded", data);

    nav.innerHTML = "";

    data.forEach(group => {
        const section = document.createElement("div");
        section.className = "sidebar-section";

        const title = document.createElement("h3");
        title.textContent = group.title;
        section.appendChild(title);

        group.children.forEach(item => {
            const link = document.createElement("a");
            link.textContent = item.title;
            link.href = "javascript:void(0)";
            link.onclick = () => {
                window.currentPostList = item.post_list;
                changePage(item.page);
            };
            section.appendChild(link);
        });

        nav.appendChild(section);
    });
};

/*
   TOC 생성 + 초기화 통합 버전
*/
window.buildTOC = (root) => {
    const toc = document.getElementById("toc");
    if (!toc) return;

    /*
       1. 무조건 초기화 (핵심)
    */
    // 기존 TOC 제거
    toc.innerHTML = "";
    toc.style.display = "none";

    // 기존 content에 남아있는 toc-id 제거
    document.querySelectorAll("[id^='toc-']").forEach(el => {
        el.removeAttribute("id");
    });

    /*
       2. content 아닌 경우 차단
    */
    if (!root || root.id !== "content") {
        return;
    }

    /*
       3. header 탐색 (content 내부만)
    */
    const headers = root.querySelectorAll(".c1, .c2, .c3");

    if (!headers.length) {
        return;
    }

    /*
       4. TOC 생성 시작
    */
    toc.style.display = "block";

    headers.forEach((el, idx) => {
        const id = "toc-" + idx;
        el.id = id;

        const link = document.createElement("a");
        link.href = "#"; 
        link.textContent = el.textContent;

        // depth 스타일
        if (el.classList.contains("c1")) link.className = "toc-c1";
        if (el.classList.contains("c2")) link.className = "toc-c2";
        if (el.classList.contains("c3")) link.className = "toc-c3";

        /*
           5. 스크롤 이동 (핵심)
        */
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