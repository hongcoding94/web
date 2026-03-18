/* ===============================
   Copy Button
================================ */
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;

    const code = btn
        .closest(".code-block")
        .querySelector(".code-lines")
        .innerText;

    navigator.clipboard.writeText(code);

    btn.textContent = "Copied!";
    setTimeout(() => {
        btn.textContent = "Copy";
    }, 1200);
});


/* ===============================
   코드 블럭 렌더링 (핵심)
================================ */
function renderCodeBlock(block) {
    if (block.dataset.inited) return;
    block.dataset.inited = "true";

    const code = block.querySelector("code");
    const body = block.querySelector(".code-body");

    if (!code || !body) return;

    const raw = code.textContent.replace(/\n$/, "");
    const lines = raw.split("\n");

    /* 기존 code 제거 */
    code.remove();

    /* 좌측: 라인번호 */
    const lineNumbers = document.createElement("div");
    lineNumbers.className = "line-numbers";

    /* 우측: 코드 */
    const codeLines = document.createElement("div");
    codeLines.className = "code-lines";

    lines.forEach((line, idx) => {
        /* 번호 */
        const num = document.createElement("div");
        num.className = "line-number";
        num.textContent = idx + 1;

        /* 코드 */
        const codeLine = document.createElement("div");
        codeLine.className = "code-line";
        codeLine.textContent = line || " "; // 공백줄 유지

        lineNumbers.appendChild(num);
        codeLines.appendChild(codeLine);
    });

    body.innerHTML = "";
    body.appendChild(lineNumbers);
    body.appendChild(codeLines);

    /* 길면 스크롤 */
    if (lines.length > 25) {
        body.classList.add("long");
    }

    /* 스크롤 동기화 */
    body.addEventListener("scroll", () => {
        lineNumbers.scrollTop = body.scrollTop;
    });
}


/* ===============================
   initContent (최종)
================================ */
function initContent(root = document) {
    if (!root || root.id !== "content") return;

    root.querySelectorAll(".code-block").forEach(block => {
        renderCodeBlock(block);
    });

    // ✅ TOC 생성
    if (window.buildTOC) {
        window.buildTOC(root);
    }
}

window.initContent = initContent;