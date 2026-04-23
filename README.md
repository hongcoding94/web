# Git.io - web개발

## tiles 영역별 function 역할
※ 수정 중에 변동사항이 생길수 있습니다.
	
### tiles영역 
```PwoerShell
	.. tiles영역 이외 내용 생략
	|
	+---pages
	|   experience.html
	|   index.html
	|   main.html
	| 
	+---components
	|   list.html
	| 
	\---tiles
		content.html
		footer.html
		header.html
		sidebar.html
```
	
### tiles 사용자 영역별 소개
1) **공통 영역**
	- TosatPopup / modalPopup 지원

2) **메인 영역**
	- 사용자 지원 기능 없음

3) **header 영역**
	- 화이트모드 / 다크모드 on/off Toggle
	- [Mobile 용] sidebar open/close Toggle 

4) **side 영역**
	- 사용자 지원 기능 없음

5) **content 영역**
	- 코드 Copy 버튼 모드
	- [Web 용] content 영역별 목차 현황

6) **footer 영역**
	- 일정이상 스크롤 다운시 최상단 Top Toggle

<hr/>

## git 컨벤션 & 수정 이력
| 타입 명 | 기능 추가 | 기능 수정 | 삭제 | 리팩토링 | 버그 수정 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **타입 코드** | **Feat** | **Fix** | **Remove** | **Refactor** | **Bug** |

| **타입**|**수정일자**|**수정내역**|
| :---: | :---: | --- |
| Feat | 2026.03 13  | - 페이지 구성 |
| Feat  | 2026.03.16  | - 페이지 간 이동<br/> - 메인 페이지 구성  |
| Feat  | 2026.03.17  | - Sidebar 구성<br/> - Sidebar Depth 구성 function 추가<br/> - header 메인페이지 이동처리  |
| Feat | 2026.03.18 | - Top버튼 추가<br/> - markdown "```"를 div 코드화면으로 변경 <br/>- sideBar 프로필사진 추가<br/> - header icon추가  |
| Feat | 2026.03.19 | - 코드화면 라인추가<br/> - content 리스트페이지 구성 |
| Feat | 2026.03.20 | -메인 페이지 일부 내용 추가 |
| Fix | 2026.03.21 | - Sidebar 정적에서 동적으로 수정<br/>- tiles function 호출 구간 전체 수정<br/> - content 모바일 영역 수정 |
| Feat | 2026.03.23 | - 이전페이지 히스토리 function 생성<br/> - list페이지 정적에서 동적으로 수정<br/>- JsonData 추가 |
| Feat | 2026.03.24 | - markdown에서 html변환작업 처리<br/> - 메인화면 css  추가 |
| Fix | 2026.03.26 | - 전반적인 css 수정 |
| Feat |2026.04.17 | - meta 데이터(카카오.페이스북.트위터등..) 추가<br/> - tiles 랜더링 시 히스토리 기능 오류 페이지 수정 |
| Feat | 2026.04.19 | - 머지봇을 모든 게시물 리스트 병합 처리 및 최근 3개의 게시물 자동 처리<br/> - 메인 페이지 최근 게시물 노출섹션 추가 |
| Fix | 2026.04.20 | - 머지 봇의 정상 유무 파악을 위한 로그 추가<br> - 프로젝트수행이력 페이지 추가 |
| Fix<br/> Remove<br/> Feat  | 2026.04.21 | - 프로젝트 수행이력 기여도 퍼센테이지 추가 및 css 수정<br/> - 메인 페이지 프로젝트 수행이력 섹션 제거<br> - 메인 페이지 트러블슈팅 인기글 섹션 3개 노출 추가 |
| Fix<br/>Feat | 2026.04.22 | - Git Actions Node ver.18 -> 24 업데이트 권장으로 수정<br/> - 머지봇 동시 실행 방지설정 추가<br/> - 메인.js 중복 코드 병합<br/> - modalPopup, toastPopup 기능 추가 |


## 디렉토리 구조

```PowerShell
|   .gitignore
|   index.html
|   merge-batch.js
|   README.md
|   
+---.github
|   \---workflows
|           merge-json.yml
|           
+---.vscode
|       settings.json
|       
+---assets
|       preview.png
|       
\---src
    +---css
    |   +---components
    |   |       
    |   +---layout
    |   |       
    |   \---list
    |           
    +---data
    |   |   recent_3.json
    |   |   total_posts.json
    |   |   
    |   +---backend
    |   |           
    |   +---chapter
    |   |       
    |   +---dbms
    |   |           
    |   +---frontend
    |   |           
    |   +---git
    |   |           
    |   \---project
    |                  
    +---img
    |           
    +---js
    |   \---common
    |       +---layout
    |       |       
    |       +---list
    |       |       
    |       \---tiles
    |               
    +---pages
    |   |   experience.html
    |   |   index.html
    |   |   main.html
    |   |   
    |   +---components
    |   |       list.html
    |   |       
    |   \---tiles
    |           content.html
    |           footer.html
    |           header.html
    |           sidebar.html
    |           
    \---test
            tableType.html
```
	
<hr/>







