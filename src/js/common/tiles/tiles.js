window.loadTile = async (id, file, state = {}, push = true) => {
    const res = await fetch(file);
    if (!res.ok) throw new Error(file);

    const html = await res.text();
    const target = document.getElementById(id);
    if (!target) return;

    target.innerHTML = html;
    
    if (push) {
        history.pushState(
            { tile: file, ...state, targetId: id }
            , ""
            , location.pathname
        );
    }

    console.debug(`✅ Loaded tile: ${file} into #${id}`, { file, id, state });

    if (id === "header" && window.initHeader) {
        window.initHeader();
    }

    if(id === "index") {
        window.initProjectSection();
    }
    
    if (id === "content") {
        if (window.initContent) window.initContent(target);
        if (window.initList) window.initList(target, state);
        
        if (window.initFeaturedProjects) {
            window.initFeaturedProjects();
        }

        if (window.initProjectPosts) {
            window.initProjectPosts();
        }

        if (state?.markdownPath) {
            if (window.loadMarkdown) window.loadMarkdown(state.markdownPath);
        }
    }

    if (id === "sidebar") {
        if (window.initSidebar) await window.initSidebar();
        if (window.initSidebarUI) window.initSidebarUI();
    
        const hamburger = document.querySelector('[data-action="toggle-sidebar"]');
        if (hamburger) {
            hamburger.onclick = window.toggleSidebar;
        }
    }

};

document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-tile]");
    if (!link) return;

    e.preventDefault();
    loadTile("content", link.dataset.tile, e.state, false);
});

window.addEventListener("popstate", (e) => {
    if (!e.state?.tile) return;
    loadTile("content", e.state.tile, e.state, false);
});