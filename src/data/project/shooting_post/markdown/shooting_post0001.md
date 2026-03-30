# Agent Upgrade Query / Excel Table Column‘Add’ or ‘Modify’ Auto DDL

진행 상황: 최종완료
최종 업데이트 시간: 2026년 2월 21일 오후 8:01
개발 상태: 개발 완료
기술 타입: DBMS, Excel
영향도: 中
이슈 여부: 이슈 해결 성공

# 배경

<aside>
💡

클라이언트사들의 Version Upgrade에 따른 Table 中 columns의 추가된 column 혹은 타입, 길이 default value가 변경된 

 **구버전 테이블 명세서와 신버전 테이블 명세를 교차 검증하는 시간을 대폭 줄이면서 빠른 대응**을 위하여 제안하고 개발하여 고객(Client)사에게 제공

</aside>

---

# 분석

- **현재 고객(Client)사로 제공되고 있는 DB 현황**
    
    
    - Oracle
    - Mssql
    
    - Mysql
    - Postgresql
- **클라이언트에서 버전 Upgrade 요청하는 빈도 수**
    - 요청하는 빈도 수의 평균은 고객(Client)사 서비스 서비스 교체 및 특수 기능 추가로 인한 버전 업 요청 주기 최소 2년 1회  혹은 대규모 패치

- **DB 마이그레이션을 하지 않는 선에서 작업이 가능 여부**
    - 특정 버전을 제외한 나머지 버전에서는 마이그레이션을 하지 않고 작업이 가능
    - 기존 데이터 이관 작업으로 인하여 고객(Client)사**에서 DB마이그레이션을 선호하지 않음**

- **Agent Upgrade Query Column Auto Mode의 타당성**
    - 매번 고객(Client)사 마다 테이블 명세서 대조하고 처리하고 하는 소요 시간 축소
    - CS업무 감소 및 그로 인한 타 CS업무 대응이 증진

**개발에 앞서서 어떻게 만들 것인가 구상하는 단계**

- 🤔 이걸 설계 문서라 볼 수 있는가?
    
    아니요, 설계 문서 보다는 SM(운영) 측면에서 CS 업무를 감소 시켜 다른 CS 업무 대응력을 높이는 데 목적이 있습니다. 
    
    글쓴이는 같은 작업을 반복하면서 발생하는 실수를 방지하고, SQL과 Excel 작업을 더 편하게 하고자 이 문서를 만들었습니다.
    

- 🤔 새로운 DBMS에 Upgrade버전을 설치해야 한다면, 어떻게 작업해야 하는가?
    
    새로운 DBMS에 신규 설치하는 경우, 현재 개발 중인 Compare Excel 기능은 불필요하다.
    신규 DBMS에서는 테이블 명세서의 내용이 그대로 새 테이블에 적용되므로 마이그레이션 작업이 필요하지 않다.
    
    현재 DBMS의 기존 테이블에 컬럼을 추가하거나 수정해야 할 경우에만 마이그레이션이 필요하며, 이때 Compare 기능은 필수다.
    

- 🤔 왜 Excel로 관리하려 하는가?
    
    작업 대비 효율성은 크지 않을 수 있지만, 고객(Client)사가 많은 경우 관리 측면에서 빠른 대응이 가능하다.
    
    또한 Excel을 다룰 줄 안다면 개발자가 아니어도 손쉽게 관리할 수 있다.
    

- 🤔 Excel만 필요하다면 개발자 다운 생각으로 작업을 한다면 무엇을 더 구상하면 좋을까?
    
    Excel로 작업 이후 고객(Client)사에게 던지면 DBA 입장에서는 편하다고 하지만,
    
    Add와 Modify에 대한 DDL은 민감한 사항으로 SQL로 크로스 검증을 통한다면, 더욱 좋지 않을까?
    
    만약에 사용을 하려면, 엣지케이스(DBMS 간 데이터 타입 매핑)을 생각을 하면서 만들어야한다.
    
    1. mysql `ColumnType(BLOB)` → postgresSql `ColumnType(?)`       | 글쓴이 생각 `ColumnType(BYTEA)`
    2. postgresSql `ColumnType(BOOLEAN)` →  mysql `ColumnType(?)` | 글쓴이 생각 `ColumnType(TINYINT(1))`
    3. Mysql `ColumnType(BOOLEAN)`  →  postgresSql `ColumnType(?)`| 글쓴이 생각 `ColumnType(TIMESTAMP)`
    
    해당 영역에 규칙은 정리하는데 CaseByCase로 업무 결정권자의 의사를 확인하고 방향성을 정의 해야 한다.
    

- 🤔  SQL로 만들었을 때 DBA의 권한에 위배되지 않을까?
    
    고객(Client)사의 DBA의 부분에 관여를 하는 부분이기 때문에 문제가 될 것이라 생각하는 분들도 있을 것입니다.
    
    당연해요. 실무 개발자라면 당연히 누구나 생각하게 하는 거죠.
    
    우리의 서비스를 제공하는 고객(Client)사에게 보다 좋은 서비스를 제공하기 위해서 고객(Client)사에 심어둔 버전의 스키마 정보를 요청하여
    
    스키마 기준으로 테이블을 DDL을 만들어 locahost 혹은 개발 DB에 적용하여 확인 하여 고객(Client)사에게 반영 관련 공문을 요청합니다.
    

