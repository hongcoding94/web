# [서비스 대응] 장애 상황 로그 분석 효율 개선

진행 상황: 최종완료
최종 업데이트 시간: 2026년 2월 21일 오후 7:39
개발 상태: 개발 완료
기술 타입: DBMS, Excel, Query
영향도: 中
이슈 여부: 이슈 해결 성공

# 배경

<aside>
💡

클라이언트(Client)사의 메시지 발송 지연 문의가 접수되었으나, 내부 DB 조회만으로는 처리 구간별 소요 시간을 즉시 확인하기 어려운 구조였다.

이에 로그 기반 분석이 필요했으나, 대용량 로그 파일을 직접 확인하는 기존 방식은
원인 규명 및 근거 자료 확보까지 많은 시간이 소요되는 한계가 있었다.

장애 대응 시 근거 확보 지연이 고객 응대 지연으로 이어질 수 있어, 로그 분석 구조 개선을 진행했다.

</aside>

---

# 분석

### 초기 관찰

- 메시지 발송 지연 문의 접수
- 내부 DB 기준으로 처리 구간별 소요 시간 확인 불가
- 로그 파일들의 용량이 커서 직접 열람 시 근거 자료 확보까지 약 2일 소요

> 당시에는 정확한 원인을 바로 파악하기 어려운 상황
> 

### 데이터 기반 검증

