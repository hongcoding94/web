window.loadTile = async (id, file) => {
    const res = await fetch(file);
    if (!res.ok) throw new Error(file);

    const html = await res.text();
    const target = document.getElementById(id);
    if (!target) return;

    target.innerHTML = html;

    if (id === "header" && typeof window.initHeader === "function") {
        window.initHeader();
    }

    if (id === "sidebar") {
        if (typeof window.initSidebar === "function") {
            await window.initSidebar();   // DOM 생성
        }
        if (typeof window.initSidebarUI === "function") {
            window.initSidebarUI();       // 이벤트 바인딩
        }
    }

    if (id === "content") {
        if (typeof window.initContent === "function") {
            window.initContent(target);
        }
        if (typeof window.initList === "function") {
            window.initList(target);
        }
    }
};

function initByPageType(root) {
    const page = root.querySelector("[data-page]");
    if (!page) return;

    const type = page.dataset.page;

    if (type === "list") window.initList?.(root);
    if (type === "post") window.initContent?.(root);
}

document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-tile]");
    if (!link) return;

    e.preventDefault();
    loadTile("content", link.dataset.tile);
});