---

# Compare Excel 설명 및 배포

### 고객(client)사의 요청에 의해서 DB Compare Excel 작업 과정

※ 해당 영상은 고객(Client)는 요청 1회 사이클을 주기로 표기하였습니다.

### **Compare Excel 생성 전**

클라이언트의 **요청 사이클이 빈번하게 발생**함에 따라, 해당 업무 처리에 투입되는 시간과 리소스가 예상보다 과도하게 증가하고 있습니다.

이로 인해 다른 중요한 개발 업무의 연속성이 저해되고, **전반적인 운영 효율성 저하**를 초래할 수 있습니다.

[고충.mp4](../img/project/shooting_post0001_007.mp4)

## **Compare Excel 생성 후**

클라이언트의 요청 사이클 주기가 안정적으로 유지되고 있어, 해당 업무 처리에 투입되는 시간과 리소스를 효율적으로 관리할 수 있습니다. 

이 덕분에 다른 중요한 개발 업무의 연속적인 진행이 보장되고 있으며, 전반적인 운영 효율성을 극대화하고 있습니다.

[해결.mp4](../img/project/shooting_post0001_008.mp4)

### Compare Excel 파일 첨부

※ 현재 기능 설명 및 첨부 파일에 들어있는 것은 예시 파일이며, 어떤 기업과도 무관한 데이터임을 밝히며,
     업무 도중 반복된 작업을 방지하고자 개인적으로 집에서 기획한 것임을 사전에 밝히는 바이며, 누구나 만들 수 있는 자료이기 때문에 무료 배포합니다.
     **단, 어떠한 문제가 발생 시 책임은 사용자 본인이 있음을 알고 사용하시길 바랍니다.**


시트 항목 정리

|  | **Sheet Name** | **Sheet Detail** |
| --- | --- | --- |
| **sheet 1** | 표지 | DBMS,테이블 명등 작업 내용을 확인 하기 위한 표지 |
| **sheet 2** | Table For Application | 기준이 되어야 하는 TABLE |
| **sheet 3** | Compare The Table | 비교 되어야 하는 TABLE |
| **sheet 4** | DDL | Sheet3을 비교하여 Sheet2에서 다른점 Alter문 생성(ADD or MODIFY) |
| **sheet 5** | Table Definition | 클라이언트 혹은 상급자에게 어떠한 점이 변경된 테이블 명세서
(내용 비공개 - 첨부파일에도 없음) |
| **sheet 6** | DDL rollback  | 특정 작업이 실패 하였을시 그에 대비한 기존으로 돌아가는 (MODIFY or Delete Column) |

### **각 시트 별 기능 설명**

- **[ Sheet1. 표지 ]**
DBMS : Oracle과 mysql 타입에 맞춘  DDL 생성 역할
테이블명 : DDL문에 들어가야 하는 테이블 명
작성자 : 현재 작성자 명을 대신 실제 기업 관리 용도로 사용하여도 좋다.
             Ex) client L사, 내부 X프로젝트 테이블 변경 등등..
    
    ![image.png](../img/project/shooting_post0001_000.png)
    

- **[ Sheet2. Table For Application ]**
기준이 되는 테이블
    
    ![image.png](../img/project/shooting_post0001_001.png)
    

- **[ Sheet3. Compare The Table ]**
비교 분석이 필요한 테이블
    
    ![image.png](../img/project/shooting_post0001_002.png)
    
- **[ Sheet4. Alter DDL ]**
기준이 되는 테이블을 비교 테이블에 대입 시켜 컬럼 추가 혹은 수정이 필요한 지적을 해주며,
표지에 적용한 DBMS의 타입에 따라 ALTER으로 DDL_TYPE에 따라 ADD문 혹은 MODIFY로 생성합니다.
ADD : (바탕색) 주황색 표기 / MODIFY : (바탕색) 초록색 표기
    
    ![image.png](../img/project/shooting_post0001_003.png)
    

- **[Sheet5. Table Definition]**
클라이언트 혹은 특정 개발에 필요한 스키마 정보에 현재 스키마를 대입하여 얼마나 ALTER문을 사용하고
DBA가 납득할 수 있는 VBA 기능을 사용하여 테이블 명세서를 자동으로 만들어 제공하는 시트입니다. 

**첨부 사진 및 해당 시트는 공개하지 않습니다.**

- **[Sheet6. Rollback DDL]**
작업 도중 고객(Client)사의 DB Column 롤백 요청 시 바로 작업이 가능하도록 처리 할 수 있도록 
자동으로 만들어 제공하는 시트입니다.

**첨부 사진 및 해당 시트는 공개하지 않습니다.**

---

# Compare Query 개발 과정 및 처리 방법

<aside>
💡

**개발자라면…! Excel에 의존 하지 말고 SQL로 작업이 가능하지 않을까?
그래서 SQL작업에 착수 했습니다.**

</aside>

### 고객(client)사의 요청에 의해서 DB Compare Query 작업 과정

※ 해당 영상은 고객(Client)는 요청 1회 사이클을 주기로 표기하였습니다.

