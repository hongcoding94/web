# [Quartz Scheduler 上] Agent Service Memory Issue

진행 상황: 최종완료
최종 업데이트 시간: 2026년 2월 21일 오후 7:29
개발 상태: 보고 완료
기술 타입: Issu 분석, OS, Quartz, Shell
영향도: 上
이슈 여부: 이슈 해결 성공

# 배경

<aside>
💡

Agent Service를 진행하면서 현재까지 Quartz Scheduler가 제 기능을 하지 못하는 근본적이 이유를 생각해보면 메모리(GC Heap Memory) 누수로 인한 특정 시간 때에 Quartz Scheduler가 제 기능을 못하는 것이 생각되어 해당 Heap 로그를 통한 원인을 파악하기 위해서 시작하였습니다.

</aside>

## GC Heap Memory와 Quartz에 대해서 알고가자.

### GC Heap Memory란?

<aside>
💡

GC Heap이 차지하고 있는 “메모리 사용량” 또는 “리소스 관점”이다.

</aside>

GC Heap은 **JVM에 할당된 메모리의 구조적 영역**을 의미하며, GC Heap Memory는 **그 영역 중 실제로 사용되고 있는 메모리 사용량,** 즉 현재 점유된 자원을 의미한다.

이를 조금 더 정리해보면, GC Heap은 **구조적 관점**, GC Heap Memory는 **리소스 관점**에서 바라본 개념으로 이해할 수 있다.

다만 구조적 관점과 리소스 관점이라는 표현 만으로는 다소 추상적으로 느껴질 수 있기 때문에

아래 그림을 통해 GC Heap 구조는 동일하게 유지된 상태에서 GC Heap Memory 사용량이 시간 흐름에 따라 어떻게 변하는 지를 살펴보고자 한다.

※ 예시는 **Quartz Scheduler 실행 과정에서 발생하는 GC Heap Memory 사용 변화를 기준**으로 설명하고자 한다.

[Quartz Scheduler 실행 과정에서 발생하는 GC Heap Memory 사용 변화](../img/project/shooting_post0003_020.mp4)
Quartz Scheduler 실행 과정에서 발생하는 GC Heap Memory 사용 변화

### Quartz는 무엇인가?

<aside>
💡

Quartz는 단순히 “정해진 시간에 Job을 실행하는 라이브러리”가 아니라, **”시간 관리, 스레드 관리, 상태 저장을 분리한 구조를 가진 스케줄링 엔진”**이다.

</aside>

**Quartz의 내부 핵심 역할**  
<!-- two-column:start -->
<!-- left -->

Quartz는 크게 보면 4가지 핵심 컴포넌트로 구성 <br/>
※ 각각의 역할을 알아보자

![아키텍처 전체 구조](../img/project/shooting_post0003_019.png)

<!-- right -->

**Scheduler [ 중앙 제어자 ]**  
- `- Trigger의 이벤트 실행 조건이 충족되었는지 확인`  
- `- 실행 시점이 된 job 실행`  
- `- ThreadPool에게 실행 요청`  
- `- JobSotre와 상태 동기화`  

**TreadPool [ 실행 리소스 관리자 ]**  
- `- job 실행을 위한 Thread 제공`  
- `- 동시에 실행 job의 개수 제한`  

**Trigger [ 시간 관리자 ]**  
- `- Cron / Simple / Calendar 기반 시간 계산`  
- `- 다음 실행 시점 계산`  
- `- misfire 여부 판단`  

**JobStore [ 상태 저장소 ]**  
- `- job / Trigger의 상태 저장`  
- `- 다음 실행 시점을 계산`  
- `- Scheduler가 참조할 기준(job / Trigger) 상태 제공`  
<!-- two-column:end -->

- Quartz의 핵심 컴포넌트 정리
    
    <aside>
    💡 Quartz를 이렇게 생각하자 **“시간(Trigger), 판단(Scheduler), 기억(jobStore), 실행(ThreadPool)”** 으로 기억을 한다면, Quartz를 바라보는 시야를 정확히 알수 있다.
    </aside>
    
    - Trigger - 시간
        
        > 언제 실행할지 사용자의 정의에 따른 처리 역할
        
        **역할**
        
        - 실행 시점 계산
        - 주기 관리
        - misfire 판단
        
        **특징**
        
        - Job 로직과 완전히 분리됨
        - 실행 여부에는 관여하지 않음
        - “지금 실행 여부 Yes or No”만 판단
        
    - Scheduler - 판단
        
        > Quartz의 중앙 조정 역할
        > 
        
        **역할**
        
        - Trigger 상태 확인
        - 실행 가능 여부 판단
        - ThreadPool에 실행 요청
        - JobStore 상태 갱신 지시
        
        **특징**
        
        - Job을 직접 실행하지 않음
        - 리소스를 직접 소비하지 않음
        - 지속적으로 Trigger상태를 확인
        
jobStore - 기억
<!-- two-column:start -->
<!-- left -->
> Quartz의 상태 저장소이자 판단하는 두뇌 역할  

**역할**

- Job / Trigger 정보 저장
- 실행 상태 관리
- 다음 실행 시점 기록

**타입별 특징**

**RAMJobStore**

> Quartz의 모든 상태를 JVM Heap 메모리에만 저장하는 JobStore  

![image.png](../img/project/shooting_post0003_001.png)

- JVM Heap메모리 사용
- 상태를 메모리에만 저장
- 트랜잭션 개념 아님
- 단일 인스턴스 전용

<!-- right -->
**JDBCJobStore**

- 상태를 DB테이블에 저장
- 동시성 / 정합성 필요
- 트랜잭션 필수

**JobStoreTX**

> Quartz가 직접 트랜잭션을 관리  

![image.png](../img/project/shooting_post0003_002.png)

- Quartz가 DB Connection 획득
- Commit / rollback 직접 수행
- Sprinf 트랜잭션과 분리

**JobStoreCMT**

> 컨테이너가 관리  

![image.png](../img/project/shooting_post0003_003.png)

- Commit / rollback 안함
- 현재 활성화된 트랜잭션에 참여만 함

<!-- two-column:end -->

    - ThreadPool - 실행
        
        > 실제 Job을 실행하는 리소스 풀  
        
        **역할**
        
        - Job을 실행용 스레드 관리
        - 동시 실행 개수 제한
        - 스레드 재사용
        
        **특징**
        
        - Quartz의 실질적인 병목 지점
        - 스레드 부족 시 Job실행 지연
        - Schedulr 판단과 분리됨
        
    - Job & JobDetail - 실제 로직
        
        > 실행 대상이 되는 비즈니스 로직  
        
        **역할**
        
        - 실제 작업 수행
        - CPU, Heap, IO 사용
        
        **특징**
        
        - Quartz는 Job 내부를 알지 못함
        - 무거운 작업, 무한 루프 여부를 판단하지 않음
        - Job의 품질이 전체 스케줄 안정성에 직접 영향.

### Quartz Flow 흐름도

![JavaCodeGeeks - **Quartz Architectural Diagram**](../img/project/shooting_post0003_004.png)

JavaCodeGeeks - **Quartz Architectural Diagram**

![Java Articles 블로그 참조(Quartz 아키텍처 flow)](../img/project/shooting_post0003_005.png)

Java Articles 블로그 참조(Quartz 아키텍처 flow)

## JDBCJobStore에 따른 DBMS 별 호환과 이슈

<aside>
💡

공통 전제의 가정으로 JDBCJobSotre에서 호환성과