- 지연 데이터를 Query로 조회하고, 실행 계획을 검토하여 분석
- 시간대별, 구간별 패턴 확인
    - sampleData Log 생성
        
        <aside>
        💡
        
        Windows PowerShell을 활용하여 테스트용 샘플 로그 데이터를 생성.
        
        실제 장애 환경과 유사하게 **JOB 단위 작업 시간, 대상 건수, 소켓 통신 시간**
        
        등을 랜덤으로 만들어 분석 샘플로 사용
        
        </aside>
        
        [RunSample.shell File](../img/project/shooting_post0005_001.ps1)
        
        ```powershell
        chcp 65001 > $null
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        
        #  =========================
        #  랜덤 시간 생성 (0.009 ~ 3.000)
        #  =========================
        function Get-RandomSeconds {
            $value = Get-Random -Minimum 9 -Maximum 3001
            return ("{0:N3}" -f ($value / 1000))
        }
        
        #  =========================
        #  랜덤 건수 생성
        #  =========================
        function Get-RandomCount {
            return (Get-Random -Minimum 0 -Maximum 201)
        }
        
        #  =========================
        #  작업 종류
        #  =========================
        $jobs = @(
            "SEND_REAL_FILE_IMAGE",
            "SEND_REAL_MESSAGE",
            "SEND_BATCH_MESSAGE",
            "SEND_BATCH_FILE_IMAGE"
        )
        
        #  =========================
        #  출력 파일
        #  =========================
        $out = ".\sample_log_10mb.log"
        "" | Out-File $out -Encoding utf8
        
        #  =========================
        #  JOB 기준 시간/번호
        #  =========================
        $currentTime = Get-Date "14:30:00"
        $jobSeq = 1
        
        function Write-JobLine($time, $seq, $text) {
            $prefix = "{0:HH:mm:ss}[{1:D3}] " -f $time, $seq
            ($prefix + $text) | Out-File -FilePath $out -Append -Encoding utf8
        }
        
        #  =========================
        #  10MB까지 반복
        #  =========================
        while ((Get-Item $out).Length -lt 10MB) {
        
            $jobType   = Get-Random -InputObject $jobs
            $targetCnt = Get-RandomCount
            $selectTime = Get-RandomSeconds
            $fileTime   = Get-RandomSeconds
            $socketTime = Get-RandomSeconds
        
            $totalTime = "{0:N3}" -f (
                [double]$selectTime +
                [double]$fileTime +
                [double]$socketTime
            )
        
            #  JOB 단위 기준값 고정
            $jobTime = $currentTime
            $seq     = $jobSeq
        
            #  Task 단위 fileNo (Task 내부 동일)
            $fileNo = Get-Random -Minimum 100000 -Maximum 999999
        
            #  HashMap 파일 
            $hashMapPath = ".\hashmap.log"
            "" | Out-File -FilePath $hashMapPath -Append -Encoding utf8
        
            #  =========================
            #  메인 로그 기록
            #  =========================
            Write-JobLine $jobTime $seq "# ## $jobType 작업"
            Write-JobLine $jobTime $seq "작업 대상 건수 : $targetCnt"
            Write-JobLine $jobTime $seq "SELECT 시간(초.0f) : $selectTime"
            Write-JobLine $jobTime $seq "FILE 시간(초.0f) : $fileTime"
            Write-JobLine $jobTime $seq "SOCKET 시간(초.0f) : $socketTime"
            Write-JobLine $jobTime $seq "소요시간(초.0f) : $totalTime"
            Write-JobLine $jobTime $seq ""
        
            #  =========================
            #  HashMap 파일 기록
            #  =========================
            $prefix = "{0:HH:mm:ss}[{1:D3}] " -f $jobTime, $seq
        
            ($prefix + "HashMap : -------------------------------------------------------------") | Out-File $hashMapPath -Append -Encoding utf8
            ($prefix + "시퀀스 번호 | 서비스 번호 | 전문파일번호") | Out-File $hashMapPath -Append -Encoding utf8
            ($prefix + "-------------------------------------------------------------") | Out-File $hashMapPath -Append -Encoding utf8
        
            for ($i = 1; $i -le $targetCnt; $i++) {
                $serviceNo = "11111111"
                ($prefix + "$i | $serviceNo | $fileNo") | Out-File $hashMapPath -Append -Encoding utf8
            }
        
            #  =========================
            #  다음 JOB 준비
            #  =========================
            $currentTime = $currentTime.AddSeconds(1)
            $jobSeq++
        }
        
        ```

    | JOB_NAME [ 작업명 ] | TARGET_CNT [ 타겟 개수 ] | TARGET_SEARCH_TIME [ 타겟 검색 소요 시간 ] | CREATE_FILE_TIME [ 전문 생성 소요 시간 ] | SOCKET_TIME [ 소켓 통신 소요 시간 ] | TOTAL_TIME [ 총 소요 시간 ] | BATCH_FILE_NAME [ 전문 파일 명 ] |
    | --- | --- | --- | --- | --- | --- | --- |
    | SEND_REAL_FILE_IMAGE | 10 | 2.322 | 1.550 | 1.498 | 5.370 | 642228 |
    | SEND_REAL_FILE_IMAGE | 162 | 2.377 | 2.098 | 0.695 | 5.170 | 512734 |
    | SEND_REAL_FILE_IMAGE | 173 | 0.707 | 0.980 | 0.202 | 1.889 | 750405 |

- 발송 지연 6분 이상, 통신 지연 1초 이상 건을 Excel로 정리
    
    [샘플 테스트 데이터 추출.xlsx](../img/project/shooting_post0005_002.xlsx)
    
- 패턴 기반으로 로그 집중 분석

> 전체 로그를 보는 방식에서 **지연 데이터 기준 범위 축소** 전략으로 효율 개선
> 

### 가설 설정 및 문제 정의

- 관찰 사항
    - 소켓 통신 구간에서 지연 발생
    - 서버 구조 변경 불가
    - 고객사 서버 영역 개입 불가
- 분석 결과 핵심 병목
    - **로그 분석 구조 자체가 비효율**
    - 문제는 발송 지연 원인뿐 아니라 **분석 구조 효율성 문제**
- 개선 적용 범위
    - **상급자 승인 후 단계적으로 적용 필요**
    - 단독 적용 시 운영 리스크 존재 → 승인 기반 적용으로 안전성 확보

### 구조 개선

- **기존 방식**
    - 파일 기반 로그 열람
    - 수작업 패턴 분석
    - 반복 확인 필요
