// header.js
window.initHeader = () => {
    const header = document.querySelector(".header");
    if (!header || header.dataset.inited) return;
    header.dataset.inited = "true";

    // 다크모드
    const toggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        if (toggle) toggle.checked = true;
    }

    header.addEventListener("click", (e) => {
        if (e.target.closest("#themeToggle")) {
        document.body.classList.toggle("dark");
        localStorage.setItem(
            "theme",
            document.body.classList.contains("dark") ? "dark" : "light"
        );
        }
    });

    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            window.dispatchEvent(new Event("sidebar:toggle"));
        });
    }
};