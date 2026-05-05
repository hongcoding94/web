/*
   Copy Button
*/
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;

    const block = btn.closest(".code-block");
    const code = block.querySelector(".code-lines");
    if (!code) return;

    navigator.clipboard.writeText(code.innerText);

    btn.textContent = "Copied!";
    setTimeout(() => {
        btn.textContent = "Copy";
    }, 1200);
});

/*
   Markdown Code → Custom Wrapper
*/
function replaceCodeBlocks(root) {
    if (!root) return;

    const codes = root.querySelectorAll("pre > code");

    codes.forEach(code => {
        const pre = code.parentElement;
        if (!pre || pre.dataset.replaced) return;

        const langClass = [...code.classList].find(c => c.startsWith("language-"));
        const language = langClass
            ? langClass.replace("language-", "").toUpperCase()
            : "TEXT";

        const raw = code.textContent;

        const wrapper = document.createElement("div");
        wrapper.className = "code-block";

        wrapper.innerHTML = `
            <div class="code-header">
                <span class="language">${language}</span>
                <button class="copy-btn">Copy</button>
            </div>
            <div class="code-body">
                <script type="text/plain" class="raw-code"></script>
            </div>
        `;

        wrapper.querySelector(".raw-code").textContent = raw;

        pre.dataset.replaced = "true";
        pre.replaceWith(wrapper);
    });
}

function renderCodeBlock(block) {
    if (block.dataset.inited === "true") return;
    block.dataset.inited = "true";

    const rawEl = block.querySelector(".raw-code");
    const body = block.querySelector(".code-body");
    if (!rawEl || !body) return;

    const lines = rawEl.textContent.replace(/\n$/, "").split("\n");
    rawEl.remove();

    const lineNumbers = document.createElement("div");
    lineNumbers.className = "line-numbers";

    const codeLines = document.createElement("div");
    codeLines.className = "code-lines";

    lines.forEach((line, i) => {
        const ln = document.createElement("div");
        ln.className = "line-number";
        ln.textContent = i + 1;

        const cl = document.createElement("div");
        cl.className = "code-line";
        cl.textContent = line || " ";

        lineNumbers.appendChild(ln);
        codeLines.appendChild(cl);
    });

    body.innerHTML = "";
    body.append(lineNumbers, codeLines);

    body.addEventListener("scroll", () => {
        lineNumbers.scrollTop = body.scrollTop;
    });
}

