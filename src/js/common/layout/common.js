const changePage = async (page) => {
    const map = {
        index: "./main.html",
        frontlist: "./frontend/list.html",
        backlist: "./backend/list.html"
    };
    await loadTile("content", map[page]);
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadTile("header", "./tiles/header.html");
    await loadTile("sidebar", "./tiles/sidebar.html");
    await loadTile("footer", "./tiles/footer.html");

    initSidebar();
    changePage("index");
});