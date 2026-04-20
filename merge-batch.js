const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_ROOT = path.join(__dirname, 'src', 'data');
const TOTAL_OUTPUT = path.join(DATA_ROOT, 'total_posts.json');
const RECENT_OUTPUT = path.join(DATA_ROOT, 'recent_3.json');

function getHash(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
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

            const correctedPosts = posts.map(post => {
                if (post.data_url) {
                    const rawPath = post.data_url;
                    const listFolder = path.dirname(filePath.split(path.join('src', 'data'))[1]); 
                    const finalPath = path.join(rawPath).replace(/\\/g, '/');
                    
                    post.data_url = finalPath; 
                }
                return post;
            });
            allPosts = allPosts.concat(correctedPosts);
        } catch (err) {
            console.error(`[merge_bot] 봇 에러❌ (데이터 파싱 실패): ${filePath}`, err);
        }
    });

    allPosts.sort((a, b) => {
        const [dateA, timeA] = (a.date || '1970.01.01').split(' ');
        const [dateB, timeB] = (b.date || '1970.01.01').split(' ');

        const normDateA = dateA.replace(/\./g, '-').trim();
        const normDateB = dateB.replace(/\./g, '-').trim();
        
        const normTimeA = timeA ? timeA : '23:59:59'; 
        const normTimeB = timeB ? timeB : '23:59:59';

        const finalDateA = new Date(`${normDateA}T${normTimeA}`);
        const finalDateB = new Date(`${normDateB}T${normTimeB}`);

        const timeAStamp = isNaN(finalDateA.getTime()) ? 0 : finalDateA.getTime();
        const timeBStamp = isNaN(finalDateB.getTime()) ? 0 : finalDateB.getTime();

        return timeBStamp - timeAStamp;
    });

    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.id || p.data_url, p])).values());

    let isChanged = true;
    if (fs.existsSync(TOTAL_OUTPUT)) {
        const oldContent = fs.readFileSync(TOTAL_OUTPUT, 'utf-8');
        const oldHash = getHash(JSON.parse(oldContent));
        const newHash = getHash(uniquePosts);

        if (oldHash === newHash) {
            isChanged = false;
        }
    }

    if (!isChanged) {
        console.log("✨ [No Change] 모든 데이터가 최신 상태입니다. 배포 파이프라인을 건너뜁니다.");
        return;
    }

    try {
        fs.writeFileSync(TOTAL_OUTPUT, JSON.stringify(allPosts, null, 2), 'utf-8');
        fs.writeFileSync(RECENT_OUTPUT, JSON.stringify(allPosts.slice(0, 3), null, 2), 'utf-8');
        
		console.log("✅ 배치 완료!");
		console.log("🚀 [Deployed] 새로운 포스트가 감지되어 성공적으로 병합되었습니다!");
        console.log(`   - 총 포스트 수: ${allPosts.length}개`);
		console.log(`   - 최신글(3개) 파일 생성 완료: ${RECENT_OUTPUT}`);
    } catch (err) {
        console.error("[merge_bot] 봇 에러❌ (파일 쓰기 실패):", err);
    }
}

runBatch();