- Quartz가 Job / Trigger / Lock 정보를 DB에 영속화
- 클러스터링 필수 전제
- DB 특성에 따라
    - Lock 방식
    - Isolation Level
    - Deadlock 빈도
    - SQL Dialect 차이가 크게 달라짐

※ Quartz JDBCJobStore에서 중요한 흐름을 파악하는 중요하다.

</aside>

**Quartz JDBCJobStore에서 중요한 흐름 이해**

※ 각각의 DBMS를 이해하기 위해서는 해당 Quartz 클러스터 이해한다면 DB 이슈에 대한 흐름을 이해 할 수 있다. 

1. Scheduler 인스턴스가 기동
2. Trigger 획득 시도 
    - `QRTZ_LOCKS` `QRTZ_TRIGGERS` `QRTZZ_FIRED_TRIGGERS` 테이블에 동시 접근
3. 여러 노드(Job)가 같은 Trigger를 잡기 않기 위해서 DB Lock으로 동기화

해당 추가적인 부연 설명이 필요함

**Quartz JDBCJobSotre를 적용한 DBMS별 호환성과 안정성**

<aside>
💡

각각의 DBMS별 호환성과 안정성 상태는 아래와 같이 규정하며, 그에 따른 설명을 추가합니다.

🟢 : 안정 ( 특수 조치가 없이 사용 가능한 상태 )

🟡 : 불안정 ( 필수 조치가 필요한 상태 )

🔴 : 비권장 ( 기술, 운영에 있어서 불완전한 상태 )

</aside>

**Application Status 값을 적용 하지 않는 경우**

<aside>
💡

Application 단에서 Status 관리 로직을 적용 하지 않은 상태에서 JobStore의 DBMS별 상호 호환과 안정성에 대해서 변화 과정

</aside>

- Application 단에서 Status 관리 로직을 두지 않은 Quartz JDBCJobStore 실행 모델
    
    > 싱글 JVM / Application 모델 구조
    > 
    - 단일 JVM 인스턴스 환경에서는 **Quartz Scheduler가 Trigger 판단과 DB Lock을 통해 Job의 단일 실행을 보장**하므로
    Application 내부에서 별도의 실행 Status(`RUNNING`, `SUCCESS`, `FAIL`)를 관리하지 않아도 된다.
    - Job 실행 결과와 실패 여부는 Quartz 메타 테이블(QRTZ_*), 업무 테이블, 로그를 통해 확인한다.
    
    ![image.png](../img/project/shooting_post0003_006.png)
    
> **다중 클러스터를 적용한 모델 구조**

- JVM 인스턴스가 여러 개일 때도 흐름은 동일
    1. 각 JVM 인스턴스의 Quartz Scheduler가 Trigger를 조회
    2. DB Lock을 통해 **FireTime 기준 단일 실행 보장**
    3. 실행 주체는 FireTime마다 달라질 수 있음
    4. Job Logic이 업무 처리
    5. **Application은 Quartz 실행 제어를 위한 상태를 별도로 관리하지 않음**

<!-- two-column:start -->
<!-- left -->
<br/>

**다중 클러스터를 적용한 모델 구조 A - ( JVM 인스턴스별 배치 강조 )**

![image.png](../img/project/shooting_post0003_007.png)

- -각 JVM 인스턴스는 동일한 Scheduler와 Job Logic을 포함
- -DB Lock으로 단일 실행 보장

<!-- right -->
<br/>

**다중 클러스터를 적용한 모델 구조 B - ( Quartz/Job Logic 역할 분리 강조 )**

※ 아래 구조는 **물리적 분리가 아닌 역할 관점의 표현**

실제로 Quartz Scheduler와 Job Logic은 **동일 Application / JVM 내에서 동작**

![image.png](../img/project/shooting_post0003_008.png)

- -Quartz: 실행 시점 판단 + 단일 실행 제어
- -Job Logic: 실제 업무 처리
- -Application: Quartz 제어용 상태를 보유하지 않음
<!-- two-column:end -->

**동일한 실행 흐름을 다른 관점에서 표현한 구조이며, 시각적 강조 포인트만 다르다.**

장점과 불편한 점 이야기하자면, JVM 인스턴스의 수를 늘려도 **쉽게 확장이 가능하며 장애 발생 시 다음 실행에 영향이 없습니다.**

다만, **Job 실패 원인은 개발자가 설정한 로그와 DB로 확인 가능**하며 문제가 생겼을 시 재실행 여부 판단은 운영자가 결정할 수 있습니다.

> 다중 클러스터를 적용한 모델 구조 C - 심화 ( Application 內 ThreadPool 반환과 Trigger의 재실행 )

- Job 실행 후 Thread는 즉시 반환
- 다음 FireTime마다 실행 주체는 비결정적으로 변경될 수 있음
- DB Lock 기반이므로 실행 안정성 유지

![image.png](../img/project/shooting_post0003_009.png)

※ 위 내용 요약

> Quartz는 실행 시점과 단일 실행을 책임지고,  
> DB는 실행 이력과 업무 결과를 저장하며,  
> Application은 **Quartz 실행 제어를 위한 상태를 별도로 관리하지 않고 Job 실행에만 집중한다.**  
> FireTime마다 실행 주체가 바뀌어도 구조적으로 안전하다.  

- Application 단에서 Status 관리 로직을  적용 하지 않은 JDBCJobStore의 각 DBMS
    
    **※ Quartz는 스케줄러 프레임워크이라 DBMS의 퍼포먼스 대상은 공식 성능 결과는 존재하지 않음**
    
    - Oracle
        - 🟢 싱글 JVM / Application Status를 적용하지 않은 경우
            - **락 안정성**: 매우 높음 (ROW LOCK 정밀)
            - **Deadlock**: 거의 없음
            - **Quartz 호환성**: 최상
            - **평가**
                - 단일 JVM에서는 **거의 문제 없음**
                - Quartz가 Oracle 기준으로 설계된 느낌
            - **단점**
                - “안전해 보이지만” 구조적으로 안전한 건 아님
            
            ➡️ **평가: 매우 안정적 (구조는 취약)**
            
        - 🔴 클러스터 적용된 JVM / Application Status를 적용하지 않은 경우
            - Quartz 클러스터와 궁합 최상
            - DB Lock 신뢰 가능
            - ⚠️ 하지만
                - Job 중복 실행 방지는 **Quartz 수준까지만**
            - 장애 시
                - “실행 중이던 Job의 실제 상태”는 모름
            
            ➡️ **평가: 기술적으로는 안정, 비즈니스적으로는 불완전**
            
    - Mysql
        - 🟡 싱글 JVM / Application Status를 적용하지 않은 경우
            - **Isolation 기본값 RR**
            - **Gap Lock / Next-Key Lock 빈번**
            - **Deadlock 빈도**: 높음
            - **평가**
                - 단일 JVM에서도 간헐적 Lock 충돌 가능
                - RR 유지 시 Quartz Lock SQL과 충돌 가능
            - ⚠️ 필수 조치
                - `READ COMMITTED` 강제
            
            ➡️ **평가: 조건부 안정**
            
        - 🔴 클러스터 적용된 JVM / Application Status를 적용하지 않은 경우
            - **가장 위험한 조합**
            - Deadlock 빈번
            - Cluster일수록 Lock 경합 폭증
            - ⚠️ 실무에서는 **거의 금기**
            
            ➡️ **평가: 비권장**
            
    - Mssql
        - 🟡 싱글 JVM / Application Status를 적용하지 않은 경우
            - **Lock Escalation 존재**
            - Page / Table Lock 전이 가능
            - **평가**
                - 단일 JVM에서는 큰 문제는 드묾
                - 다만 Lock 패턴 예측이 어려움
            
            ➡️ **평가: 보통**
            
        - 클러스터 적용된 JVM / Application Status를 적용하지 않은 경우
            
            
    - **Postgre**
        - 🟡 싱글 JVM / Application Status를 적용하지 않은 경우
            - **MVCC 기반**
            - SELECT 시 Lock 최소
            - **평가**
                - 단일 JVM + 상태 없음에서도 비교적 안정
                - Quartz SQL이 MVCC와 잘 맞음
            - ⚠️ 주의
                - UPDATE 경쟁 시 지연 가능
            
            ➡️ **평가: 안정적**
            
        - 🟡 클러스터 적용된 JVM / Application Status를 적용하지 않은 경우
            - MVCC 덕분에 Oracle 다음으로 안정
            - 다중 Scheduler에서도 Lock 충돌 적음
            - ⚠️ Still
                - 비즈니스 실행 상태는 보장 못함
            
            ➡️ **평가: 기술 안정 / 의미 불안정**
            
    - Tibero
        - 🟢 싱글 JVM / Application Status를 적용하지 않은 경우
            - Oracle 유사 구조
            - Row Lock 안정
            - **평가**
                - Oracle 다음으로 안정적
            - ⚠️ 운영 경험치가 중요
            
            ➡️ **평가: 안정적**
            
        - 🟢 클러스터 적용된 JVM / Application Status를 적용하지 않은 경우
            - Oracle과 거의 동일한 패턴
            - 클러스터 안정성 우수
            
            ➡️ **평가: 안정**
            