## **Compare Query 생성 전**

Compare Excel가 동일 하게 다른 중요한 개발 업무의 연속성이 저해되고, **전반적인 운영 효율성 저하**를 초래할 수 있습니다.

[Query 고충.mp4](../img/project/shooting_post0001_004.mp4)


## **Compare Query 생성 후**

Compare Excel가 동일 하게 다른 중요한 개발 업무의 연속적인 진행이 보장되고 있으며, 전반적인 운영 효율성을 극대화하고 있습니다.

[Query 해결.mp4](../img/project/shooting_post0001_005.mp4)

## DBMS 공부

### DBMS System View(Oracle)

| **뷰 이름** | **접근 범위** | **필요 권한** | **필요 유무** |
| --- | --- | --- | --- |
| **`USER_TAB_COLUMNS`** | **현재 사용자** 소유의 객체(테이블) 정보 | **없음** (`CONNECT` 권한만으로 접근 가능) | ✔ |
| **`ALL_TAB_COLUMNS`** | **현재 사용자**가 접근 가능한 **모든** 객체(소유 객체 + 권한 부여받은 객체) 정보 | **없음** (접근 권한이 있는 경우) | ✔ |
| **`DBA_TAB_COLUMNS`** | **DB 내 모든** 객체 정보 | **`DBA` 권한** (또는 `SELECT ANY DICTIONARY` 권한 등) | ❌ |

### DBMS System View(**Mysql**)

| **뷰 이름** | **접근 범위** | **필요 권한** | **필요 유무** |
| --- | --- | --- | --- |
| `TABLES` | 서버 내 **모든** 데이터베이스 및 테이블 정보 | 없음 | ✔ |
| `COLUMNS` | 서버 내 모든 컬럼 정보 | 없음 | ✔ |

### DBMS System View(**SQL Server**)

| **뷰 이름** | **접근 범위** | **필요 권한** | **필요 유무** |
| --- | --- | --- | --- |
| `sys.tables` | 현재 데이터베이스 내 모든 테이블 정보 | `public` 역할 이상의 권한 (보안상 접근이 허용된 객체만 표시) | ✔ |
| `sys.columns` | 현재 데이터베이스 내 모든 컬럼 정보 | `public` 역할 이상의 권한 | ✔ |
| `INFORMATION_SCHEMA.TABLES` | 현재 데이터베이스 내의 테이블 메타데이터 (SQL 표준) | **없음** (해당 데이터베이스에 접근 권한이 있는 경우) | ❌ |
| `sys.server_principals` | SQL Server 인스턴스 전체의 로그인 정보 | `VIEW ANY DEFINITION` 또는 해당 권한 포함 역할 | ❌ |

### DBMS System View(**PostgreSQL**)

| **뷰 이름** | **접근 범위** | **필요 권한** | **필요 유무** |
| --- | --- | --- | --- |
| `pg_tables` | 현재 데이터베이스 내의 모든 테이블 정보 | **없음** (해당 DB에 접근 권한이 있는 경우) | ✔ |
| `columns` | 현재 데이터베이스 내의 모든 컬럼 정보 (SQL 표준) | **없음** (해당 DB에 접근 권한이 있는 경우) | ✔ |

### **USER_TAB_COLUMNS 내 COLUMN 정보**

| No | **컬럼명** | **데이터 타입** | **설명** | **필요 유무** |
| --- | --- | --- | --- | --- |
| 1 | `TABLE_NAME` | VARCHAR2 | 컬럼이 속한 테이블 이름 | ✔ |
| 2 | `COLUMN_NAME` | VARCHAR2 | 컬럼 이름 | ✔ |
| 3 | `DATA_TYPE` | VARCHAR2 | 컬럼 데이터 타입 | ✔ |
| 4 | `DATA_TYPE_MOD` | VARCHAR2 | 데이터 타입 수식어 | ✔ |
| 5 | `DATA_TYPE_OWNER` | VARCHAR2 | 데이터 타입 소유자 | ❌ |
| 6 | `DATA_LENGTH` | NUMBER | 컬럼 데이터 길이 (BYTE) | ✔ |
| 7 | `DATA_PRECISION` | NUMBER | 숫자 타입(NUMBER) 컬럼의 총 자리 수 | ✔ |
| 8 | `DATA_SCALE` | NUMBER | 숫자 타입(NUMBER) 컬럼의 소수점 자리 수 | ✔ |
| 9 | `NULLABLE` | VARCHAR2 | NULL 허용 여부 | ✔ |
| 10 | `COLUMN_ID` | NUMBER | 테이블 내 컬럼 순서 | ❌ |
| 11 | `DEFAULT_LENGTH` | NUMBER | 컬럼 기본값 길이 | ✔ |

<br/>

