window.initSidebar = () => {
    const sidebar = document.querySelector(".sidebar-menu");
    if (!sidebar) return; // ⭐ 핵심: 방어 코드

    sidebar.addEventListener("click", (e) => {

        const title = e.target.closest(".menu-title");
        const item  = e.target.closest(".menu-item");

        /** ✅ 폴더(Depth 토글) */
        if (title) {
            e.stopPropagation();

            const group = title.closest(".menu-group");
            if (!group) return;

            const submenu = group.querySelector(":scope > .submenu");
            if (!submenu) return;

            const icon = title.querySelector(".toggle-icon");
            const isOpen = submenu.classList.toggle("open");

            if (icon) {
                icon.textContent = isOpen ? "-" : "+";
            }
            return;
        }

        /** ✅ 페이지 이동 */
        if (item) {
            e.stopPropagation();

            const page = item.dataset.page;
            if (!page) return;

            changePage(page);
        }
    });
};