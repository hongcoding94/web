window.initHeader = () => {
    const header = document.querySelector(".header");
    if (!header) return;

    // ❗ 중복 방지
    if (header.dataset.inited) return;
    header.dataset.inited = "true";

    const toggle = document.getElementById("themeToggle");

    /* ===============================
       초기 다크모드 적용
    ============================== */
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        if (toggle) toggle.checked = true;
    }

    /* ===============================
       이벤트 위임
    ============================== */
    header.addEventListener("click", (e) => {

        // 🌙 다크모드 토글
        if (e.target.closest("#themeToggle")) {
            document.body.classList.toggle("dark");

            const isDark = document.body.classList.contains("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");

            return;
        }

        // 🏠 홈 이동 (🔥 핵심 수정)
        if (e.target.closest(".home")) {
            e.preventDefault();

            // ❗ TOC + anchor 완전 초기화
            if (window.buildTOC) {
                window.buildTOC(null);
            }

            changePage("index");
            return;
        }
    });
};