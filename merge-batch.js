const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_ROOT = path.join(__dirname, 'src', 'data');
const TOTAL_OUTPUT = path.join(DATA_ROOT, 'total_posts.json');
const SHOOTING_RECENT_OUTPUT = path.join(DATA_ROOT, 'shooting_recent_3.json');
const RECENT_OUTPUT = path.join(DATA_ROOT, 'recent_3.json');

function getHash(data) {
    const sortedData = JSON.parse(JSON.stringify(data, Object.keys(data).sort()));
    return crypto.createHash('md5').update(JSON.stringify(sortedData)).digest('hex');
}

function saveFileIfChanged(filePath, newData, logMessage) {
    let isChanged = true;

    if (fs.existsSync(filePath)) {
        try {
            const oldContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (getHash(oldContent) === getHash(newData)) {
                isChanged = false;
            }
        } catch (e) {
            isChanged = true;
        }
    }

    if (isChanged) {
        fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf-8');
        console.log(`✅ 업데이트 완료: ${logMessage} -> ${filePath}`);
    } else {
        console.log(`✨ 유지됨 (변경 없음): ${logMessage}`);
    }
}

function getAllFiles(dirPath, arrayOfFiles = []) {

    const files = fs.readdirSync(dirPath);
    files.forEach(function (file) {

        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else if (file.toLowerCase() === 'list.json') {
            arrayOfFiles.push(fullPath);
        }

    });

    return arrayOfFiles;
}

function runBatch() {
    console.log("[merge_bot] 작업을 시작합니다...");

    if (!fs.existsSync(DATA_ROOT)) {
        fs.mkdirSync(DATA_ROOT, { recursive: true });
        console.log(`📁 폴더가 없어서 생성 : ${DATA_ROOT}`);
    }

    const allJsonFiles = getAllFiles(DATA_ROOT);
    let rawPosts = [];
    allJsonFiles.forEach(filePath => {
        if (
                filePath.includes('total_posts.json') 
                || filePath.includes('recent_3.json')
                || filePath.includes('shooting_recent_3.json')
            ) return;

        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            let items = Array.isArray(content) ? content : [content];

            items.forEach(item => {
                if (item.data_url) {
                    item.data_url = item.data_url.replace(/\\/g, '/');
                }
                rawPosts.push(item);
            });
        } catch (err) {
            console.error(`❌ 파싱 에러 (${filePath}):`, err);
        }
    });

    rawPosts.sort((a, b) => {
        const getTimestamp = (dateStr, defaultTime) => {
            if (!dateStr) return 0;
            const [d, t] = dateStr.split(' ');
            const isoStr = `${d.replace(/\./g, '-')}T${t || defaultTime}`;
            const ts = Date.parse(isoStr);
            return isNaN(ts) ? 0 : ts;
        };
        return getTimestamp(b.date, '00:00:00') - getTimestamp(a.date, '00:00:01');
    });

    const uniquePosts = Array.from(new Map(rawPosts.map(p => [p.data_url, p])).values());

    // 전체 머지 포스트
    saveFileIfChanged(TOTAL_OUTPUT, uniquePosts, `전체 포스트 (${uniquePosts.length}개)`);

    // 최신 슈팅 포스트 3개
    const shootingRecent = uniquePosts
        .filter(post => post.category === 'Shooting')
        .slice(0, 3);

    saveFileIfChanged(SHOOTING_RECENT_OUTPUT, shootingRecent, `최신 트러블슈팅 포스트 (${shootingRecent.length}개)`);

    // 최신 포스트 3개 (슈팅 제외)
    const recent = uniquePosts
        .filter(post => post.category !== 'Shooting')
        .slice(0, 3);

    saveFileIfChanged(RECENT_OUTPUT, recent, `최신 포스트 (${recent.length}개)`);
}

// 배치 실행
runBatch();