- DBMS별 요약 비교
    
    ※ 상태 값이 존재하지 않은 경우 : Quartz 내부 상태만 사용
    
    - 안정성 적합도 점수 의미
        
        
        | 점수 | 의미 |
        | --- | --- |
        | 5 | Quartz 설계 철학과 거의 완벽하게 일치 |
        | 4 | 구조적으로 안정, 일부 조건에서만 주의 |
        | 3 | 사용 가능하나 튜닝·운영 역량 필수 |
        | 2 | 특정 조건에서만 제한적 사용 권장 |
        | 1 | Quartz 클러스터 환경에서 사실상 부적합 |
    - 싱글 JVM / Application 단에서 Status 관리 로직이 존재하지 않는 경우
        - 안정성 & 구조 개념 그래프
            
            <aside>
            💡
            
            **구조가 단순해서 DB 부담이 적으면서 Quartz Lock충돌 가능성 적음**
            
            > 안정성은 DB가 보완해주지만 **제어권은 없음**
            > 
            </aside>
            
            ![그래프 ( X축 : 구조 복잡도 / Y축 :  실행 안정성 / 예측 가능성)](../img/project/shooting_post0003_010.png)
            
            그래프 ( X축 : 구조 복잡도 / Y축 :  실행 안정성 / 예측 가능성)
            
    
    | DB | Lock 안정성 | Deadlock 안정성 | 클러스터 적합도 | 종합 평가 | 비고 |
    | --- | --- | --- | --- | --- | --- |
    | **Oracle** | **5** (Row Lock 예측 가능, Escalation/GAP 없음) | **5** (단일 JVM에서는 사실상 발생하지 않음) | **3** (확장 시에도 안정 예상) | 안정 | - 단일 JVM 기준 Quartz 사용에 최적<br/> - DB가 구조적 불안정을 가려줌 |
    | **MySQL** | **3** (InnoDB 구조적 한계 존재) | **2** (RR + Gap Lock으로 간헐적 발생) | **1** (확장 시 급격히 악화) | 조건부 | - 단일 JVM에서도 Deadlock 가능<br/> - RC 설정 필수 |
    | **PostgreSQL** | **4** (MVCC 기반, Lock 충돌 적음) | **3** (특정 UPDATE 경합 시 발생 가능) | **2** (확장 시 설계 필요) | 안정 | - 단일 JVM에서는 매우 안정적 |
    | **MSSQL** | **3** (Page/Table Lock 가능성) | **3** (부하 시 발생 가능) | **2** (확장 시 위험 증가) | 보통 | - 단일 환경에서는 문제 체감 낮음 |
    | **Tibero** | **4** (Oracle 유사 Row Lock 구조) | **4** (드물게 발생) | **3** (확장 시에도 안정적) | 안정 | - Oracle 대체로 충분히 안정 |
    
    - 다중 클러스터 적용된 JVM / Application 단에서 Status 관리 로직이 존재하지 않는 경우
        - 안정성 & 구조 개념 그래프
            
            <aside>
            💡
            
            **Scheduler 수 증가에 따른 DB Lock 경쟁 증가 및 Quartz가 실행 단위 Lock까지 책임을 지게됨**
            
            > 구조가 커질수록 **Quartz 한계가 그대로 노출됨**  

            </aside>
            
            ![그래프 ( X축 : 구조 복잡도 / Y축 :  실행 안정성 / 예측 가능성)](../img/project/shooting_post0003_011.png)
            
            그래프 ( X축 : 구조 복잡도 / Y축 :  실행 안정성 / 예측 가능성)
            
        
        | DB | Lock 안정성 | Deadlock 안정성 | 클러스터 적합도 | 종합 평가 | 비고 |
        | --- | --- | --- | --- | --- | --- |
        | **Oracle** | **5** (Row Lock 충돌 예측 가능) | **5** (Quartz 클러스터에서도 매우 드묾) | **5** (노드 증가에도 안정) | 기술적으로 안정 | - Quartz 클러스터 표준 조합 <br/> - 비즈니스 실행 의미는 보장 못함 |
        | **MySQL** | **2** (Gap/Next-Key Lock 빈번) | **1** (Deadlock 빈발) | **1** (2노드부터 리스크 폭증) | 비권장 | - Quartz 클러스터와 구조적으로 부적합 |
        | **PostgreSQL** | **4** (MVCC로 Lock 경합 완화) | **3** (부하 시 발생 가능) | **4** (중대형 클러스터 안정) | 비교적 안정 | - Oracle 다음 현실적 대안 |
        | **MSSQL** | **3** (Lock Escalation 발생 가능) | **3** (경합 시 발생) | **3** (소~중형 한정) | 튜닝 전제 | - DBA 튜닝이 안정성 좌우 |
        | **Tibero** | **4** (Oracle과 유사한 Lock 모델) | **4** (Deadlock보다는 Wait 위주) | **4** (클러스터 안정) | 안정 | - Oracle과 거의 동일한 패턴 |

### Application Status 값을 적용한 경우

<aside>
💡

Application 단에서 Status 관리 로직을 적용한 상태에서 JobStore의 DBMS별 상호 호환과 안정성에 대해서 변화 과정

</aside>

- Application 단에서 Status 관리 로직을 적용한 Quartz JDBCJobSotre 모델 설명과 흐름도
    
    > 단일 JVM / Application 모델 구조
    > 
    - Quartz는 Trigger 기준의 단일 실행은 보장하지만, 업무 관점의 실행 여부 판단은 책임지지 않는다
    - Application이 `RUNNING`, `DONE`, `FAIL` 등의 상태를 직접 관리
    - Job 재실행, 순차 실행, 강제 차단 같은 정책을 **코드로 제어 가능**
    
    ![image.png](../img/project/shooting_post0003_012.png)
    

> 다중 클러스터를 적용한 모델 구조 A - ( JVM 인스턴스별 구성 강조 )
> 
- 각 JVM 인스턴스는 동일한 구조를 가지며,
- **Quartz Lock과 Application Status 판단을 조합하여 실행 중복 및 정책 위반을 방지**한다

