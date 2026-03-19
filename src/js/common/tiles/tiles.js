/* ===============================
   TILES Loader (최종 통합본)
================================ */
window.loadTile = async (id, file) => {
    const res = await fetch(file);
    if (!res.ok) throw new Error(file);

    /* ===============================
       1️⃣ 상태 초기화
       - 이전 페이지 잔재 제거
    ================================ */
    if (typeof window.resetTOC === "function") {
        window.resetTOC();
    }

    const html = await res.text();
    const target = document.getElementById(id);
    if (!target) return;

    target.innerHTML = html;

    /* ===============================
       2️⃣ content 영역 초기화
       - 페이지별 init 훅 실행
    ================================ */
    if (id === "content") {

        /* 공통 콘텐츠 초기화 */
        if (typeof window.initContent === "function") {
            window.initContent(target);
        }

        /* 게시글 리스트 페이지 */
        if (typeof window.initList === "function") {
            window.initList(target);
        }

        /* 추후 확장 예시 */
        /*
        if (typeof window.initPost === "function") {
            window.initPost(target);
        }

        if (typeof window.initAbout === "function") {
            window.initAbout(target);
        }
        */
    }
};