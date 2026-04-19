const fs = require('fs');
const path = require('path');

const DATA_ROOT = path.join(__dirname, 'src', 'data');
const TOTAL_OUTPUT = path.join(DATA_ROOT, 'total_posts.json');
const RECENT_OUTPUT = path.join(DATA_ROOT, 'recent_3.json');
const EXCLUDE_FILES = ['total_posts.json', 'recent_3.json'];

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            // List.json 파일만 읽기
            if (file.toLowerCase() === 'list.json') {
                arrayOfFiles.push(fullPath);
                console.log(`🔍 발견된 리스트 : ${fullPath}`);
            }
        }
    });
    return arrayOfFiles;
}

function runBatch() {
    console.log("🚀 포스트 리스트 병합 시작");

    if (!fs.existsSync(DATA_ROOT)) {
        fs.mkdirSync(DATA_ROOT, { recursive: true });
        console.log(`📁 폴더가 없어서 생성 : ${DATA_ROOT}`);
    }

    const allJsonFiles = getAllFiles(DATA_ROOT);
    let allPosts = [];

    allJsonFiles.forEach(filePath => {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            let posts = JSON.parse(fileContent);

            if (!Array.isArray(posts)) posts = [posts];

            const correctedPosts = posts.map(post => {
                if (post.data_url) {
                    // 기존의 잘못된 방식: "./src/data" + ...
                    // 수정된 방식: 호출부 기준에 맞춰 "../data"로 경로 시작점 변경
                    
                    // 1. 현재 파일의 위치를 기준으로 하지 않고, JSON 데이터 내의 경로만 추출
                    const rawPath = post.data_url; // 예: "git_post/git_post0001.md"
                    
                    // 2. list.json이 위치한 폴더명 추출
                    const listFolder = path.dirname(filePath.split(path.join('src', 'data'))[1]); 

                    // 3. 최종 경로 조립 (상위 폴더 참조 방식 적용)
                    const finalPath = path.join('../', listFolder, rawPath)
                                        .replace(/\\/g, '/'); // 윈도우 역슬래시 치환
                    
                    post.data_url = finalPath; 
                }
                return post;
            });

            allPosts = allPosts.concat(correctedPosts);
        } catch (err) {
            console.error(`❌ 파일 처리 실패 (${filePath}):`, err);
        }
    });

    allPosts.sort((a, b) => {
        const dateA = new Date((a.date || '1970.01.01').replace(/\./g, '-'));
        const dateB = new Date((b.date || '1970.01.01').replace(/\./g, '-'));
        return dateB - dateA;
    });

    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.id || p.data_url, p])).values());

    try {
        fs.writeFileSync(TOTAL_OUTPUT, JSON.stringify(allPosts, null, 2), 'utf-8');
        fs.writeFileSync(RECENT_OUTPUT, JSON.stringify(allPosts.slice(0, 3), null, 2), 'utf-8');
        
        console.log("✅ 배치 완료!");
        console.log(`   - 총 포스트 수: ${allPosts.length}개`);
        console.log(`   - 최신글(3개) 파일 생성 완료: ${RECENT_OUTPUT}`);
    } catch (err) {
        console.error("❌ 파일 쓰기 실패 : ", err);
    }
}

runBatch();