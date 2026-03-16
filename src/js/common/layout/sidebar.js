window.initSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    sidebar.addEventListener("click", (e) => {
        const item = e.target.closest("[data-page]");
        if (!item) return;
        changePage(item.dataset.page);
    });
};