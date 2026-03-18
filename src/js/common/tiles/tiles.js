window.loadTile = async (id, file) => {
    const res = await fetch(file);
    if (!res.ok) throw new Error(file);

    // ✅ 상태 초기화
    if (window.resetTOC) {
        window.resetTOC();
    }

    const html = await res.text();
    const target = document.getElementById(id);
    target.innerHTML = html;

    if (id === "content" && typeof window.initContent === "function") {
        window.initContent(target);
    }
};