| No | **컬럼명** | **데이터 타입** | **설명** | **필요 유무** |
| --- | --- | --- | --- | --- |
| 12 | `DATA_DEFAULT` | LONG | 컬럼 기본값 | ✔ |
| 13 | `NUM_DISTINCT` | NUMBER | 컬럼 내 서로 다른 값 개수 (통계 정보, 옵티마이저 용) | ❌ |
| 14 | `LOW_VALUE` | RAW | 컬럼 최소값 (통계 정보, 옵티마이저 용) | ❌ |
| 15 | `HIGH_VALUE` | RAW | 컬럼 최대값 (통계 정보, 옵티마이저 용) | ❌ |
| 16 | `DENSITY` | NUMBER | 컬럼의 데이터 밀도 (옵티마이저 사용) | ❌ |
| 17 | `NUM_NULLS` | NUMBER | 컬럼 NULL 값 개수 (통계) | ❌ |
| 18 | `CHAR_LENGTH` | NUMBER | CHAR 타입 컬럼 길이 (문자 단위) | ❌ |
| 19 | `CHAR_USED` | VARCHAR2 | CHAR 타입 길이 단위 ('C' = CHAR, 'B' = BYTE) | ❌ |
| 20 | `VIRTUAL_COLUMN` | VARCHAR2 | 가상 컬럼 여부 ('YES'/'NO') | ❌ |
| 21 | `HIDDEN_COLUMN` | VARCHAR2 | 숨겨진 컬럼 여부 ('YES'/'NO') | ❌ |

## DBMS 별 Query Alter(Add/Modify)문 설명

## Oracle 방식

### 기준의 테이블을 가상의 테이블로 생성하는 Query

```sql
-- [ 내부 테이블 임시테이블 생성 로직 ] 현재 업그레이드 할 Version에 테이블 조회하여 가상의 테이블 생성
SELECT CASE WHEN ROW_NUMBER() OVER(ORDER BY COLUMN_NAME) = 1 THEN '' ELSE 'UNION ALL ' END
    || 'SELECT'
    || ' ''' || COLUMN_NAME || ''' AS COLUMN_NAME '
    || ', ''' || TABLE_NAME  || ''' AS TABLE_NAME'
    || ', ''' || UPPER(DATA_TYPE) || ''' AS DATA_TYPE'
    || ', ' || CASE WHEN DATA_PRECISION IS NOT NULL   THEN '''' || DATA_PRECISION || ', ' || DATA_SCALE || '''' || ' AS CHARACTER_MAXIMUM_LENGTH'
                    WHEN DATA_LENGTH IS NOT NOT NULL  THEN '''' || DATA_LENGTH || '''' || ' AS CHARACTER_MAXIMUM_LENGTH'
                    ELSE 'NULL AS CHARACTER_MAXIMUM_LENGTH' 
                     END
    || ', ''' || NULLABLE || ''' AS NULLABLE_DATA '
    || ', ''' || CASE WHEN NULLABLE = 'N' THEN ' NOT NULL' 
                      ELSE '' 
                       END || ''' AS NULLABLE '
    || ' FROM DUAL' AS Version_Agent_schema
  FROM {SCHEMA}.USER_TAB_COLUMNS
 WHERE TABLE_NAME = '{TABLE_NAME}'
```

### 가상의 테이블을 대입하여 고객(Client)사의 Compare를 통해서 Alter(Add / Modify)문 생성

```sql
-- [ 클라이언트사 제공 생성 로직 ] 클라이언트의 테이블과 비교하여 column이 없다면 add column이 있지만 타입과 길이가 맞지 않다면 modify 하는 작업
SELECT CASE WHEN AA.COLUMN_NAME_O IS NULL THEN 'ALTER TABLE ' || AA.TABLE_NAME_N || ' ADD ' || AA.COLUMN_NAME_N || ' ' || AA.DATA_TYPE_N || AA.DATA_LENGTH || AA.DEFAULT_T || AA.NULLABLE_N || ';'
            ELSE 'ALTER TABLE ' || AA.TABLE_NAME_N || ' MODIFY ' || AA.COLUMN_NAME_O || ' ' || AA.DATA_TYPE_N || AA.DATA_LENGTH || AA.DEFAULT_T || ';'
             END AS ALTER_SQL
  FROM (
        SELECT A.COLUMN_NAME 		  AS COLUMN_NAME_N
             , B.COLUMN_NAME 		  AS COLUMN_NAME_O
             , A.TABLE_NAME 		  AS TABLE_NAME_N
             , UPPER(A.DATA_TYPE) AS DATA_TYPE_N
             -- Data Type에 길이가 없는 경우의 케이스를 방지하고자 Case 조건 사용
             , CASE WHEN UPPER(A.DATA_TYPE) = 'DATE' THEN '' 
                    ELSE '(' || COALESCE(A.CHARACTER_MAXIMUM_LENGTH, '') || ')' 
                     END          AS DATA_LENGTH
             , A.NULLABLE         AS NULLABLE_N
             -- 특정 Default Value의 값은 수동으로 정정하기 위한 Case 조건
             , CASE WHEN A.COLUMN_NAME = 'PROCESS_CODE'		        THEN ' DEFAULT ''003'''
                    WHEN A.COLUMN_NAME = 'REGISTER_DATE'				  THEN ' DEFAULT SYSDATE'
                    ELSE '' 
                     END          AS DEFAULT_T
          FROM (
              -- [기준의 테이블을 가상의 테이블로 생성하는 Query]의 가상의 테이블을 입력한다.
              {임시 테이블 입력}	
               ) A
          LEFT OUTER JOIN {SCHEMA}.USER_TAB_COLUMNS B ON B.COLUMN_NAME = A.COLUMN_NAME AND B.TABLE_NAME = '{TABLE_NAME}'
         WHERE B.COLUMN_NAME IS NULL
            OR UPPER(B.DATA_TYPE) != A.DATA_TYPE
            OR TO_CHAR(B.DATA_LENGTH) != A.CHARACTER_MAXIMUM_LENGTH
     ) AA	
```

