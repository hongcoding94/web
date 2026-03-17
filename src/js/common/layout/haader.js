window.initHeader = () => {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
    });

    
    const home = document.querySelector(".home");
    home.addEventListener("click", (e) => {
        changePage("index");
    });

};