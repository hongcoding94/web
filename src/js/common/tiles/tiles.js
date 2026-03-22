window.loadTile = async (id, file, push = true) => {
    const res = await fetch(file);
    if (!res.ok) throw new Error(file);

    const html = await res.text();
    const target = document.getElementById(id);
    if (!target) return;

    target.innerHTML = html;

    if (push) {
        history.pushState(
            { tile: file }, "", location.pathname
        );
    }

    if (id === "header" && window.initHeader) {
        window.initHeader();
    }

    if (id === "sidebar") {
        if (window.initSidebar) await window.initSidebar();
        if (window.initSidebarUI) window.initSidebarUI();
    }

    if (id === "content") {
        if (window.initContent) window.initContent(target);
        if (window.initList) window.initList(target);
    }
};

document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-tile]");
    if (!link) return;

    e.preventDefault();
    loadTile("content", link.dataset.tile);
});

window.addEventListener("popstate", (e) => {
    if (e.state?.tile) {
        loadTile("content", e.state.tile, false);
    } else {
        loadTile("content", "../pages/tiles/list.html", false);
    }
});

history.replaceState(
    { tile: "../pages/tiles/list.html" }, "", location.pathname
);