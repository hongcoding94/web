window.loadTile = async (id, file) => {
    const res = await fetch(file);
    if (!res.ok) throw new Error(file);
    document.getElementById(id).innerHTML = await res.text();
};