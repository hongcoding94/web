async function initSidebarData() {
    const nav = document.getElementById("sidebarNav");
    if (!nav) return;

    const res = await fetch("../data/chapter/chapter_list.json");
    if (!res.ok) throw new Error("json load failed");

    const data = await res.json();
    const fixedNodes = Array.from(nav.children).filter(el =>
        el.classList.contains("profile-box") ||
        el.classList.contains("sidebar-close")
    );

    nav.innerHTML = "";
    fixedNodes.forEach(el => nav.appendChild(el));

    const rootUl = document.createElement("ul");
    rootUl.className = "sidebar-root";

    const homeLi = document.createElement("li");
    homeLi.className = "move-item";
    const home = document.createElement("a");
    home.textContent = "Home";
    home.addEventListener("click", e => {
        e.preventDefault();
        changePage("index");
        closeSidebar();
    });
    homeLi.appendChild(home);
    rootUl.appendChild(homeLi);

    data.forEach(group => {
        const groupLi = document.createElement("li");
        groupLi.className = "sidebar-group";

        const titleBtn = document.createElement("button");
        titleBtn.className = "group-title";
        titleBtn.textContent = group.title;
        titleBtn.dataset.open = "false";

        const childUl = document.createElement("ul");
        childUl.className = "child-links";

        group.children.forEach(item => {
            const li = document.createElement("li");
            li.className = "sidebar-item";

            const a = document.createElement("a");
            a.href = "#";
            a.textContent = item.title;

            a.addEventListener("click", e => {
                e.preventDefault();
                
                changePage(item.page, {
                    listPath: item.list_path
                });
            
                closeSidebar();
            });

            li.appendChild(a);
            childUl.appendChild(li);
        });

        titleBtn.addEventListener("click", () => {
            const isOpen = titleBtn.dataset.open === "true";
            titleBtn.dataset.open = String(!isOpen);
            groupLi.classList.toggle("open", !isOpen);
        });

        groupLi.appendChild(titleBtn);
        groupLi.appendChild(childUl);
        rootUl.appendChild(groupLi);
    });

    nav.appendChild(rootUl);
}

function initSidebarUI() {
    const nav = document.getElementById("sidebarNav");
    const overlay = document.getElementById("sidebarOverlay");
    const closeBtn = nav?.querySelector(".sidebar-close");

    if (!nav || !overlay || !closeBtn) {
        console.warn("[sidebar] UI element missing");
        return;
    }

    window.openSidebar = function () {
        const nav = document.getElementById("sidebarNav");
        const overlay = document.getElementById("sidebarOverlay");
        if (!nav || !overlay) return;

        nav.classList.add("open");
        overlay.classList.add("active");
    };

    window.closeSidebar = function () {
        const nav = document.getElementById("sidebarNav");
        const overlay = document.getElementById("sidebarOverlay");
        if (!nav || !overlay) return;

        nav.classList.remove("open");
        overlay.classList.remove("active");
    };

    window.toggleSidebar = function () {
        const nav = document.getElementById("sidebarNav");
        const overlay = document.getElementById("sidebarOverlay");
        if (!nav || !overlay) return;

        nav.classList.contains("open")
            ? window.closeSidebar()
            : window.openSidebar();
    };

    closeBtn.onclick = window.closeSidebar;
    overlay.onclick = window.closeSidebar;
}

window.initSidebar = async function () {
    await initSidebarData();
    initSidebarUI();
};