![image.png](../img/project/shooting_post0003_013.png)

![다중 클러스터를 적용한 모델 구조 A 부연 설명](../img/project/shooting_post0003_014.png)

다중 클러스터를 적용한 모델 구조 A 부연 설명

> 다중 클러스터를 적용한 모델 구조 B - ( 역할 관점 분리 강조 )
> 

※ 물리적 분리가 아닌 **역할 관점 표현 실제로는 동일 JVM / 동일 Application 내 구성**이다.

- Quartz Lock → **언제 실행할 수 있는지**
- Status Lock → **지금 실행해도 되는지**
- **두 개의 Lock을 조합하여 시간 기준 실행 + 업무 정책 기반 실행 제어가 가능**하다

![image.png](../img/project/shooting_post0003_015.png)

> 다중 클러스터를 적용한 모델 구조 C - 심화 ( Application 內 ThreadPool 반환과 Trigger의 재실행 )
> 
- Quartz Lock과 Status Lock 조합으로 FireTime 단위 단일 실행과 업무 기준 순차 실행을 보장

![image.png](../img/project/shooting_post0003_016.png)

※ 위 내용 요약

> Quartz는 실행 시점을 결정하고, Application은 실행 정책과 상태를 판단한다.
이 구조는 재실행 제어, 순차 실행, 강제 차단 등 **운영 정책을 코드로 강하게 통제해야 하는 환경**에 적합하다.
> 

- Application 단에서 Status 관리 로직을 적용한 JDBCJobStore의 각 DBMS
    
    **※ Quartz는 스케줄러 프레임워크이라 DBMS의 퍼포먼스 대상은 공식 성능 결과는 존재하지 않음**
    
    - Oracle
        - 🟢 싱글 JVM / Application Status를 적용한 경우
            - 상태 테이블 Lock 안정
            - 트랜잭션 제어 쉬움
            - 장애 복구 설계 용이
            
            ➡️ **평가: 매우 안정**
            
        - 🟢 클러스터 적용된 JVM / Application Status를 적용한 경우
            - DB Lock + Application Lock 이중 보호
            - 장애 복구 가능
            - 실행 중복 거의 0
            
            ➡️ **평가: 엔터프라이즈 기준 최상**
            
    - Mysql
        - 🟢 싱글 JVM / Application Status를 적용한 경우
            - 상태 테이블만 관리하면 됨
            - RC로 설정 시 안정성 급상승
            - Quartz Lock 영향 감소
            
            ➡️ **평가: 실사용 가능**
            
        - 🟡 클러스터 적용된 JVM / Application Status를 적용한 경우
            - 상태 테이블 Lock 설계가 핵심
            - RC + 인덱스 필수
            - 여전히 Deadlock 가능성은 존재
            
            ➡️ **평가: 가능하지만 난이도 높음**
            
    - Mssql
        - 🟡 싱글 JVM / Application Status를 적용한 경우
            - 상태 테이블 단순하면 안정
            - Lock Escalation 위험 감소
            
            ➡️ **평가: 관리 가능**
            
        - 🟡 클러스터 적용된 JVM / Application Status를 적용한 경우
            - Lock Escalation 관리 필수
            - 클러스터 수 늘면 위험 증가
            
            ➡️ **평가: 숙련자 전용**
            
    - **Postgre**
        - 🟢 싱글 JVM / Application Status를 적용한 경우
            - 상태값 모델과 궁합 최고
            - MVCC + Application Lock 조합 최상
            
            ➡️ **평가: 매우 안정**
            
        - **🟢** 클러스터 적용된 JVM / Application Status를 적용한 경우
            - 이 구조에서 **가장 밸런스 좋음**
            - MVCC + 명시적 상태 관리 이상적
            
            ➡️ **평가: 강력 추천**
            
    - Tibero
        - 🟢 싱글 JVM / Application Status를 적용한 경우
            - Oracle 패턴 그대로 사용 가능
            
            ➡️ **평가: 매우 안정**
            
        - 🟢 클러스터 적용된 JVM / Application Status를 적용한 경우
            - Oracle과 동일 패턴
            - 운영 경험만 있으면 매우 안정
            
            ➡️ **평가: 안정**
            

- DBMS별 요약 비교
    
    ※ 상태 값이 존재하는 경우 : Application Execution Controller / Status Store 존재
    
    - 안정성 적합도 점수 의미
        
        
        | 점수 | 의미 |
        | --- | --- |
        | 5 | Quartz 설계 철학과 거의 완벽하게 일치 |
        | 4 | 구조적으로 안정, 일부 조건에서만 주의 |
        | 3 | 사용 가능하나 튜닝·운영 역량 필수 |
        | 2 | 특정 조건에서만 제한적 사용 권장 |
        | 1 | Quartz 클러스터 환경에서 사실상 부적합 |
    - 싱글 JVM / Application 단에서 Status 관리 로직이 존재 하는 경우
        - 안정성 & 구조 개념 그래프
            
            <aside>
            💡
            
            **Quartz는 단순 Trigger역할만 행하며 실행 여부는 Application이 결정하며 DB는 상태 테이블만 관리**
            
            > **Quartz의 리스크를 Application에서 감당해야함**
            
            ```java
            * 구조 변화
            [Quartz] ──(시간)──▶ [Execution Controller] ──▶ Job
                                     │
                                  Status Table
            ```
            
            </aside>
            
            ![그래프 ( X축 : 구조 복잡도 / Y축 :  실행 안정성 / 예측 가능성)](../img/project/shooting_post0003_017.png)
            
            그래프 ( X축 : 구조 복잡도 / Y축 :  실행 안정성 / 예측 가능성)
            
        
        | DB | Lock 안정성 | Deadlock 안정성 | 클러스터 적합도 | 종합 평가 | 비고 |
        | --- | --- | --- | --- | --- | --- |
        | **Oracle** | **5** (상태 테이블 Lock 안정) | **5** (명시적 제어로 거의 없음) | **4** (확장 대비 우수) | 매우 안정 | - 상태값 모델과 궁합 최상 |
        | **MySQL** | **4** (상태 테이블 단순 Lock) | **3** (RC 기준 관리 가능) | **3** (확장 시 주의) | 실사용 가능 | - Quartz Lock 영향 최소화 |
        | **PostgreSQL** | **5** (MVCC + 상태 테이블 궁합) | **4** (예측 가능) | **4** (확장 대비 우수) | 최상 | - 상태 기반 실행 모델에 가장 적합 |
        | **MSSQL** | **4** (상태 테이블 중심 제어) | **4** (Escalation 감소) | **3** (확장 시 관리 필요) | 관리 가능 | - 구조 단순화가 핵심 |
        | **Tibero** | **5** (Oracle 패턴 그대로) | **4** (드물게 발생) | **4** (확장 안정) | 매우 안정 | - 국내 환경에서 특히 강점 |
    
    - 다중 클러스터 적용된 JVM / Application 단에서 Status 관리 로직이 존재 하는 경우
        - 안정성 & 구조 개념 그래프
            
            <aside>
            💡
            
            **Quartz Lock이 1차 필터를 담당하며 Application Status Lock으로 2차 필터까지 하여 실행 중복을 제거함**
            
            > **DB 차이는 남지만 “사고로 이어질 확률”이 현저히 낮아짐**
            
            ```java
            * 구조 레이어
            ┌───────────────┐
            │ Quartz Trigger│  ← 시간 충돌
            └───────▲───────┘
                    │
            ┌───────┴───────┐
            │ App Status    │  ← 실행 충돌
            │ (RUNNING)     │
            └───────▲───────┘
                    │
            ┌───────┴───────┐
            │ Job Logic     │
            └───────────────┘
            ```
            
            </aside>
            
            ![그래프 ( X축 : 구조 복잡도 / Y축 :  실행 안정성 / 예측 가능성)](../img/project/shooting_post0003_018.png)
            
            그래프 ( X축 : 구조 복잡도 / Y축 :  실행 안정성 / 예측 가능성)
            
        
        | DB | Lock 안정성 | Deadlock 안정성 | 클러스터 적합도 | 종합 평가 | 비고 |
        | --- | --- | --- | --- | --- | --- |
        | **Oracle** | **5** (이중 Lock 구조에서도 안정) | **5** (실행 중복 거의 없음) | **5** (대규모 클러스터 안정) | 최상 | - 엔터프라이즈 기준 완성형 |
        | **MySQL** | **3** (상태 테이블 설계 의존) | **3** (여전히 가능성 존재) | **3** (난이도 높음) | 가능 | - RC + 인덱스 설계 필수 |
        | **PostgreSQL** | **5** (MVCC + 상태 Lock 최적) | **4** (드물고 예측 가능) | **5** (대규모 가능) | 강력 추천 | - 가장 균형 잡힌 선택 |
        | **MSSQL** | **4** (Escalation 관리 시 안정) | **4** (제어 가능) | **4** (숙련자 전제) | 숙련자용 | - 운영 역량이 곧 안정성 |
        | **Tibero** | **5** (Oracle과 동일한 운영 모델) | **4** (Wait 위주) | **5** (대규모 안정) | 안정 | - Oracle 대안으로 충분 |

