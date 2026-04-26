let modal = null;
let modalBody = null;

function initModal() {
  modal = document.getElementById("projectModal");
  modalBody = document.getElementById("modalBody");

  if (!modal || !modalBody) {
    console.error("❌ modal DOM not found (HTML not injected yet)");
    return;
  }

  const closeBtn = modal.querySelector(".modal-close");
  const backdrop = modal.querySelector(".modal-backdrop");

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

async function fetchPostData(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      console.warn(`⚠️ 파일을 찾을 수 없습니다 (Status: ${res.status}): ${path}`);
      return [];
    }
    const data = await res.json();
    return (data && Array.isArray(data)) ? data : [];
  } catch (e) {
    console.error(`❌ Fetch Error (${path}):`, e);
    return [];
  }
}

function renderPostList(containerId, posts , checkPrivate = false) {
  const listEl = document.getElementById(containerId);
  if (!listEl) return;

  if (posts.length === 0) {
    listEl.innerHTML = `
      <li class="no-data">
        <p>게시물이 없습니다. 곧 새로운 소식으로 찾아뵙겠습니다!</p>
      </li>`;
    return;
  }

  listEl.innerHTML = posts.map((post, index) => {
    const category = (post.category || 'tech').toLowerCase();
    const title = post.title || "제목 없음";
    const displayTitle = typeof highlight === 'function' ? highlight(title) : title;
    const description = post.description || post.summary || '내용 요약이 없습니다.';
    const date = post.date || '-';

    return `
      <li data-cat="${category}">
        <a href="javascript:void(0);" class="tile-link" data-index="${index}">
          <strong>${displayTitle}</strong>
          <p>${description}</p>
          <span>${date}</span>
        </a>
      </li>`;
  }).join('');

  listEl.querySelectorAll('.tile-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const idx = this.getAttribute('data-index');
      const post = posts[idx];

      if (checkPrivate && post.private_page === "Y") {
        showPopup("🤖 봇이 최신 데이터를 인덱싱 중입니다. \n누락된 정보가 없도록 꼼꼼히 검토한 뒤 공개하겠습니다.", "modalPopup");
        return;
      }

      const newState = {
        tile: "./tiles/content.html",
        markdownPath: post.data_url
      };

      if (typeof window.loadTile === 'function') {
        window.loadTile("content", "./tiles/content.html", newState, true);
      }
    });
  });
}

/* 최근 게시물 (3개) */
async function initProjectPosts() {
  setTimeout(async () => {
    const posts = await fetchPostData("../data/recent_3.json");
    renderPostList("recent-post-list", posts, true);
  }, 50);
}

/* 최근 트러블슈팅 게시물 (3개) */
async function initFeaturedProjects() {
  const posts = await fetchPostData("../data/shooting_recent_3.json");
  renderPostList("trouble-post-list", posts, false);
}

/* 최근 활동 분포 */
async function loadDashboard() {
    try {
        const response = await fetch('../data/total_posts.json');
        if (!response.ok) return;
        const posts = await response.json();

        // --- [안전장치 1] 필수 DOM 요소 확인 ---
        const totalCountEl = document.getElementById('totalCount');
        const chartCanvas = document.getElementById('categoryChart');
        const legendContainer = document.getElementById('customLegend');
        const timelineContainer = document.getElementById('timelineContainer');

        // 요소가 하나라도 없으면 라이브러리 로드를 기다리거나 실행 중단
        if (!totalCountEl || !chartCanvas) {
            console.warn("⚠️ 대시보드 요소를 찾을 수 없어 로드를 중단합니다.");
            return;
        }

        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const colors = isDark ? 
            ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#9b59b6', '#1abc9c'] : 
            ['#0984e3', '#00b894', '#fdcb6e', '#e17055', '#6c5ce7', '#1dd1a1'];

        const counts = posts.reduce((acc, p) => {
            const cat = String(p.category || '').trim();
            if (cat && cat !== 'undefined' && cat !== 'null') {
                acc[cat] = (acc[cat] || 0) + 1;
            }
            return acc;
        }, {});

        const labels = Object.keys(counts);
        const dataValues = Object.values(counts);
        
        totalCountEl.innerText = dataValues.reduce((a, b) => a + b, 0);

        // --- [안전장치 2] Chart.js 로드 확인 ---
        if (typeof Chart !== 'undefined') {
            new Chart(chartCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: colors,
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    cutout: '82%',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }

        // 범례 생성
        if (legendContainer) {
            legendContainer.innerHTML = ''; 
            labels.forEach((label, i) => {
                const item = document.createElement('div');
                item.className = 'chart_legend_item';
                item.innerHTML = `
                    <span class="chart_dot" style="background:${colors[i % colors.length]}"></span>
                    <span class="chart_cat_name">${label}</span>
                    <span class="chart_cat_val">${dataValues[i]}</span>
                `;
                legendContainer.appendChild(item);
            });
        }

        // 타임라인 생성
        if (timelineContainer) {
            timelineContainer.innerHTML = '';
            posts.slice(0, 3).forEach(post => {
                const el = document.createElement('div');
                el.className = 'chart_timeline_item';
                el.innerHTML = `
                    <div class="chart_time_date">${post.date}</div>
                    <div class="chart_time_title">${post.title}</div>
                    <div class="chart_time_tag"># ${post.category}</div>
                `;
                timelineContainer.appendChild(el);
            });
        }

    } catch (e) {
        console.error("❌ Dashboard Load Error:", e);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart === 'undefined') {
        console.error("Chart.js 라이브러리가 로드되지 않았습니다.");
        return;
    }
    loadDashboard();
});

function professionalExperience() {
  if (typeof changePage === 'function') {
    changePage('experience');
  }
}

function initProjectSection() {
  initModal();
  initFeaturedProjects();
  initProjectPosts();
}

window.initProjectSection = initProjectSection;