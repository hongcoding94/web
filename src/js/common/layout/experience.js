let projectData = [];

async function renderTimeline() {
    const projects = await fetch("../data/project/project_history.json");
    if (!projects.ok) throw new Error("projects.json load failed");
    
    const data = await projects.json();
    projectData = data;

    const fc = document.getElementById('fc');
    const sc = document.getElementById('sc');
    if (!fc || !sc) return;

    fc.innerHTML = '<div class="spine" id="spineLine"></div>';

    data.forEach((p, i) => {
        const up = i % 2 === 0;
        const n = document.createElement('div');
        n.className = `node ${up ? 'node-up' : 'node-down'}`;
        n.innerHTML = `
            <div class="card" onclick="openM(${i})">
                <h3>${p.projectName}</h3>
                <p>
                    고객사 : ${p.customer}
                </p>
                <p>
                    프로젝트 상태 : 
                    <strong>${p.status.active === "ACTIVE" ? "진행중" : p.status.active === "PLANNED" ? "진행예정" : "종료"}</strong>
                </p>
                <p>
                    일정 : ${p.status.start} ~ ${p.status.end}
                </p>
            </div>
            <div class="diagonal"></div>
        `;
        fc.appendChild(n);
    });

    const g = document.createElement('div'); 
    g.id = "goalNode"; 
    g.className = 'goal';
    g.innerHTML = '<span>LEAD<br>ENGINEER</span>'; 
    fc.appendChild(g);

    sc.classList.add('active');
    setTimeout(adjustSpine, 200);
}

function adjustSpine() {
    const spine = document.getElementById('spineLine');
    const goalNode = document.getElementById('goalNode');
    if (spine && goalNode) {
        const stopPoint = goalNode.offsetLeft + (goalNode.offsetWidth / 2);
        spine.style.width = stopPoint + 'px';
    }
}

function openM(i) {
    const data = projectData[i];
    if(!data) return;

    document.getElementById('mT').innerText = data.projectName;
    document.getElementById('mD').innerText = data.summary;
    
    const contribution = data.status.contribution || 0;
    const projectImg = data.projectImage || "";

    let techStackHtml = `
    <div class="project-dashboard-expanded">
        <div class="gauge-section-expansion">
            <div class="cylinder-container-big">
                <div class="cylinder-frame">
                    <div class="cylinder-glass">
                        <div class="cylinder-liquid" style="height: ${contribution}%;">
                            <div class="liquid-top-glow"></div>
                            <div class="liquid-surface"></div>
                        </div>
                    </div>
                </div>
                <div class="gauge-label-group">
                    <span class="label-main">CONTRIBUTION</span>
                    <span class="label-val">${contribution}<small>%</small></span>
                </div>
            </div>
        </div>

        <div class="tech-info-expanded">
            <div class="tech-list">
                <div class="t-row"><strong>OS</strong> <span>${data.techStack?.os?.join(', ') || '-'}</span></div>
                <div class="t-row"><strong>DBMS</strong> <span>${data.techStack?.dbms?.join(', ') || '-'}</span></div>
                <div class="t-row"><strong>Backend</strong> <span>${data.techStack?.backend?.join(', ') || '-'}</span></div>
                <div class="t-row"><strong>Frontend</strong> <span>${data.techStack?.frontend?.join(', ') || '-'}</span></div>
            </div>
        </div>
    </div>
    `;

    const tagsHtml = data.tags.map(tag => `<span class="tag">#${tag}</span>`).join(' ');

    document.getElementById('mB').innerHTML = `
        <div class="modal-body-content">
            ${techStackHtml}
            <div class="modal-desc-section">
                <h3>상세 내용</h3>
                ${data.description && data.description.length > 0 
                    ? data.description.map(desc => `<p class="desc-text"> • ${desc}</p>`).join('') 
                    : '<p class="desc-text"> • 상세 내용이 없습니다.</p>'}
            </div>

            <div class="modal-tag-section">
                ${tagsHtml}
            </div>
        </div>
    `;

    document.getElementById('md').classList.add('show');
    document.body.classList.add('scroll-lock');
}

function closeM() {
    document.getElementById('md').classList.remove('show');
    document.body.classList.remove('scroll-lock');
}

window.addEventListener('load', () => {
    renderTimeline();

    const sc = document.getElementById('sc');
    sc?.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            sc.scrollLeft += e.deltaY;
        }
    }, { passive: false });
});

window.addEventListener('resize', adjustSpine);

function initExperiencePage() {
    renderTimeline();
    adjustSpine();
};

window.initExperiencePage = initExperiencePage;