- **개선 방식**
    - 로그를 DB에 적재
    - 조건 기반 즉시 조회 가능
- **적용 방법**
    - 로그 import → 필드 기준 파싱 → DB 적재
        
        ```sql
        -- 로그 파일 저장 테이블(발송 로그 파일)
        CREATE TABLE LOG_FILE_DATA_SEND (
            LOG_ID 				 				BIGINT AUTO_INCREMENT PRIMARY KEY,
            LINE 					 				VARCHAR(2000)	
        );
        -- 로그 파일 저장 테이블(전문 로그 파일)
        CREATE TABLE LOG_FILE_DATA_BATCH (
            LOG_ID 				 				BIGINT AUTO_INCREMENT PRIMARY KEY,
            LINE 					 				VARCHAR(2000)	
        );
        
        -- 로그 파일을 정제하여 테이블에 데이터 저장 
        CREATE TABLE JOB_RESULT_LOG_20260201 (
            LOG_TASK_TIME			  	 VARCHAR(1000)
            , LOG_TASK_NUM		  	 VARCHAR(1000)
            , JOB_NAME             VARCHAR(1000)
            , TARGET_CNT           INT
            , TARGET_SEARCH_TIME   DECIMAL(10,3)
            , CREATE_FILE_TIME     DECIMAL(10,3)
            , SOCKET_TIME          DECIMAL(10,3)
            , TOTAL_TIME           DECIMAL(10,3)
        );
        
        -- 전문 조회(예제로 생성하였으며, 해당 데이터는 실제 데이터와 상이함을 알려드립니다.)
        CREATE TABLE LOG_FILE_SEND_DATA_20260201 (
            LOG_TASK_TIME			  	VARCHAR(1000)
            , LOG_TASK_NUM		  	VARCHAR(1000)
            , CLIENT_SEQNO				VARCHAR(1000)
            , BATCH_FILE_NAME		  VARCHAR(1000)		
        );
        
        COMMIT;
        
        -- ===================================== --
        
        -- TASK 단위로 분할 추가
        SELECT LOG_ID
             , LINE
             , SUM(
                     CASE WHEN LINE LIKE '%## % 작업'
                     THEN 1 ELSE 0
                   END
                 ) OVER (ORDER BY LOG_ID) AS GRP
          FROM LOG_FILE_DATA_SEND;
        
        -- TASK 번호 추출 및 로그 생성 시간 추출 추가
        SELECT REGEXP_SUBSTR(LINE, '[0-9]{2}:[0-9]{2}:[0-9]{2}') AS LOG_TASK_TIME
             , SUBSTR(REGEXP_SUBSTR(LINE, '\\[([0-9]+)\\]'),2,3) AS LOG_TASK_NUM
             , LOG_ID
             , LINE
             , SUM(
                     CASE WHEN LINE LIKE '%## % 작업'
                     THEN 1 ELSE 0
                   END
                 ) OVER (ORDER BY LOG_ID) AS GRP
          FROM LOG_FILE_DATA_SEND;
        ```
        
    - WITH 절 기반 Query 정제 패턴 적용
        
        ```sql
        -- DB로 추출하기 위한 WITH절 추가 및 DB 테이블에 저장할 데이터 추출(발송 로그 파일)
        -- INSERT INTO JOB_RESULT_LOG_20260201
        WITH DATA_FORMAT AS (
              SELECT REGEXP_SUBSTR(LINE, '[0-9]{2}:[0-9]{2}:[0-9]{2}') AS LOG_TASK_TIME
                 , SUBSTR(REGEXP_SUBSTR(LINE, '\\[([0-9]+)\\]'),2,3) AS LOG_TASK_NUM
                   , LOG_ID
                   , LINE
                   , SUM(
                           CASE WHEN LINE LIKE '%## % 작업'
                         THEN 1 ELSE 0
                         END
                       ) OVER (ORDER BY LOG_ID) AS GRP
                FROM LOG_FILE_DATA_SEND
        )
        SELECT GRP
               , LOG_TASK_TIME
             , LOG_TASK_NUM
             , MAX(CASE WHEN LINE LIKE '%## % 작업' THEN REGEXP_SUBSTR(LINE, '(?<=## ).+(?= 작업)') END) AS JOB_NAME
             , MAX(CASE WHEN LINE LIKE '%작업 대상 건수%' 		THEN CAST(SUBSTRING_INDEX(LINE, ':', -1) AS UNSIGNED) END) AS TARGET_CNT
             , MAX(CASE WHEN LINE LIKE '%SELECT 시간(초.0F)%' THEN CAST(SUBSTRING_INDEX(LINE, ':', -1) AS DECIMAL(10,3)) END) AS TARGET_SEARCH_TIME
             , MAX(CASE WHEN LINE LIKE '%FILE 시간(초.0F)%' 	THEN CAST(SUBSTRING_INDEX(LINE, ':', -1) AS DECIMAL(10,3)) END) AS CREATE_FILE_TIME
             , MAX(CASE WHEN LINE LIKE '%SOCKET 시간(초.0F)%' THEN CAST(SUBSTRING_INDEX(LINE, ':', -1) AS DECIMAL(10,3)) END) AS SOCKET_TIME
             , MAX(CASE WHEN LINE LIKE '%소요시간(초.0F)%' 		THEN CAST(SUBSTRING_INDEX(LINE, ':', -1) AS DECIMAL(10,3)) END) AS TOTAL_TIME
          FROM DATA_FORMAT
         GROUP BY GRP, LOG_TASK_TIME, LOG_TASK_NUM;
        
        -- DB로 추출하기 위한 WITH절 추가 및 DB 테이블에 저장할 데이터 추출(전문 로그 파일)
        -- INSERT INTO LOG_FILE_SEND_DATA_20260201
        WITH DATA_FORMAT AS (
              SELECT REGEXP_SUBSTR(LINE, '[0-9]{2}:[0-9]{2}:[0-9]{2}') AS LOG_TASK_TIME
                 , SUBSTR(REGEXP_SUBSTR(LINE, '\\[([0-9]+)\\]'),2,3) AS LOG_TASK_NUM
                 , TRIM( SUBSTRING_INDEX( SUBSTRING_INDEX(SUBSTRING_INDEX(LINE, ']', -1), '|', 2), '|', -1) ) AS SERVICE_NO
                   , CASE WHEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(LINE, ']', -1), '|', 1)) REGEXP '^[0-9]+$' THEN TRIM(SUBSTRING_INDEX(LINE, '|', -1)) END AS BATCH_FILE_NAME
                   , LOG_ID
                   , LINE
                   , SUM(
                           CASE WHEN LINE = '%|'
                           THEN 1 ELSE 0
                         END
                       ) OVER (ORDER BY LOG_ID) AS GRP
               FROM LOG_FILE_DATA_BATCH
        )
        SELECT LOG_TASK_TIME
               , LOG_TASK_NUM
               , SERVICE_NO
               , BATCH_FILE_NAME
          FROM DATA_FORMAT
         WHERE LOG_TASK_TIME IS NOT NULL AND LOG_TASK_NUM IS NOT NULL AND BATCH_FILE_NAME IS NOT NULL
         GROUP BY GRP, LOG_TASK_TIME, LOG_TASK_NUM, SERVICE_NO, BATCH_FILE_NAME;
        ```
        
    - 애플리케이션 로직 수정 없이 데이터 정제 책임을 Query로 이동
        
        ```sql
        -- SELECT 통합시간 소요시간 분석 및 전문 파일명 추적
        SELECT A.LOG_TASK_TIME
             , A.LOG_TASK_NUM
             , A.JOB_NAME
             , A.TARGET_CNT
             , A.TARGET_SEARCH_TIME
             , A.CREATE_FILE_TIME
             , A.SOCKET_TIME
             , A.TOTAL_TIME
             , B.BATCH_FILE_NAME
          FROM JOB_RESULT_LOG_20260201 A
             , LOG_FILE_SEND_DATA_20260201 B
         WHERE A.LOG_TASK_NUM = B.LOG_TASK_NUM 
           AND A.LOG_TASK_TIME = B.LOG_TASK_TIME 
           AND A.JOB_NAME = 'SEND_REAL_FILE_IMAGE'
           AND A.TARGET_CNT <= 200
           AND A.TOTAL_TIME > 1;
        ```
        

