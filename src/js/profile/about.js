let ABOUT_DATA = null; 

async function fetchAboutData() {
    try {
        const response = await fetch('../data/chapter/profile.json');
        if (!response.ok) {
            throw new Error(`Data Fetch Failed: ${response.status}`);
        }
    
        ABOUT_DATA = await response.json();
        AboutRenderer.init();
    } catch (error) {
        console.error("Critical Error:", error);
        location.href = "../pages/error.html";
    }
}

const AboutRenderer = {
    init() {
        this.renderIntro();
        this.renderExpertise();
        this.renderSystemLogs();
        this.renderPhilosophy();
        this.renderFooter();
    },
    renderIntro() {
        document.querySelector('.slogan').innerText = ABOUT_DATA.intro.slogan;
        document.getElementById('main-headline').innerHTML = ABOUT_DATA.intro.headline;
        document.getElementById('main-description').innerText = ABOUT_DATA.intro.description;
    },
    renderExpertise() {
        const list = document.getElementById('expertise-list');
        list.innerHTML = ABOUT_DATA.expertise.map(item => `
            <div class="exp-item">
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
                <ul>${item.details.map(d => `<li>${d}</li>`).join('')}</ul>
            </div>
        `).join('');
    },
    renderSystemLogs() {
        const list = document.getElementById('stats-list');
        list.innerHTML = ABOUT_DATA.systemLogs.map(log => `
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${log.label}</span>
                    <span class="stat-value">${log.value}</span>
                </div>
                <div class="stat-desc">${log.desc}</div>
            </div>
        `).join('');
    },
    renderPhilosophy() {
        const list = document.getElementById('philosophy-list');
        list.innerHTML = ABOUT_DATA.philosophy.map(p => `
            <div class="phil-item">
                <h3>${p.title}</h3>
                <p>${p.content}</p>
            </div>
        `).join('');
    },
    renderFooter() {
        document.getElementById('footer-identity').innerText = ABOUT_DATA.identity.footer;
        document.getElementById('next-step-label').innerText = ABOUT_DATA.identity.nextStep;
    }
};

window.fetchAboutData = fetchAboutData();
document.addEventListener('DOMContentLoaded', window.initAboutPage);