---

# 분석

## 에이전트 이슈 케이스의 환경 구축

- OS : Windows 10 64bit / linux RHEL(Red Hat Enterprise Linux 8.0)
- JDK Version : JDK SE 8 or JDK 1.8
- Agent Memory 할당량
    
    ※ 현재 표에 보이는 Memory 할량당은 기동 되는 서비스의 메모리의 최소 사양을 가지고 테스트하였으며,
         Memory를 낮게 설정해야 해당 증상의 발생 빈도가 많아질 것이라 예상함
    
    |  | Agent Memory 할당량 |
    | --- | --- |
    | -Xms (JVM의 최소 메모리 크기) | -Xmx256m |
    | -Xmx (JVM의 최대 메모리 크기) | -Xmx512m |
- Agent JVM Add Option (GC Heap Memory 관련된 로그 수집을 위한)
    
    
    | 네임 | **옵션** | **설명** | **적합성 여부** |
    | --- | --- | --- | --- |
    | Serial GC | -XX:+UesSerialGC | 단일 스레드, 작은 메모리 환경 | 사용가능 |
    | Parallel GC | -XX:+UseParallelGC | 멀티 스레드, 높은 처리량
    JDK8에서 default | 사용가능 |
    | G1GC | -XX:UseG1GC | Region 단위의 관리로 지연 시간을 줄임.Full GC의 시간을 수백 밀리초 이하로 관리하고 싶을 때 사용
    JDK11에서 default | 버전 이슈로 인한 사용 불가능 |
    | ZGC | -XX:+UseZGC | 초저지연 GC. 
    대용량 메모리에서 Stop-The-World 시간을 최대한 줄이는 것이 목표.10GB 이하의 메모리에서 비효율적일 수 있음. 50GB 이상일 경우 매우 적합하다고 함
    JDK11+ | 버전 이슈로 인한 사용 불가능 |
    | Shenandoah GC | -XX:UseShenandoahGC | 작은 GC를 여러 번 실행하여 낮은 지연시간을 보장.
    JDK12+ | 버전 이슈로 인한 사용 불가능 |
- Agent jobStore : RAMJobcStore (Quartz Application 관점에서 취급)
※  Agent의 JobSotre는 고객사의 심어두는 서비스 혹은 데몬이기 때문에 RAM으로 관리할 수 밖에 없다.
- Agent ThreadPoolSize : max - 50 / min - 10
※ JDBCJobStore의 ThreadPoolSize가 아닌 Agent 자체에서 hikariCP의 자체 부여된 ThreadPoolSize
- Quartz library : Quartz-2.1.0.jar
- DataBase : mysql, Oracle
- JVMConsole 적용 여부 : Y

## Agent 이슈에 대한 원인을 찾기 위한 테스트 케이스

1. OS 운영체제별 24시간 기동
    - Windows 10 - **정상**
    - Linux RHEL (Red Hat Enterprise Linux 8.0) - **정상**
    
2. JVMConsole과GC Heap Memory 로그를 통한 JVM Memory 혹은 Cpu 변화 확인 
    - 메모리 최소화 Memory(max / min) 순차 변동
        - Xmx256m / Xms128m - **정상**
        - Xmx128m / Xms64m  - **정상**
        - Xmx64m / Xms32m - **정상**
        - Xmx32m / Xms16m - Agent 기동 시 java.lang.OutOfMemoryError 발생 후 기동 정지
    
3. HikariCP를 통한 ThreadPoolSize 변동
    - ThradPoolSize(max / min)  순차 변동
        - 50 / 10 - 정상
        - 25 / 5 - **정상**
        - 10 / 1 - **정상**
        - 5 / 1 - Agent 내부 로그 ThreadPool Exception 발생 
        ※ 현재 Agent의 쓰레드는 최대 10 ~  1 개를  잡을 수 있음을 확인 가능
    
4. Quartz Version별 결과
    - Quartz-2.1.0.jar  - **정상( 현재 발생된 이슈 라이브러리 )**
    - Quartz-2.3.2.jar  - **정상**

## JVMConsole에서 측정한 Heap Memeory & Cpu

내용 정리가 필요

## 분석을 통한 테스트 진행 결과

JVMConsole과 Memory GC Heap Memory를 확인한 결과 정상적으로 실행 되는 것을 확인하였으며,

현재 생각 되는 모든 테스트 방법을 모색 및 테스트를 진행 하여 분석을 통해서 **확인 및 결과 동일한 증상을 발생 및 확인 할 수 없었습니다.**

따라서 해당 데이터의 추가적 로그 확보와 해당 모든 데이터들을 종합하여 좀 더 신중한 분석이 필요하다고 판단하여

일정 주기 동안 데이터를 수집하여 해당 원인을 추가 분석 및 해당 방법을 작성하도록 하겠습니다.

현재 추측 원인은 **“자원에 대한 부족”**으로 생각하여 임시조치[ Memory 증가, GC Heap Memory Log 추가, Quartz 라이브러리 버전 변경 ]을 통해서 해결 여부를 파악해 볼 생각입니다.

이후 해결 여부를 떠나서 정확한 원인 분석을 위해서 추가적으로 확인 및 검증을 해볼 생각입니다.

---

# 해결방안

## 1. [ 임시 조치 ] OS별 Memory 수정 방식과 GC Heap Memory 로그 추가

