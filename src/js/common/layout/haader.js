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

        // 🏠 홈 이동
        if (e.target.closest(".home")) {
            e.preventDefault();
            if (window.buildTOC) window.buildTOC(null);
            changePage("index");
            return;
        }

        // 🎯 포스트 필터 버튼 클릭
        if (e.target.closest(".filter-btn")) {
            const btn = e.target.closest(".filter-btn");

            const filterBtns = document.querySelectorAll(".filter-btn");
            const posts = document.querySelectorAll(".post-list li");

            // active 클래스 토글
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const cat = btn.dataset.cat;
            posts.forEach(post => {
                post.style.display = (cat === "all" || post.dataset.cat === cat) ? "block" : "none";
            });

            return;
        }
    });
};