### 성능 개선

서버 구조는 정책상 권한 외 변경 불가, 따라서 Query 튜닝으로 접근했다.

- 문제 확인
    - 날짜 조건 컬럼에 인덱스가 적용되지 않아 전체 테이블 스캔 발생 → 조건식을 변경하여 인덱스 활용 가능
    - 불필요한 조건과 정렬 구조 존재
- 조치
    - 조건 날짜 처리 방식 수정 → INDEX 사용 가능
    - 불필요 조건 제거, 정렬 구조 재구성
- 결과
    - 동일 테스트 구간 기준 처리량 170건 → 190건 수준 개선

---

# 결론

- 로그 분석 구조를 파일 기반에서 DB 기반으로 변경
- 근거 자료 확보 시간 2일 → 1일로 단축
- 서버 변경 없이 처리량 개선
- Query 기반 데이터 정제 구조 적용
- 승인 절차 거쳐 안정적으로 반영

장애 대응 시 분석 속도와 안정성을 모두 확보하였다.

---

# 효율성 및 관리 지표

## 정합성

> 로그 데이터 원본과 Query 정제 결과 간 교차 검증을 수행하여 정합성을 확인하였다.
> 

## 효율성

> 효율성의 공식은 개발 이후 6개월 동안 시범 운영에 반영한 데이터를 토대로 공식을 구했으며,
사람 손수 계산하는 작업을 통해서 오차 범위가 발생하기 때문에 오차 범위를 줄이고자 
ChatGPT를 통해서 정확한 결과 값을 추출하였습니다.
> 