- Linux
    
    > env.sh에 정보에 Xmx / Xms의 값을 변경 후 start.sh로 실행시킨다.
    > 
    - env.sh
        
        ```powershell
        #!/bin/sh
        
        SERVER_NAME="Service"
        MAIN_PATH="/etc/트러블슈팅_관련_작업물/Service"
        JAVA_HOME="/etc/java/jdk1.8.0_45"
        ENCODING="UTF-8"
        XMS="-Xms64m"
        XMX="-Xmx128m"
        
        JAVA_OPTS="
        -XX:+HeapDumpOnOutOfMemoryError
        -XX:HeapDumpPath=${MAIN_PATH}/memory/log
        -Xlog:gc*:file=${MAIN_PATH}/memory/log/gc.log:time
        -XX:+UseG1GC
        "
        
        mkdir -p "${MAIN_PATH}/memory/log"
        
        SETUSER="권한부여자를 넣어주세요"
        RUNNER=`whoami`
        
        for JAR in ../lib/*; do
            CLASSPATH="$CLASSPATH:$JAR"
        done
        
        CLASSPATH=${CLASSPATH}:${JAVA_HOME}/lib/tools.jar
        
        export CLASSPATH SERVER_NAME;
        
        if [ $RUNNER != $SETUSER ] ;
           then echo "Deny Access : [ $RUNNER ]. Not $SETUSER" ;
           exit 0 ;
        fi
        
        PID=`ps -ef | grep -w ${SERVER_NAME} | grep -v grep  | awk {'print $2'}`
        
        ```
        
    - start.sh
        
        ```powershell
        #!/bin/sh
        
        . ./env.sh
        
        if [ $PID ];
            then 
                echo ${SERVER_NAME} "is already running.  Skipped.";
        else
            nohup ${JAVA_HOME}/bin/java ${XMS} ${XMX} ${JAVA_OPTS} -Dserver=${SERVER_NAME} -Dfile.encoding=${ENCODING} -DMAIN_HOME=${MAIN_PATH} -classpath $CLASSPATH ServiceMainApp start >/dev/null 2>&1&
        fi
        
        ```
        

