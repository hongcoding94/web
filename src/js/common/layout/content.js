/* Copy Button */
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;

    const code = btn
        .closest(".code-block")
        .querySelector("code")
        .innerText;

    navigator.clipboard.writeText(code);

    btn.textContent = "Copied!";
    setTimeout(() => {
        btn.textContent = "Copy";
    }, 1200);
});

function initContent(root = document) {
    root.querySelectorAll(".code-block").forEach(block => {
        const code = block.querySelector("code");
        const body = block.querySelector(".code-body");

        /* 라인 넘버 영역 생성 */
        let lineNumbers = block.querySelector(".line-numbers");
        if (!lineNumbers) {
            lineNumbers = document.createElement("pre");
            lineNumbers.className = "line-numbers";
            body.prepend(lineNumbers);
        }
        
        /* 라인 수 계산 */
        const lines = code.innerText.trimEnd().split("\n").length;
        lineNumbers.innerText = Array.from(
            { length: lines },
            (_, i) => i + 1
        ).join("\n");

        /* 길면 스크롤 모드 */
        if (lines > 20) {
            body.classList.add("long");
        }

        /* 스크롤 동기화 */
        body.addEventListener("scroll", () => {
            lineNumbers.scrollTop = body.scrollTop;
        });
    });
}
window.initContent = initContent;