## MySql 방식

### 기준의 테이블을 가상의 테이블로 생성하는 Query

```sql
SELECT 
  CASE WHEN @rownum := @rownum + 1 = 1 THEN '' ELSE 'UNION ALL ' END AS prefix,
  CONCAT(
    'SELECT ',
    QUOTE(COLUMN_NAME), ' AS COLUMN_NAME, ',
    QUOTE(TABLE_NAME), ' AS TABLE_NAME, ',
    QUOTE(UPPER(DATA_TYPE)), ' AS DATA_TYPE, ',
    CASE 
      WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL THEN CONCAT('\'', CHARACTER_MAXIMUM_LENGTH, '\' AS CHARACTER_MAXIMUM_LENGTH')
      ELSE 'NULL AS CHARACTER_MAXIMUM_LENGTH'
    END, ', ',
    QUOTE(IS_NULLABLE), ' AS NULLABLE_DATA, ',
    QUOTE(CASE WHEN IS_NULLABLE = 'NO' THEN ' NOT NULL' ELSE '' END), ' AS NULLABLE '
  ) AS Version_Agent_schema
FROM INFORMATION_SCHEMA.COLUMNS, (SELECT @rownum := 0) AS r
WHERE TABLE_SCHEMA = '{SCHEMA}' 
  AND TABLE_NAME = '{TABLE_NAME}'
ORDER BY COLUMN_NAME;
```

### 가상의 테이블을 대입하여 고객(Client)사의 Compare를 통해서 Alter(Add / Modify)문 생성

- 메타 테이블: `INFORMATION_SCHEMA.COLUMNS`
- 문자열 연결: `CONCAT()`
- `MODIFY` 문법은 동일 (`ALTER TABLE … MODIFY COLUMN`)
- `DEFAULT NOW()` 등으로 `SYSDATE` 대체

```sql
SELECT CASE WHEN AA.COLUMN_NAME_O IS NULL THEN CONCAT('ALTER TABLE ', AA.TABLE_NAME_N, ' ADD COLUMN ', AA.COLUMN_NAME_N, ' ', AA.DATA_TYPE_N, AA.DATA_LENGTH, AA.DEFAULT_T, AA.NULLABLE_N, ';')
  ELSE CONCAT('ALTER TABLE ', AA.TABLE_NAME_N, ' MODIFY COLUMN ', AA.COLUMN_NAME_O, ' ', AA.DATA_TYPE_N, AA.DATA_LENGTH, AA.DEFAULT_T, ';')
  END AS ALTER_SQL
FROM (
  SELECT A.COLUMN_NAME AS COLUMN_NAME_N,
    B.COLUMN_NAME AS COLUMN_NAME_O,
    A.TABLE_NAME  AS TABLE_NAME_N,
    UPPER(A.DATA_TYPE) AS DATA_TYPE_N,
    CASE WHEN UPPER(A.DATA_TYPE) = 'DATE' THEN ''
         ELSE CONCAT('(', COALESCE(A.CHARACTER_MAXIMUM_LENGTH, ''), ')')
    END AS DATA_LENGTH,
    CASE WHEN A.IS_NULLABLE = 'NO' THEN ' NOT NULL' ELSE '' END AS NULLABLE_N,
    CASE WHEN A.COLUMN_NAME = 'PROCESS_CODE' THEN ' DEFAULT ''003'''
         WHEN A.COLUMN_NAME = 'REGISTER_DATE' THEN ' DEFAULT NOW()'
         ELSE ''
    END AS DEFAULT_T
  FROM (
        {임시 테이블 입력}
       ) A
  LEFT JOIN INFORMATION_SCHEMA.COLUMNS B
    ON B.COLUMN_NAME = A.COLUMN_NAME
   AND B.TABLE_NAME = '{TABLE_NAME}'
   AND B.TABLE_SCHEMA = '{SCHEMA}'
  WHERE B.COLUMN_NAME IS NULL
     OR UPPER(B.DATA_TYPE) != A.DATA_TYPE
     OR B.CHARACTER_MAXIMUM_LENGTH != A.CHARACTER_MAXIMUM_LENGTH
) AA;

```

## SQL-Server 방식

### 기준의 테이블을 가상의 테이블로 생성하는 Query

```sql
SELECT 
    CASE WHEN ROW_NUMBER() OVER(ORDER BY COLUMN_NAME) = 1 THEN '' ELSE 'UNION ALL ' END +
    'SELECT ' +
    '''' + COLUMN_NAME + ''' AS COLUMN_NAME, ' +
    '''' + TABLE_NAME + ''' AS TABLE_NAME, ' +
    '''' + UPPER(DATA_TYPE) + ''' AS DATA_TYPE, ' +
    CASE 
        WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL 
            THEN '''' + CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR) + ''' AS CHARACTER_MAXIMUM_LENGTH'
        ELSE 'NULL AS CHARACTER_MAXIMUM_LENGTH'
    END + ', ' +
    '''' + IS_NULLABLE + ''' AS NULLABLE_DATA, ' +
    '''' + CASE WHEN IS_NULLABLE = 'NO' THEN ' NOT NULL' ELSE '' END + ''' AS NULLABLE'
    AS Version_Agent_schema
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = '{SCHEMA}'
  AND TABLE_NAME = '{TABLE_NAME}'
ORDER BY COLUMN_NAME;

```

