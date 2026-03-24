/* Copy Button 기능 */
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

/* Render Code Block */
function renderCodeBlock(block) {
    if (block.dataset.inited) return;
    block.dataset.inited = "true";

    const code = block.querySelector(".raw-code");
    const body = block.querySelector(".code-body");
    if (!code || !body) return;

    const raw = code.textContent.replace(/\n$/, "");
    const lines = raw.split("\n");

    code.remove();

    const lineNumbers = document.createElement("div");
    lineNumbers.className = "line-numbers";

    const codeLines = document.createElement("div");
    codeLines.className = "code-lines";

    lines.forEach((line, idx) => {
        const num = document.createElement("div");
        num.className = "line-number";
        num.textContent = idx + 1;

        const codeLine = document.createElement("div");
        codeLine.className = "code-line";
        codeLine.textContent = line || " ";

        lineNumbers.appendChild(num);
        codeLines.appendChild(codeLine);
    });

    body.innerHTML = "";
    body.appendChild(lineNumbers);
    body.appendChild(codeLines);

    if (lines.length > 25) body.classList.add("long");

    body.addEventListener("scroll", () => {
        lineNumbers.scrollTop = body.scrollTop;
    });
}

/* TOC 생성 */
function generateTOC() {
    const content = document.querySelector(".content-article");
    const tocList = document.getElementById("tocList");
    if (!content || !tocList) return;

    // 중복 방지
    tocList.innerHTML = "";

    const headers = content.querySelectorAll("h1, h2, h3");
    headers.forEach((h, idx) => {
        const li = document.createElement("li");
        li.className = h.tagName.toLowerCase() === "h1" ? "c1" :
                       h.tagName.toLowerCase() === "h2" ? "c2" : "c3";

        const a = document.createElement("a");
        a.href = `#toc-${idx}`;
        a.textContent = h.textContent;

        h.id = `toc-${idx}`;
        li.appendChild(a);
        tocList.appendChild(li);

        a.addEventListener("click", (e) => {
            e.preventDefault();
            h.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

function highlightTOCOnScroll(root = document) {
    const content = root.querySelector(".content-article");
    const tocLinks = root.querySelectorAll("#tocList li a");
    if (!content || tocLinks.length === 0) return;

    const headers = content.querySelectorAll("h1.c1, h2.c2, h3.c3");

    window.addEventListener("scroll", () => {
        let currentIdx = 0;
        headers.forEach((h, idx) => {
            const top = h.getBoundingClientRect().top;
            if (top <= 100) currentIdx = idx;
        });

        tocLinks.forEach((link, idx) => {
            link.classList.toggle("active", idx === currentIdx);
        });
    });
}

function initContent(root = document) {
    if (!root || root.id !== "content") return;

    root.querySelectorAll(".code-block").forEach(block => {
        renderCodeBlock(block);
    });
    
    generateTOC();
    highlightTOCOnScroll(root);
}

async function loadMarkdown(path) {
  if (!path) return;

  const fetchAndRender = async (article) => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Cannot fetch ${path}`);
      const markdown = await res.text();
      const html = marked.parse(markdown);
      article.innerHTML = html;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Markdown load error:", err);
    }
  };

  let article = document.querySelector(".content-article");
  if (article) {
    await fetchAndRender(article);
  } else {

    const observer = new MutationObserver(async (mutations, obs) => {
      article = document.querySelector(".content-article");
      if (article) {
        await fetchAndRender(article);
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

window.initContent = initContent;