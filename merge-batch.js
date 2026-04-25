const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_ROOT = path.join(__dirname, 'src', 'data');
const TOTAL_OUTPUT = path.join(DATA_ROOT, 'total_posts.json');
const RECENT_OUTPUT = path.join(DATA_ROOT, 'recent_3.json');

function getHash(data) {
    const sortedData = JSON.parse(JSON.stringify(data, Object.keys(data).sort()));
    return crypto.createHash('md5').update(JSON.stringify(sortedData)).digest('hex');
}

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else if (file.toLowerCase() === 'list.json') {
            arrayOfFiles.push(fullPath);
            console.log(`🔍 발견된 리스트 : ${fullPath}`);
        }
    });
    return arrayOfFiles;
}

function runBatch() {
    console.log("[merge_bot] 봇: 포스트 리스트 병합 및 인덱싱을 시작합니다...");

    if (!fs.existsSync(DATA_ROOT)) {
        fs.mkdirSync(DATA_ROOT, { recursive: true });
        console.log(`📁 폴더가 없어서 생성 : ${DATA_ROOT}`);
    }

    const allJsonFiles = getAllFiles(DATA_ROOT);
    let allPosts = [];

    allJsonFiles.forEach(filePath => {
        if (filePath.includes('total_posts.json') || filePath.includes('recent_3.json')) return;

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            let posts = JSON.parse(fileContent);
            if (!Array.isArray(posts)) posts = [posts];

            posts.forEach(post => {
                if (post.category === 'Shooting') return;
                if (post.data_url) {
                    const rawPath = post.data_url;
                    const listFolder = path.dirname(filePath.split(path.join('src', 'data'))[1]); 
                    const finalPath = path.join(rawPath).replace(/\\/g, '/');
                    
                    post.data_url = finalPath; 
                }
                allPosts.push(post);
            });
        } catch (err) {
            console.error(`[merge_bot] 봇 에러❌ (데이터 파싱 실패): ${filePath}`, err);
        }
    });

    allPosts.sort((a, b) => {
        const getTimestamp = (dateStr, defaultTime) => {
            if (!dateStr) return 0;
            
            const [d, t] = dateStr.split(' ');
            const isoStr = `${d.replace(/\./g, '-')}T${t || defaultTime}`;
            const ts = Date.parse(isoStr);
            
            return isNaN(ts) ? 0 : ts;
        };

        const timeA = getTimestamp(a.date, '00:00:01');
        const timeB = getTimestamp(b.date, '00:00:00');

        return timeB - timeA;
    });

    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.data_url, p])).values());

    let isChanged = true;
    if (fs.existsSync(TOTAL_OUTPUT)) {
        try {
            const oldContent = JSON.parse(fs.readFileSync(TOTAL_OUTPUT, 'utf-8'));
            const oldHash = getHash(oldContent);
            const newHash = getHash(uniquePosts);

            if (oldHash === newHash) {
                isChanged = false;
            }
        } catch (e) {
            isChanged = true;
        }
    }

    if (!isChanged) {
        console.log("✨ [No Change] 모든 데이터가 최신 상태입니다. 배포 파이프라인을 건너뜁니다.");
        return;
    }

    try {
        fs.writeFileSync(TOTAL_OUTPUT, JSON.stringify(uniquePosts, null, 2), 'utf-8');
        fs.writeFileSync(RECENT_OUTPUT, JSON.stringify(uniquePosts.slice(0, 3), null, 2), 'utf-8');
        
        console.log("✅ 배치 완료!");
        console.log(`   - 총 포스트 수: ${uniquePosts.length}개 (Shooting 제외)`);
    } catch (err) {
        console.error("[merge_bot] 봇 에러❌ (파일 쓰기 실패):", err);
    }
}

runBatch();