/*
   TOC
*/
function generateTOC(root = document) {
    const contentRoot = root.querySelector("#content");
    if (!contentRoot) return;

    const article = contentRoot.querySelector(".content-article");
    const tocList = contentRoot.querySelector("#tocList");

    if (!article || !tocList) return;

    tocList.innerHTML = "";

    const headers = article.querySelectorAll("h1, h2, h3");
    if (headers.length === 0) return;

    headers.forEach((h, idx) => {
        const li = document.createElement("li");
        li.className =
            h.tagName === "H1" ? "c1" :
            h.tagName === "H2" ? "c2" : "c3";

        const id = `toc-${idx}`;
        h.id = id;

        const a = document.createElement("a");
        a.href = `#${id}`;
        a.textContent = h.textContent;

        a.addEventListener("click", (e) => {
            e.preventDefault();
            h.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        li.appendChild(a);
        tocList.appendChild(li);
    });
}

/*
   Init Content
*/
function initContent(root) {
    if (!root) return;

    root.querySelectorAll(".code-block").forEach(block => {
        block.dataset.inited = "";
        renderCodeBlock(block);
    });

}

/*
   Markdown Loader
*/
async function loadMarkdown(path) {
    if (!path) return;

    const render = async (article) => {
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(path);

            const markdown = await res.text();
            const html = marked.parse(markdown);

            article.innerHTML = html;

            enhanceTwoColumnTables(article);
            enhanceMarkdownMeta(article);
            replaceVideoLinks(article);
            replaceCodeBlocks(article);
            generateTOC(document);
            initContent(document);

            window.scrollTo({ top: 0 });
        } catch (e) {
            console.error("Markdown load error:", e);
        }
    };

    let article = document.querySelector(".content-article");
    if (article) {
        await render(article);
        return;
    }

    const observer = new MutationObserver(async (_, obs) => {
        article = document.querySelector(".content-article");
        if (article) {
            await render(article);
            obs.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function replaceVideoLinks(root) {
    if (!root) return;

    const links = root.querySelectorAll("a[href$='.mp4']");
    links.forEach(link => {
        const video = document.createElement("video");
        video.src = link.href;
        video.controls = true;
        video.textContent = link.textContent || "Video";

        // 원래 링크를 video로 교체
        link.replaceWith(video);
    });
}

function enhanceTwoColumnTables(root) {
    if (!root) return;

    const tables = root.querySelectorAll("table");

    tables.forEach(table => {
        if (table.dataset.twoColumnApplied === "true") return;

        const headers = Array.from(table.querySelectorAll("th"))
            .map(th => th.textContent.trim());

        const headerSet = new Set(headers);

        const isExactLeftRightTable =
            headerSet.size === 2 &&
            headerSet.has("왼쪽") &&
            headerSet.has("오른쪽");

        if (!isExactLeftRightTable) return;

        const rows = Array.from(table.querySelectorAll("tbody tr"));

        const wrapper = document.createElement("div");
        wrapper.className = "two-column-table";

        const leftCol = document.createElement("div");
        leftCol.className = "two-column left";

        const rightCol = document.createElement("div");
        rightCol.className = "two-column right";

        const leftTable = document.createElement("table");
        const rightTable = document.createElement("table");

        const leftTbody = document.createElement("tbody");
        const rightTbody = document.createElement("tbody");

        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (cells.length < 2) return;

            const leftCell = cells[0].cloneNode(true);
            leftCell.querySelectorAll("img, video").forEach(el => {
                el.classList.add("md-media");
                if (el.tagName === "VIDEO") {
                    el.classList.add("md-video");
                }
            });

            const leftRow = document.createElement("tr");
            leftRow.appendChild(leftCell);
            leftTbody.appendChild(leftRow);

            const rightCell = cells[1].cloneNode(true);
            rightCell.querySelectorAll("img, video").forEach(el => {
                el.classList.add("md-media");
                if (el.tagName === "VIDEO") {
                    el.classList.add("md-video");
                }
            });

            const rightRow = document.createElement("tr");
            rightRow.appendChild(rightCell);
            rightTbody.appendChild(rightRow);
        });

        leftTable.appendChild(leftTbody);
        rightTable.appendChild(rightTbody);

        leftCol.appendChild(leftTable);
        rightCol.appendChild(rightTable);

        wrapper.appendChild(leftCol);
        wrapper.appendChild(rightCol);

        table.dataset.twoColumnApplied = "true";
        table.replaceWith(wrapper);
    });
}

function enhanceMarkdownMeta(article) {
  if (!article) return;

  const paragraphs = Array.from(article.querySelectorAll("p"));

  for (const p of paragraphs) {
    const lines = p.textContent
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length < 2) continue;

    const metaItems = [];
    for (const line of lines) {
      if (!/^[^:]+:\s?.+/.test(line)) return;

      const [label, ...rest] = line.split(":");
      metaItems.push({
        label: label.trim(),
        value: rest.join(":").trim()
      });
    }

    const wrapper = document.createElement("div");
    wrapper.className = "issue-meta";

    const ul = document.createElement("ul");
    ul.className = "issue-meta-list";

    let statusValue = "";

    metaItems.forEach(({ label, value }) => {
      if (label === "진행 상황") statusValue = value;

      const li = document.createElement("li");

      const l = document.createElement("span");
      l.className = "label";
      l.textContent = label;

      const v = document.createElement("span");
      v.className = "value";
      v.textContent = value;

      li.append(l, v);
      ul.appendChild(li);
    });

    if (statusValue) {
      const badge = document.createElement("span");
      badge.className = "issue-badge success";
      badge.textContent = statusValue;
      wrapper.appendChild(badge);
    }

    wrapper.appendChild(ul);

    const h1 = article.querySelector("h1");
    h1?.insertAdjacentElement("afterend", wrapper);

    p.remove();
    break;
  }
}

window.loadMarkdown = loadMarkdown;
window.initContent = initContent;