### 가상의 테이블을 대입하여 고객(Client)사의 Compare를 통해서 Alter(Add / Modify)문 생성

- 메타 테이블: `INFORMATION_SCHEMA.COLUMNS`
- 문자열 연결: `+`
- `ALTER TABLE … ALTER COLUMN` 사용 (`MODIFY` 대신)
- `GETDATE()`로 `SYSDATE` 대체

```sql
SELECT CASE WHEN AA.COLUMN_NAME_O IS NULL THEN 'ALTER TABLE ' + AA.TABLE_NAME_N + ' ADD ' + AA.COLUMN_NAME_N + ' ' + AA.DATA_TYPE_N + AA.DATA_LENGTH + AA.DEFAULT_T + AA.NULLABLE_N + ';'
  ELSE 'ALTER TABLE ' + AA.TABLE_NAME_N + ' ALTER COLUMN ' + AA.COLUMN_NAME_O + ' ' + AA.DATA_TYPE_N + AA.DATA_LENGTH + AA.DEFAULT_T + ';'
  END AS ALTER_SQL
FROM (
  SELECT A.COLUMN_NAME AS COLUMN_NAME_N,
    B.COLUMN_NAME AS COLUMN_NAME_O,
    A.TABLE_NAME  AS TABLE_NAME_N,
    UPPER(A.DATA_TYPE) AS DATA_TYPE_N,
    CASE WHEN UPPER(A.DATA_TYPE) = 'DATE' THEN ''
         ELSE '(' + COALESCE(CAST(A.CHARACTER_MAXIMUM_LENGTH AS VARCHAR), '') + ')'
    END AS DATA_LENGTH,
    CASE WHEN A.IS_NULLABLE = 'NO' THEN ' NOT NULL' ELSE '' END AS NULLABLE_N,
    CASE WHEN A.COLUMN_NAME = 'PROCESS_CODE' THEN ' DEFAULT ''003'''
         WHEN A.COLUMN_NAME = 'REGISTER_DATE' THEN ' DEFAULT GETDATE()'
         ELSE ''
    END AS DEFAULT_T
  FROM (
        {임시 테이블 입력}
       ) A
  LEFT JOIN INFORMATION_SCHEMA.COLUMNS B
    ON B.COLUMN_NAME = A.COLUMN_NAME
   AND B.TABLE_NAME = '{TABLE_NAME}'
   AND B.TABLE_SCHEMA = '{SCHEMA}'
  WHERE B.COLUMN_NAME IS NULL
     OR UPPER(B.DATA_TYPE) != A.DATA_TYPE
     OR B.CHARACTER_MAXIMUM_LENGTH != A.CHARACTER_MAXIMUM_LENGTH
) AA;
```

## Postgresql 방식

### 기준의 테이블을 가상의 테이블로 생성하는 Query

```sql
SELECT 
  CASE WHEN ROW_NUMBER() OVER(ORDER BY COLUMN_NAME) = 1 THEN '' ELSE 'UNION ALL ' END ||
  'SELECT ' ||
  quote_literal(COLUMN_NAME) || ' AS COLUMN_NAME, ' ||
  quote_literal(TABLE_NAME) || ' AS TABLE_NAME, ' ||
  quote_literal(UPPER(DATA_TYPE)) || ' AS DATA_TYPE, ' ||
  CASE 
      WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL THEN
          quote_literal(CHARACTER_MAXIMUM_LENGTH::text) || ' AS CHARACTER_MAXIMUM_LENGTH'
      ELSE
          'NULL AS CHARACTER_MAXIMUM_LENGTH'
  END || ', ' ||
  quote_literal(IS_NULLABLE) || ' AS NULLABLE_DATA, ' ||
  quote_literal(CASE WHEN IS_NULLABLE = 'NO' THEN ' NOT NULL' ELSE '' END) || ' AS NULLABLE'
  AS Version_Agent_schema
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = '{SCHEMA}'
  AND TABLE_NAME = '{TABLE_NAME}';

```

### 가상의 테이블을 대입하여 고객(Client)사의 Compare를 통해서 Alter(Add / Modify)문 생성

- 메타 테이블: `INFORMATION_SCHEMA.COLUMNS`
- 문자열 연결: `||`
- `ALTER TABLE … ALTER COLUMN … TYPE` 구문 사용
- `DEFAULT now()`로 `SYSDATE` 대체