- Windows
    
    > 서비스의 Xmx 와 Xms의 값을 변경하기에는 고객(Client)사의 개발자가 아닌 경우 및 에이전트 제공을 위해서  서비스의 처리 PowerShell를 생성하여 배포
    Quartz의 특정 job Scheduler중지의 다른 원인이 있다고 판단하여 GC Heap Memory로그에 수집을 요청
    > 
    - env.bat
        
        ```powershell
        @echo off
        set SERVICE_NAME=Service
        set MAIN_PATH=D:\etc\트러블슈팅_관련_작업물\Service
        set JAVA_HOME=D:\etc\트러블슈팅_관련_작업물\Java\jdk1.8.0_45
        set ENCODING="UTF-8"
        set XMS="-Xms64m"
        set XMX="-Xmx128m"
        
        if not exist "%MAIN_PATH%\memory\log" (
            mkdir "%MAIN_PATH%\memory\log"
        )
        
        set JAVA_OPTS=-XX:+HeapDumpOnOutOfMemoryError ^
         -XX:HeapDumpPath=%MAIN_PATH%\memory\log ^
         -Xloggc:%MAIN_PATH%\memory\log\gc.log ^
         -XX:+UseG1GC ^
         -XX:+PrintGCDetails ^
         -XX:+PrintGCDateStamps ^
         -XX:+PrintPromotionFailure ^
         -XX:+PrintConcurrentLocks
        
        setLocal EnableDelayedExpansion  
        set CLASSPATH="
        for /R %MAIN_PATH%\lib %%a in (*.jar) do (    
            set CLASSPATH=!CLASSPATH!;%%a
        ) 
        set CLASSPATH=!CLASSPATH!;%JAVA_HOME%\lib\tools.jar"
        endlocal & SET CLASSPATH=%CLASSPATH%
        goto :eof
        ```
        
    - ServiceMemory_Editor.bat
        
        > memory Editor를 읽다 보면 왜 이런 구조로 조회해서 찾아보는걸까? 생각할 수 있습니다.
        아래의 구조를 보게 된다면 어떤 서비스가 어떤 경로에 설치되는 것을 단박에 이해 할 수 있고 Windows 버전별로 구조의 차이는 없습니다.
        
        ```powershell
        [32bit 프로세스]
         ├─ Program Files (x86)
         ├─ HKLM or HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node      
         └─ SysWOW64
        
        [64bit 프로세스]
         ├─ Program Files
         ├─ HKLM or HKEY_LOCAL_MACHINE\SOFTWARE
         └─ System32
        ```
        
        
        ```powershell
        @echo off
        
        call "env.bat"
        
        chcp 65001 > nul
        setlocal enabledelayedexpansion
        
        :: :SERVICE_MODE_INFO START
        :SERVICE_MODE_INFO
            echo.
            echo    ########################################################
            echo    #                                                      #
            echo    # [ 시작 ] ServiceMemory_Editor                         #
            echo    #                                                      #
            echo    ########################################################
            echo    # [ 안내 ] 현재 사용 할 수정 도구를 선택하세요.                 #
            echo    #   0. Service Memory(Xms/Xmx) Modify                  #
            echo    #   1. Exit                                            #
            echo    ########################################################
            echo.
            echo.
        
            SET /P INPUT_MODE=[입력] 사용하실 수정 유형 선택 (0 또는 1): 
            if %INPUT_MODE%==0 (
                echo "[0. Service Memory(Xms/Xmx) Modify]"를 선택하였습니다.
                echo.
                echo.
                
                goto :SERVICE_INSTALL_INFO
            ) else (
                if %INPUT_MODE%==1 (
                    exit /b
                ) else (
                    echo.
                    echo.
                    echo 	잘못된 값을 입력하였습니다.
                    echo 	아무키를 입력하면 종료됩니다.
                    echo.
                    echo.
                    
                    pause >nul
                    exit /b
                )
            )
        :: :SERVICE_MODE_INFO END
        
        :: :SERVICE_INSTALL_INFOSTART
        :: Select Service_Path Check has or is not and 32bit or 64bit
        :SERVICE_INSTALL_INFO
            echo 현재 Windows에 설치된 "%SERVICE_NAME%"를 레지스트리에서 검색합니다. 
            echo Windows 32bit인지 확인 하는 중입니다.
            echo.
            
            set SERVICE_INSTALLED=0
            for /f %%a in ('reg query "HKLM\SOFTWARE\WOW6432Node" /s /f "%SERVICE_NAME%" ^| findstr /i "%SERVICE_NAME%" 2^>nul') do (
                set SERVICE_INSTALLED=1
            )
            if !SERVICE_INSTALLED!==1 (
                echo Windows 32bit 설치된 프로세스입니다.
                echo Windows 32bit 경로로 설정하여, 메모리를 업데이트를 진행합니다.
                set "WINDOWS_PATH=HKLM\SOFTWARE\WOW6432Node\SYSTEM\CurrentControlSet\Services\%SERVICE_NAME%\Parameters	"	
                call :REG_PATH %WINDOWS_PATH%
                
                goto :SERVICE_MEMORY_MODIFY	
            ) else (
                echo Windows 32bit에서 Service를 찾지 못하여, Windows 64bit에서 "%SERVICE_NAME%"를 검색합니다.
                echo.
                
                set SERVICE_INSTALLED=0
                for /f %%a in ('reg query "HKLM\SYSTEM" /s /f "%SERVICE_NAME%" ^| findstr /i "%SERVICE_NAME%" 2^>nul') do (
                    set SERVICE_INSTALLED=1
                )
                if !SERVICE_INSTALLED!==1 (
                    echo Windows 64bit 설치된 프로세스입니다.
                    echo Windows 64bit 경로로 설정하여, 메모리를 업데이트를 진행합니다.		
                    set "WINDOWS_PATH=HKLM\SYSTEM\CurrentControlSet\Services\%SERVICE_NAME%\Parameters"
                    call :REG_PATH !WINDOWS_PATH!
                    
                    goto :SERVICE_MEMORY_MODIFY
                ) else (
                    echo Windows 32bit/64bit에서 "%SERVICE_NAME%"가 발견되지 않았습니다.
                    echo 아무키를 입력하면 종료됩니다.
                    echo.
                    echo.
                    
                    pause >nul
                    exit /b
                )
            )
        :: :SERVICE_INSTALL_INFO END
        
        :REG_PATH
        set REG_PATH=%~1
        goto :EOF
        
        :: :SERVICE_MEMORY_MODIFY START
        :SERVICE_MEMORY_MODIFY 
            :: SELECT MEMORY_TEMP(PROCESS) NAME & SIZE 
            set GET_MEMORY_NAME=
            set GET_MEMORY_SIZE=
        
            :: SELECT MEMORY NAME & SIZE
            set GET_MEMORY_MIN_NAME=
            set GET_MEMORY_MAX_NAME=
            set GET_MEMORY_MIN_SIZE=
            set GET_MEMORY_MAX_SIZE=
        
            :: INSER MEMORY SIZE
            set "SET_MEMORY_MIN_SIZE=%XMS:"=%"
            set "SET_MEMORY_MAX_SIZE=%XMX:"=%"
        
            :: RESPONSE MSG TYPE
            set MSG_TYPE=0
        
            :: see "env.bat" Call Info Memory Value
            echo.
            echo.
            echo    ##############################################################
            echo    #          MEMORY             #            CURRENT           #
            echo    ##############################################################
            echo    # env.bat에서 호출한 최소 값      #     !SET_MEMORY_MIN_SIZE!    #
            echo    # env.bat에서 호출한 최대 값      #     !SET_MEMORY_MAX_SIZE!    #
            echo    ##############################################################
            echo.
            echo.
        
            :: Select Current "JVM Option Number *" Info KEY / Value In Registry 
            for /f "skip=2 tokens=* delims=" %%L in ('reg query "%REG_PATH%"') do (
                set "line=%%L"
        
                echo !line! | find /i "JVM Option Number" >nul 2>&1
                if !errorlevel! equ 0 (
                    for /f "tokens=1-5*" %%a in ("!line!") do (
                        set "name=%%a %%b %%c %%d"
                        set "rest=%%f"
                        
                        rem Powershell Registry (Regex) 
                        powershell -NoProfile -Command "if ('%%f' -match '^-Xms.*m$' -or '%%f' -match '^-Xmx.*m$') { exit 0 } else { exit 1 }"
                        if !errorlevel! equ 0 (
                            set "reg_memory_name=%%a %%b %%c %%d"
                            set "reg_memory_size=%%f"
        
                            set GET_MEMORY_NAME=!GET_MEMORY_NAME! !reg_memory_name!
                            set GET_MEMORY_SIZE=!GET_MEMORY_SIZE! !reg_memory_size!
                        )
                    )
                )
            )
            
            :: If No Such -> Move Error Step
            if "!GET_MEMORY_NAME!"=="" if "!GET_MEMORY_SIZE!"=="" (
                set MSG_TYPE=0
                call :MSG_TYPE !MSG_TYPE!
                
                goto :MESSAGE
            )
        
            :: Registry Key / Value Setting
            set "GET_MEMORY_NAME=!GET_MEMORY_NAME!"
            set "GET_MEMORY_NAME=!GET_MEMORY_NAME:~1!"
            set "modline=!GET_MEMORY_NAME:JVM Option Number =|!"
            set i=0
            for /f "tokens=1-10 delims=|" %%a in ("!modline!") do (
                for %%x in (%%a %%b %%c %%d %%e %%f %%g %%h %%i %%j) do (
                    if not "%%x"=="" (
                        set /a i+=1
                        set "name=JVM Option Number %%x"
        
                        if "!i!"=="1" set "GET_MEMORY_MIN_NAME=!name!"
                        if "!i!"=="2" set "GET_MEMORY_MAX_NAME=!name!"
                    )
                )
            )
        
            set "jvmOptions=!GET_MEMORY_SIZE!"
            set i=0
            for %%a in (%jvmOptions%) do (
                set /a i+=1
                if "!i!"=="1" set GET_MEMORY_MIN_SIZE=%%a
                if "!i!"=="2" set GET_MEMORY_MAX_SIZE=%%a
            )
        
            :: Current Info And Change Info Status
            echo.
            echo.
            echo    레지스트리의 메모리를 변경을 20초 뒤 시작합니다.
            echo    ##############################################################################
            echo    #          NAME           #          CURRENT        #          CHANGE        #
            echo    ##############################################################################
            echo    # !GET_MEMORY_MIN_NAME!   #   !GET_MEMORY_MIN_SIZE! #  !SET_MEMORY_MIN_SIZE! #
            echo    # !GET_MEMORY_MAX_NAME!   #   !GET_MEMORY_MAX_SIZE! #  !SET_MEMORY_MAX_SIZE! #
            echo    ##############################################################################
            echo.
            echo.
        
            :: sleep(20sec)
            powershell -command "Start-Sleep -Milliseconds 2000"
        
            :: Registry Memory Change
            :: Min
            echo 메모리 최소값 변경을 시작합니다.
            echo ================================================================
            if "!GET_MEMORY_MIN_SIZE!" neq "" (
                echo 현재 값: !GET_MEMORY_MIN_SIZE!
                echo !GET_MEMORY_MIN_SIZE! | findstr /i /c:"-Xms"
                if !errorlevel! == 0 (
                    echo    └--▶ -Xms 옵션 감지됨 → "!SET_MEMORY_MIN_SIZE!"으로 변경 시도 중...	
                    reg add "%REG_PATH%" /v "!GET_MEMORY_MIN_NAME!" /t REG_SZ /d "!SET_MEMORY_MIN_SIZE!" /f >nul
                    echo    └--▶ [완료] 변경됨: "!GET_MEMORY_MIN_SIZE!" → "!SET_MEMORY_MIN_SIZE!"
                    
                    set MSG_TYPE=1
                ) else (
                    echo    └--▶ [유지] -Xms 옵션이 아니므로 변경하지 않음
                    set MSG_TYPE=0
                )
            ) else (
                echo    └--▶ [오류] !GET_MEMORY_MIN_NAME! 값이 존재하지 않음
                set MSG_TYPE=0
            )
            echo ================================================================
            echo.
            echo.
            :: Max
            echo 메모리 최대값 변경을 시작합니다.
            echo ================================================================
            if "!GET_MEMORY_MAX_SIZE!" neq "" (
                echo 현재 값: !GET_MEMORY_MAX_SIZE!
                echo !GET_MEMORY_MAX_SIZE! | findstr /i /c:"-Xmx"
                if !errorlevel! == 0 (
                    echo    └--▶ -Xms 옵션 감지됨 → "!SET_MEMORY_MAX_SIZE!"으로 변경 시도 중...
                    reg add "%REG_PATH%" /v "!GET_MEMORY_MAX_NAME!" /t REG_SZ /d "!SET_MEMORY_MAX_SIZE!" /f >nul
                    echo    └--▶ [완료] 변경됨: "!GET_MEMORY_MAX_SIZE!" → "!SET_MEMORY_MAX_SIZE!"
                    set MSG_TYPE=1
                ) else (
                    echo    └--▶ [유지] -Xmx 옵션이 아니므로 변경하지 않음
                    set MSG_TYPE=0
                )
            ) else (
                echo    └▶ [오류] !GET_MEMORY_MAX_NAME! 값이 존재하지 않음
                set MSG_TYPE=0
            )
            echo ================================================================
            call :MSG_TYPE !MSG_TYPE!
            
            goto :MESSAGE
        :: :SERVICE_MEMORY_MODIFY END
        
        :MSG_TYPE
        set MSG_TYPE=%~1
        goto :EOF
        
        :: : MESSAGE START  
        :MESSAGE
            if %MSG_TYPE%==1 (
                echo.
                echo.
                echo    #########################################
                echo     [완료] 작업이 정상적으로 종료되었습니다.
                echo    #########################################
                echo.
                echo.
            ) else (
                echo.
                echo.
                echo    #########################################
                echo     [에러] 에러로 인해서 작업이 실패하였습니다.
                echo    #########################################
                echo.
                echo.
            )
            
            echo 	잘못된 값을 입력하였습니다.
            echo 	아무키를 입력하면 종료됩니다.
            echo.
            
            pause >nul
            exit /b
        :: : MESSAGE END
        ```
        

