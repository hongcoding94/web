const changePage = async (page) => {
    const map = {
        index: "./index.html",
        frontlist: "./frontend/list.html",
        backlist: "./backend/list.html",
        content: "./tiles/content.html"
    };

    const file = map[page];
    if (!file) {
        console.warn("Unknown page:", page);
        return;
    }

    await loadTile("content", file);
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadTile("header", "./tiles/header.html");
    await loadTile("sidebar", "./tiles/sidebar.html");
    await loadTile("footer", "./tiles/footer.html");

    initHeader();
    initSidebar();

    changePage("index");
});