```sql
SELECT CASE WHEN AA.COLUMN_NAME_O IS NULL THEN 'ALTER TABLE ' || AA.TABLE_NAME_N || ' ADD COLUMN ' || AA.COLUMN_NAME_N || ' ' || AA.DATA_TYPE_N || AA.DATA_LENGTH || AA.DEFAULT_T || AA.NULLABLE_N || ';'
  ELSE 'ALTER TABLE ' || AA.TABLE_NAME_N || ' ALTER COLUMN ' || AA.COLUMN_NAME_O || ' TYPE ' || AA.DATA_TYPE_N || AA.DATA_LENGTH || '; ' ||
    CASE WHEN AA.DEFAULT_T != '' THEN 'ALTER TABLE ' || AA.TABLE_NAME_N || ' ALTER COLUMN ' || AA.COLUMN_NAME_O || AA.DEFAULT_T || ';'
    ELSE '' END
  END AS ALTER_SQL
FROM (
  SELECT A.COLUMN_NAME AS COLUMN_NAME_N,
    B.COLUMN_NAME AS COLUMN_NAME_O,
    A.TABLE_NAME  AS TABLE_NAME_N,
    UPPER(A.DATA_TYPE) AS DATA_TYPE_N,
    CASE WHEN UPPER(A.DATA_TYPE) = 'DATE' THEN ''
         ELSE '(' || COALESCE(A.CHARACTER_MAXIMUM_LENGTH::text, '') || ')'
    END AS DATA_LENGTH,
    CASE WHEN A.IS_NULLABLE = 'NO' THEN ' NOT NULL' ELSE '' END AS NULLABLE_N,
    CASE WHEN A.COLUMN_NAME = 'PROCESS_CODE' THEN ' DEFAULT ''003'''
         WHEN A.COLUMN_NAME = 'REGISTER_DATE' THEN ' DEFAULT now()'
         ELSE ''
    END AS DEFAULT_T
  FROM (
        {임시 테이블 입력}
       ) A
  LEFT JOIN INFORMATION_SCHEMA.COLUMNS B
    ON B.COLUMN_NAME = A.COLUMN_NAME
   AND B.TABLE_NAME = '{TABLE_NAME}'
   AND B.TABLE_SCHEMA = '{SCHEMA}'
  WHERE B.COLUMN_NAME IS NULL
     OR UPPER(B.DATA_TYPE) != A.DATA_TYPE
     OR B.CHARACTER_MAXIMUM_LENGTH != A.CHARACTER_MAXIMUM_LENGTH
) AA;

```

<aside>
💡

**생각을 해보면, DBMS 하나 하나 하는 것 보다….
그냥 ANSI 표준으로 진행하는 것이 좋지 않을까?**

</aside>

## ANSI 표준

ANSI 정보 및 장단점

| **기능** | **ANSI SQL (표준)** | **Oracle** | **SQL Server** | **MySQL** | **PostgreSQL** |
| --- | --- | --- | --- | --- | --- |
| **페이징** | `OFFSET m ROWS FETCH NEXT n ROWS ONLY` | `ROWNUM 또는 FETCH FIRST n ROWS ONLY` | `OFFSET m ROWS FETCH NEXT n ROWS ONLY` | `LIMIT n OFFSET m` | `LIMIT n OFFSET m` |
| **문자열 연결** | `CONCAT(col1, col2)` | `col1 || col2` | `col1 + col2` | `CONCAT(col1, col2)` | `col1 || col2` |
| **자동 증가 키** | `GENERATED ALWAYS AS IDENTITY` | `CREATE SEQUENCE … + NEXTVAL` | `IDENTITY(1,1)` | `AUTO_INCREMENT` | `SERIAL` 또는 `GENERATED AS IDENTITY` |
| **현재 시각** | `CURRENT_TIMESTAMP` | `SYSTIMESTAMP` | `GETDATE()` / `SYSDATETIME()` | `NOW()` | `CURRENT_TIMESTAMP` |
| **상위 N개** | `FETCH FIRST n ROWS ONLY` | `ROWNUM` or `FETCH FIRST n ROWS ONLY` | `TOP (n)` | `LIMIT n` | `LIMIT n` |
| **계층 쿼리** | `WITH RECURSIVE cte …` | `CONNECT BY PRIOR` | `WITH cte AS (…)` | `WITH RECURSIVE …` | `WITH RECURSIVE …` |

### 장단점

   장점

- DBMS에서 작성한 쿼리를 다른 타 DBMS에서 적용하여 사용할 수 있음
- 표준화 된 문법이기 때문에 유지 보수가 용이함
- 일관성 있는 코드 스타일을 유지 할 수 있음

   단점

- 성능 각각의 DBMS의 최적화에 한계가 있음

ANSI 사용의 필요성 여부 체크

- ANSI로 시간 기반한 작업 효율성을 줄일 수 있는가?                                                  ✔
- ANSI로 클라이언트에서 문제가 될 여부가 있는가?                                                    ❌
- ANSI를 수정 필요 시 현재 개발자 말고 타 개발자가 대처 수정이 가능한가?                ✔
- ANSI를 사용했을 때 성능적 문제가 될 수 있는가?                                                      ✔ ( 일회성이기 때문에 크게 문제가 없음 )

서로 다른 DBMS 간에 실제로 수정해야 하는 작업이 다르지 않기 때문에, 굳이 ANSI 표준 쿼리를 사용할 필요가 없다.
물론 이렇게 하면 DBMS별로 비슷한 쿼리를 여러 개 만들어야 하는 번거로움이 있지만, 

