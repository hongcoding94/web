window.loadTile = async (id, file) => {
    const res = await fetch(file);
    if (!res.ok) throw new Error(file);

    const html = await res.text();
    const target = document.getElementById(id);
    target.innerHTML = html;

    if (id === "content" && typeof window.initContent === "function") {
        window.initContent(target);
    }
};