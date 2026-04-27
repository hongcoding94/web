name: Git-Standard-Check

on:
  pull_request:
    types: [opened, edited, synchronized]
    branches: [main, dev]

permissions:
  contents: read
  pull-requests: read

jobs:
  # 1. 브랜치 전략 검사
  check-branch-name:
    runs-on: ubuntu-latest
    steps:
      - name: Validate Branch Name
        run: |
          BRANCH_NAME="${{ github.head_ref }}"
          REGEX="^(feature|bugfix|hotfix|docs)\/.*"
          
          if [[ ! $BRANCH_NAME =~ $REGEX ]]; then
            echo "❌ [ERROR] 브랜치명이 규칙에 어긋납니다!"
            echo "허용 접두사: feature/, bugfix/, hotfix/, docs/"
            exit 1
          fi

  # 2. 커밋 메시지 품질 검사
  check-commit-message:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Validate Commit Messages
        run: |
          # 추출된 커밋들을 배열로 저장하여 서브쉘 이슈 방지
          BASE_SHA="${{ github.event.pull_request.base.sha }}"
          HEAD_SHA="${{ github.event.pull_request.head.sha }}"
          
          # 커밋 목록 추출 (Merge 커밋 제외를 원하면 --no-merges 추가)
          mapfile -t COMMIT_ARRAY < <(git log --format=%s $BASE_SHA..$HEAD_SHA)
          
          REGEX="^\[(Feat|Fix|Refactor|Remove|Bug)\].*"
          ERROR_COUNT=0

          for msg in "${COMMIT_ARRAY[@]}"; do
            if [[ ! $msg =~ $REGEX ]]; then
              echo "❌ [ERROR] 커밋 메시지 형식 오류: \"$msg\""
              ERROR_COUNT=$((ERROR_COUNT + 1))
            fi
          done

          if [ $ERROR_COUNT -ne 0 ]; then
            echo "총 $ERROR_COUNT 개의 커밋이 표준을 준수하지 않습니다."
            exit 1
          fi
          echo "✅ 모든 커밋 메시지 형식 통과!"

  # 3. PR 제목 검사
  check-pr-title:
    runs-on: ubuntu-latest
    steps:
      - name: Validate PR Title
        run: |
          PR_TITLE="${{ github.event.pull_request.title }}"
          # 예: "[Feat] 기능 구현" 형태인지 검사
          if [[ ! $PR_TITLE =~ ^\[(Feat|Fix|Refactor|Remove|Bug)\].* ]]; then
            echo "❌ [ERROR] PR 제목 형식을 맞춰주세요!"
            exit 1
          fi