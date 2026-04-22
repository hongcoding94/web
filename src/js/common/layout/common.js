const changePage = async (page, state = {}) => {
    const map = {
        index: "./main.html",
        experience: "./experience.html",
        list: "./components/list.html",
        content: "./tiles/content.html",
    };

    const file = map[page];
    if (!file) return;

    await loadTile("content", file, {
        tile: file,
        ...state
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadTile("header", "./tiles/header.html", {}, false);
    await loadTile("sidebar", "./tiles/sidebar.html", {}, false);
    await loadTile("footer", "./tiles/footer.html", {}, false);

    changePage("index");
});

function showPopup(msg, type) {
  if (type === 'toastPopup') {
    renderToast(msg);
  } else if (type === 'modalPopup') {
    renderModal(msg);
  }
}

function renderToast(msg) {
  const existingToast = document.querySelector('.comm-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'comm-toast';
  toast.innerHTML = `<span>${msg.replace(/\n/g, '<br>')}</span>`;
  
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('active'), 10);

  // 3초 후 제거
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function renderModal(msg) {
  const existingModal = document.querySelector('.comm-modal-overlay');
  if (existingModal) existingModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'comm-modal-overlay';
  
  overlay.innerHTML = `
    <div class="comm-modal-content">
      <div class="comm-modal-body">
        <p>${msg.replace(/\n/g, '<br>')}</p>
      </div>
      <div class="comm-modal-footer">
        <button class="comm-modal-btn" onclick="closeCommModal()">확인</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCommModal();
  });
}

function closeCommModal() {
  const overlay = document.querySelector('.comm-modal-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  }
}