각 DB의 특이한 동작(엣지 케이스)을 피할 수 있고, 불필요한 시행착오나 시간을 줄일 수 있습니다.

단,  해당 테이블에 데이터가 대량으로 저장되어 있는 경우, **DDL 수행 시 락(lock)이나 성능 저하가 발생**할 수 있습니다.

따라서 데이터 규모와 운영 환경을 고려하여 변경 시점 및 방식을 신중히 결정해야 합니다.

---

# 고객(client)사의 요청에 의한 DB Compare Excel 작업서 & DB Compare Query 작업 QA 검증

Compare Excel,Query를 작업을 통해서 개발자들이 다른 중요한 개발 업무의 연속적인 진행이 보장되고 있으며, 전반적인 운영 효율성을 극대화할 수 있습니다.

[완결.mp4](../img/project/shooting_post0001_006.mp4)

### 배포 초기 - Excel작업과 DBA가 수행해야 하는 Query를 교차 검증 하는 방법

1. 고객(Client)사에서 제공하는 현재 사용하고 있는 DB Table을 LocalDB에 심기
2. Excel Alter(Add / Modify)문 조회
3. Query Alter(Add / Modify)문 조회
4. Excel Alter(Add / Modify)문과 Query Alter(Add / Modify)문이 개수가 동일한지

### 안정화 기간 이후 - 발송 및 해당되는 Query 전달

1. CS담당자에게 해당 Excel Alter문 사용법 숙지 및 고객(Client)사 요청 시 CS자체적으로 실행
2. 고객(Client)사 DBMS 확인 후 Query Alter(Add / Modify)문 개발자에게 테스트 요청
    
    ※ **업그레이드 버전에 따른 Query가 각각 다름으로 형상관리 필요**
    
3. 개발자가 실행한 Query와 CS담당자가 보유한 Excel의 Alter(Add / Modify)문 개수가 동일한지 확인 후 고객(Client)사에 전달 요청
    
    ※ 고객(Client)사에 지급 시 Excel을 Sheet4. **Alter DDL**, Sheet5. **Table Definition**, Sheet6**. Rollback DDL**과 Alter Query문 전달
    

---

# 효율성 및 관리 지표

## 정합성

> 고객(Client)사에 구 버전 테이블 명세서를 받아 ALTER문 대한 변경 혹은 추가가 누락된 것이 있는 여부 체크 완료 
현재까지 고객(Client)사에 89회 배포 이후  고객(Client)사에게 ALTER문에 대해서 문제 이슈 제기가 없음
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

| 구분 | 계산 | 결과 | 정확성 반영 실효 효율성 | 비즈니스 |
| --- | --- | --- | --- | --- |
| 시간 기반 효율성 | 3 ÷ 0.2 | 15 건 | 15 × 0.97 = **14.55 건** | 직원 한명이 12분 투자로 3건 처리 가능 → 시간당 15건 처리 가능 |
| 비용 기반 효율성 | 3 ÷ 0 | 정의 불가 | ∞ × 0.97 = **∞** | 비용 없이 3건 처리 → 비용 효율 무한대(측정 불가) |
| 자원 기반 효율성 | 3 ÷ 1 | 3 | 3 × 0.97 = **2.91 건** | 서버 1코어로 3건 처리 → 자원 1당 3건 처리 |
| 목표 기반 효율성 | (89 ÷ 100) × 100% | 89% | 89% × 0.97 = **86.33%** | 목표 100건 대비 89건 달성 → 목표 달성률 89% |
| 정확성 | (97 ÷ 100) × 100% | 97% | — | 100건 중 97건 정확 처리 → 업무 품질 반영 |


💡 **GPT** **해석 요약**

- **시간 기반**: 단순 계산 15건 → 정확성 반영 후 14.55건으로 조정
- **비용 기반**: 비용 0 → 무한대, 정확성 반영해도 여전히 ∞
- **자원 기반**: 3건 → 정확성 반영 시 2.91건
- **목표 달성률**: 89% → 정확성 반영 시 86.33%
- **정확성**: 전체 처리에서 오류 없는 비율 97% → 실제 효율 보정에 활용

# 개발 추가 보안점

> 2025.08.10 [ 적용 완료 ] - 일부 Client DBA님의 테이블 명세서와 Client 클라이언트의 테이블 명세서 비교하여 관련 내용 확인 요청
고객(Client)사 스키마를 제공 받아 최신 버전의 스키마와 교차여 DDL 변화가 있는지 확인 할 수 있으며 교차 검증이 가능한 Excel  테이블 명세서 생성

＊ 고객(Client)사 DBA가 요청한 상황으로 이번 고객만 뿐만이 아니라 다른 고객(Client)사의 DBA도 요청 할 가능성이 있어 고객(Client)사의 
     스키마를 공유 받아 바로 처리 할 수 있는 공통 방식으로 적용

2025.09.14 [ 적용 완료 ] - 기존 데이터가 상의 하거나 혹은 Upgrade버전을 사용을 거절하는 고객(Client)사들은 기존의 테이블로 롤백 하기 위한 
스키마 롤백 시나리오 Excel 추가