### 효율성 공식

| 구분 | 계산 방식 |
| --- | --- |
| 시간 기반 효율성 | 업무 처리 시간 대비 완료 건수
`효율성 = (완료된 작업 수[산출량] ÷ 총 소요 시간)` |
| 비용 기반 효율성 | 산출물 1단위당 비용
`효율성 = (총 Output[산출량] ÷ 총 비용)` |
| 자원 기반 효율성 | CPU, 메모리 사용량 대비 처리량
`효율성 = (처리량[산출량] ÷ 자원 사용량)` |
| 목표 기반 효율성 | 실제 성과 / 목표 성과
`효율성 = (실제 달성 값 ÷ 목표 값) × 100%` |
| **정확성** | 비즈니스 품질
`정확성 = (정답/정확결과 수 ÷ 전체 결과 수 ) × 100%` |

<br/>

| 구분 | 계산 | 결과 | 정확성 반영 실효 효율성 | 비즈니스 |
| --- | --- | --- | --- | --- |
| 시간 기반 효율성 | 2일 → 1일 | 100% 개선 | 동일 | 장애 대응 시간 단축 |
| 비용 기반 효율성 | 인력 동일 | 유지 | 동일 | 추가 비용 없음 |
| 자원 기반 효율성 | DB 조회 기반 | 향상 | 동일 | 즉시 분석 가능 |
| 목표 기반 효율성 | 1일 내 근거 확보 목표 | 달성 | 100% | SLA 대응 안정화 |
| 정확성 | 로그 교차 검증 | 100% |  | 근거 신뢰도 확보 |

💡 **GPT** **해석 요약**

- 근거 확보 시간 50% 단축, Query 튜닝으로 처리량 향상, 비용 증가 없이 효율성 개선
- 운영 리스크 통제 및 승인 기반 적용
- 비용 증가 없이 효율성 개선 달성

# 개발 추가 보안점

> 현재까지 존재하지 않음
> 

## 참고 자료 및 기타 내용