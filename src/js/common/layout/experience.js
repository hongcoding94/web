let projectData = [];

async function renderTimeline() {
    const projects = await fetch("../data/project/project_history.json");
    if (!projects.ok) throw new Error("projects.json load failed");
    const data = await projects.json();
    projectData = data;

    console.log("프로젝트 타임라인 데이터 로드 완료", { projectData });

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
                <p>${p.period.start} ~ ${p.period.end} 
                    <strong>( ${p.status.active === "ACTIVE" ? "진행중" : p.status.active === "PLANNED" ? "진행예정" : "종료"} )</strong>
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
    console.log("프로젝트 상세 열기", { index: i});
    const data = projectData[i];
    if(!data) return;

    document.getElementById('mT').innerText = data.projectName;
    document.getElementById('mD').innerText = data.period.start + " ~ " + data.period.end + " (" + `${data.status.active === "ACTIVE" ? "진행중" : data.status.active === "PLANNED" ? "진행예정" : "종료"}` + ")";
    
    let techStackHtml = '';
    if(data.techStack) {
        const md = data.techStack;
        techStackHtml = `
            <br/>

            <div class="modal-tech-section">
                <h3>기술 스택</h3>
                <p><strong>OS :</strong> ${md.os.join(', ') || '-'}</p>
                <p><strong>DBMS :</strong> ${md.dbms.join(', ') || '-'}</p>
                <p><strong>Backend :</strong> ${md.backend.join(', ') || '-'}</p>
                <p><strong>Frontend :</strong> ${md.frontend.join(', ') || '-'}</p>
            </div>
        `;
    }

    const tagsHtml = data.tags.map(tag => `<span class="tag">#${tag}</span>`).join(' ');

    document.getElementById('mB').innerHTML = `
        <div class="modal-body-content">
            ${techStackHtml}
            <div class="modal-desc-section" style="margin-top:20px;">
                <h3>상세 내용</h3>
                <p>${data.description}</p>
            </div>
            <div class="modal-tag-section" style="margin-top:20px; color: var(--exp-accent);">
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