## 2. 임시 조치를 통한 로그 수집 및 정확한 원인 분석이 필요

- 자원 소모에 따른 문제 여부 파악
    1. 메모리 누수
    2. CPU 과점유
- 특정 job Scheduler에서 조회하는 DB 혹은 로직에 대한 확인
    1. ThreadPool 반환 여부
    2. LOCK이 발생 유무
- 로직들에 대한 LOG로 메소드 단위

---

# 결론

### Quartz 특정 Job Scheduler 중지 상태

**문제 원인 요약**

1. 현재로서 확인이 불가능한 어떤 Job Scheduler이 중지되는지 확인하기 위해서 로그 레벨로 추출 - **결과 : 실시간 발송 job Scheduler로 확인**
    
    **※ 운영에 사용되는 방식이 절대로 아니며, 테스트 시에만 일시적으로 적용한 로그별 처리 내용입니다.**
<!-- two-column:start -->
<!-- left -->
<br/>

- TRACE
    
    > Quartz Job 내부 동작을 미세 단위로 검증  
    `loop 내부, 재시도 흐름, nextFireTime 변화 등`
    
- INFO
    
    > Quartz 테스트 케이스 단위의 결과를 요약  
    `(Job 실행 성공/실패, misfire 처리 결과, 경과 시간 등)`
    
<!-- right -->
<br/>

- DEBUG
    
    > Job / Trigger / Listener 단위의 실행 흐름을 확인  
    `Job 시작·종료, Trigger fired/complete, context 파라미터 등`
    
- ERROR
    
    > Quartz 테스트 실패 시 원인 분석  
    `JobExecutionException, Trigger-Job 불일치, Job 미실행 등)`
    
<!-- two-column:end -->
        
2. 실시산 발송의 대량 처리로 인해서 자원 소모(메모리 누수)등 관련해서 문제가 있지 않을까 추가적인 테스트 및 정보 수집이 필요
    - 메모리 누수 시 발생 상황 - 메모리 누수로 인한 Full GC는 Quartz Scheduler의 타이밍을 지연시켜, 특정 Job이 실행되지 않거나 죽은 것처럼 보이게 만든다.
        
        > 메모리 누수 시 흐름도
        
        ```powershell
        특정 Job에서 객체 누적 (static, cache, collection)
        ↓
        Heap 사용량 증가
        ↓
        Minor GC 증가
        ↓
        Full GC 빈도 증가 (Stop-The-World)
        ↓
        Scheduler tick 지연
        ↓
        Trigger misfire / 실행 지연
        ↓
        Job이 멈춘 것처럼 보임
        ```
        
    - CPU 과점유 시 발생 상황 - 특정 로직으로 인해서 계산량 폭증으로 인해서 CPU 과점유가 되면 Job이 종료되지 않고 뫼비우스 띠 같은무한 루프상태가 되어 버린다
        
        > CPU 과점유 시 흐름도
        
        ```powershell
        Trigger fire
        ↓
        Job execute() 진입 (정상)
        ↓
        CPU-intensive / infinite loop
        ↓
        Thread RUNNABLE 상태 고정
        ↓
        execute() return 안 됨
        ↓
        @DisallowConcurrentExecution이면 다음 실행 전부 차단
        ↓
        Job이 중지된 것처럼 보임
        ```
        

**해결 방안**

현재까지 확실한 정보가 없어서 **처리가 불가능** 하지만 **정보 수집을 위한 임시 조치가 가능(해결방안 참조)**

문제 원인 요약에 작성한 추측 되는 내용 로그를 확보 후에 처리하는 과정

### 방향성

위에서 추축 되는 로그들을 추출 후 분석 후 테스트를 통해서 검증 및 향후 처리 방안에 대해서 분석 하는 방향으로 정리할 계획이다.

**현실적인 방향성**

1. 관련된 모든 정보 수집
2. 위에서 추측한 내용을 토대로 테스트를 진행
3. 그에 맞는 서비스 처리 방안 대응 계획서 작성

---

# 효율성 및 관리 지표

## 정합성

> 해당 내용은 문제 파악성 및 어떠한 정보를 취득해야 하는 지에 대해서 작성하였으며,
따라서 해당 정합성을 파악하기 어렵습니다.
> 

## 효율성

> 효율성의 공식은 운영에 반영한 데이터를 토대로  공식을 구했으며,
사람 손수 작업하는 작업을 통해서 오차 범위가 발생하기 때문에 오차 범위를 줄이고자 
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
| 시간 기반 효율성 | - | - | - | - |
| 비용 기반 효율성 | - | - | - | - |
| 자원 기반 효율성 | - | - | - | - |
| 목표 기반 효율성 | - | - | - | - |
| 정확성 | - | - | - | - |


💡 **GPT** **해석 요약**

- 장애에 대한 이슈로 인해서 효율성 공식을 구할 수 없습니다.

# 개발 추가 보안점

> 현재까지 존재하지 않음


## 참고 자료 및 기타 내용

1. 타 블로그 내용 - [JVM 소개](https://freeman98.tistory.com/entry/JavaIBM-JVM-%EC%86%8C%EA%B0%9C-Oracl-JVM-%EA%B3%BC-%EB%B9%84%EA%B5%90)
2. 타 블로그 내용 - 내용1. [자바 Heap 메모리 관리](https://jihyunhillcs.tistory.com/38)
    내용2. [Heap 영역과 GC(Garbage Collector)](https://gitsu.tistory.com/34)

3. 타 블로그 내용 - [간헐적 메모리 장애](https://thalals.tistory.com/465)
4. 공식 Quartz Scheduler 저장소 - 내용1. [Quartz-Scheduler](https://github.com/quartz-scheduler/quartz?utm_source=chatgpt.com)
    
    내용2. [Quartz-Scheduler_Ver2.3.1 메모리 부족 Quartz가 중지되는 토론주제](https://github.com/quartz-scheduler/quartz/issues/541?ysclid=lzasmvvwdk305950048&utm_source=chatgpt.com)
    

[🔎 커널에서 oom killer windows server에서는? - Google Search](https://www.google.com/search?q=%EC%BB%A4%EB%84%90%EC%97%90%EC%84%9C+oom+killer+windows+server%EC%97%90%EC%84%9C%EB%8A%94%3F&oq=%EC%BB%A4%EB%84%90%EC%97%90%EC%84%9C+oom+killer+windows+server%EC%97%90%EC%84%9C%EB%8A%94%3F&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIKCAEQABiiBBiJBTIHCAIQABjvBTIKCAMQABiABBiiBDIKCAQQABiiBBiJBTIKCAUQABiABBiiBNIBCDU2ODBqMGo0qAIAsAIB&sourceid=chrome&ie=UTF-8)