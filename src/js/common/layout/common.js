/**
 * 
 * @param {*} page 
 * @param {*} state
 *      [ state 항목 ]
 *      - listPath
 * 
 * 
 */

const changePage = async (page, state = {}) => {
    const map = {
        index: "./main.html",
        list: "./components/list.html"
    };

    const file = map[page];
    if (!file) return;

    await loadTile("content", file, {
        tile: file,
        ...state
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadTile("header", "./tiles/header.html");
    await loadTile("sidebar", "./tiles/sidebar.html");
    await loadTile("footer", "./tiles/footer.html");

    initSidebar();
    changePage("index");
});