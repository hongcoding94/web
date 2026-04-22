# [Quartz Scheduler 下] NTP 시간 변경으로 인한 Quartz 스케줄러 특정 Job 미실행 장애 예방 방안

진행 상황: 최종완료
최종 업데이트 시간: 2026년 2월 21일 오후 01:43
개발 상태: 보고 완료
기술 타입: JAR, Quartz, Shell
영향도: 上
이슈 여부: 이슈 해결 성공

# 배경

<aside>
💡

「Service Memory Issu」 에서 말했던 **“특정 Job만 실행이 안되는 경우”**의 원인은 Memory 이슈가 아닌 것으로 확인 되었음.

**“다른 원인이 무엇인가?”**를 확인하는 차에 발견한 내용과 그것에 따른 예방 방안에 대해서 설명하고자 한다. 

「Service Memory Issu」 를  읽고 오지 않은 분을 위해서 간략하게 이야기 하자면

스케쥴링 된 작업이 특정 Job이 실행되지 않는 이슈에 대해서 다루었습니다.

</aside>

## 우선 NTP와 Quartz Scheduler이 무엇인가 알고가자.

### NTP ( Network Time Protocol ) 란?

<aside>
💡

쉽게 요약하자면 **“네트워크를 통해 서버의 시간을 정확하게 동기화하는 프로토콜”**이다.

</aside>

**NTP가 필요한 이유**

서버 시간은 자연스럽게 어긋남

- CPU 클럭 오차
- 가상화 환경
- 장시간 실행

**[ 핵심 ] 시간이 틀어지면?**

- 로그 시간 불일치
- 인증 토큰 오류
- **Quartz 스케줄 미실행 / 중복 실행**

**NTP 흐름도(동작 방식) 이해**

![{0EF57614-5C6E-4E3E-BC02-7FF5A267E2B8}.png](../img/project/shooting_post0004_001.png)

- 주기적으로 표준 시간 서버와 동기화
    - 오차를 점진적으로 보정 (slew)
    - 경우에 따라 **시간을 순간 이동(step)** 시키기도 함

### Quartz Scheduler 란?

<aside>
💡

쉽게 요약하자면 **Quartz Scheduler는 Java 기반의 “정밀한 작업 스케줄링 엔진”**이라 보면 된다.

(초 단위 실행, Cron, 클러스터링까지 지원)

</aside>

**Quartz가 하는 일**

- 특정 시간 / 주기마다 **Job(작업)** 실행
- 서버가 재기동돼도 스케줄 유지 가능 (DB 사용 시)
- 다수의 Job을 **병렬 실행**
- **Cron / Simple Trigger** 지원

**Quartz 흐름도(동작 방식) 이해**

```markdown
[ Scheduler ]
     ↓
[ Trigger ] ── 언제 실행할지
     ↓
[ JobDetail ]
     ↓
[ Job ] ── 실제 실행 로직
```

| 구성 요소 | 역할 |
| --- | --- |
| Scheduler | 전체 스케줄 관리 엔진 |
| Job | 실행 코드 |
| JobDetail | Job 메타정보 |
| Trigger | 실행 조건 |
| CronTrigger | Cron 기반 |
| SimpleTrigger | 주기 기반 |

**Quartz강점과 실무에서 사용하는 이유**

1️⃣ 초 단위 스케줄링

- Spring `@Scheduled` → 최소 분 단위 ❌
- Quartz → **1초 단위 가능**

2️⃣ 정교한 Cron

```
0 0/5 * * * ?   (5분마다)
0/1 * * * * ?   (1초마다)

```

3️⃣ 장애 복구

- 서버 재기동
- 시간 변경
- Misfire 처리 가능

| 상황 | 이유 |
| --- | --- |
| 배치 시스템 | 정확한 실행 시간 |
| 금융/정산 | 초 단위 정밀도 |
| 대량 Job | 병렬 실행 |
| 장애 대응 | 재시도 / 미실행 감지 |

### [ 핵심 ] Quartz + NTP에서 발생하는 문제

여기서 다루는 핵심 요약은 아래와 같으며 【 분석 】의 내용에 자세하게 설명하도록한다.

**시간 점프(Time Jump)**

| 상황 | 영향 |
| --- | --- |
| 시간이 앞으로 점프 | Job 여러 개 연속 실행 |
| 시간이 뒤로 점프 | Job 영원히 미실행 |

**시간 점프에 대한 이해를 돕기 위한 설명**

```markdown
13:28 이전 정상 실행 Job
↓
13:28:20 전후 NTP 시간 보정 발생
↓
Quartz 기준 nextFireTime(13:29)가 도래하지 않음
↓
Misfire 조건 미충족 + DO_NOTHING
↓
Job 미실행
```

---

# 분석

## 문제가 발생한 로그 분석

기존에 GC Heap Memory 가 원인이라 추출을 하였지만, 이제 볼 로그를 바탕으로 내용을 정리하다가 보니 다른 영역에서 문제가 발생한 것으로 파악이 되었다.

「Service Memory Issu」에서 작업한 GC Heap Memory 로그 개발로 해당 문제가 발생한 특정 시간에 대한 GC Heap Memory 로그 발췌

> **정상적이라 판단한 GC 로그**
> 

문제가 발생 이후 서비스 재기동을 통해서 정상적인 GC 로그 발췌 영역

```bash
14:26:47[gc,start ] GC(18827) Pause Young (Normal) (G1 Evacuation Pause) 
14:26:47[gc,task ] GC(18827) Using 13 workers of 13 for evacuation 
14:26:47[gc,phases ] GC(18827) Pre Evacuate Collection Set: 0.0ms 
14:26:47[gc,phases ] GC(18827) Evacuate Collection Set: 3.0ms 
14:26:47[gc,phases ] GC(18827) Post Evacuate Collection Set: 1.3ms 
14:26:47[gc,phases ] GC(18827) Other: 0.3ms 
14:26:47[gc,heap ] GC(18827) Eden regions: 302->0(302) 
14:26:47[gc,heap ] GC(18827) Survivor regions: 5->5(39) 
14:26:47[gc,heap ] GC(18827) Old regions: 36->36 
14:26:47[gc,heap ] GC(18827) Humongous regions: 0->0 
14:26:47[gc,metaspace ] GC(18827) Metaspace: 31954K(33280K)->31954K(33280K) NonClass: 28911K(29952K)->28911K(29952K) Class: 3042K(3328K)->3042K(3328K) 
14:26:47[gc ] GC(18827) Pause Young (Normal) (G1 Evacuation Pause) 339M->37M(514M) 4.750ms 
14:26:47[gc,cpu ] GC(18827) User=0.03s Sys=0.00s Real=0.01s
```

> 비정상적이라 의심한 GC 로그
> 

문제가 발생한 시간 (약 1시간) 정도 특정 GC 로그 발췌 영역

```bash
13:28:20[gc,start ] GC(19208) Pause Young (Concurrent Start) (G1 Evacuation Pause) 
13:28:20[gc,task ] GC(19208) Using 13 workers of 13 for evacuation 
13:28:20[gc,phases ] GC(19208) Pre Evacuate Collection Set: 0.1ms 
13:28:20[gc,phases ] GC(19208) Evacuate Collection Set: 2.6ms 
13:28:20[gc,phases ] GC(19208) Post Evacuate Collection Set: 1.1ms 
13:28:20[gc,phases ] GC(19208) Other: 0.5ms 
13:28:20[gc,heap ] GC(19208) Eden regions: 303->0(303) 
13:28:20[gc,heap ] GC(19208) Survivor regions: 4->4(39) 
13:28:20[gc,heap ] GC(19208) Old regions: 38->38 
13:28:20[gc,heap ] GC(19208) Humongous regions: 0->0 
13:28:20[gc,metaspace ] GC(19208) Metaspace: 31954K(33280K)->31954K(33280K) NonClass: 28911K(29952K)->28911K(29952K) Class: 3042K(3328K)->3042K(3328K) 
13:28:20[gc ] GC(19208) Pause Young (Concurrent Start) (G1 Evacuation Pause) 342M->39M(514M) 4.315ms 
13:28:20[gc,cpu ] GC(19208) User=0.03s Sys=0.00s Real=0.00s 
13:28:20[gc ] GC(19209) Concurrent Cycle 
13:28:20[gc,marking ] GC(19209) Concurrent Clear Claimed Marks 
13:28:20[gc,marking ] GC(19209) Concurrent Clear Claimed Marks 0.039ms 
13:28:20[gc,marking ] GC(19209) Concurrent Scan Root Regions 
13:28:20[gc,marking ] GC(19209) Concurrent Scan Root Regions 0.974ms 
13:28:20[gc,marking ] GC(19209) Concurrent Mark (8792725.792s) 
13:28:20[gc,marking ] GC(19209) Concurrent Mark From Roots 
13:28:20[gc,task ] GC(19209) Using 3 workers of 3 for marking 
13:28:20[gc,marking ] GC(19209) Concurrent Mark From Roots 8.912ms 
13:28:20[gc,marking ] GC(19209) Concurrent Preclean 13:28:20[gc,marking ] GC(19209) Concurrent Preclean 0.162ms 
13:28:20[gc,marking ] GC(19209) Concurrent Mark (8792725.792s, 8792725.801s) 9.170ms 
13:28:20[gc,start ] GC(19209) Pause Remark 
13:28:20[gc,stringtable] GC(19209) Cleaned string and symbol table, strings: 15553 processed, 0 removed, symbols: 73304 processed, 0 removed 
13:28:20[gc ] GC(19209) Pause Remark 40M->40M(514M) 6.558ms 
13:28:20[gc,cpu ] GC(19209) User=0.07s Sys=0.00s Real=0.01s 
13:28:20[gc,marking ] GC(19209) Concurrent Rebuild Remembered Sets 
13:28:20[gc,marking ] GC(19209) Concurrent Rebuild Remembered Sets 3.910ms 
13:28:20[gc,start ] GC(19209) Pause Cleanup 13:28:20[gc ] GC(19209) Pause Cleanup 40M->40M(514M) 0.331ms 
13:28:20[gc,cpu ] GC(19209) User=0.00s Sys=0.00s Real=0.00s 13:28:20[gc,marking ] GC(19209) Concurrent Cleanup for Next Mark 
13:28:20[gc,marking ] GC(19209) Concurrent Cleanup for Next Mark 1.446ms 13:28:20[gc ] GC(19209) Concurrent Cycle 23.736ms
```

두 개의 로그를 봤을 때 정상적인 로그와 비정상적이라고 볼 수 있지만,  실제 **두 로그는 정상적인 로그**입니다.

GC Heap Memory문제가 아니라면 어디서 문제가 발생하였는가?  

로그의 차이점을 보면서 확인을 했을 때 아래의 내용과 그래프를 도출할 수 있었습니다

### GC 로그를 통한 분석 내용

<aside>
💡

해당 내용의 분석은 “[fastThread.io](https://fastthread.io/)”와 “[heaphero.io](https://heaphero.io/)”, “[gceasy.io](https://gceasy.io/gc-index.jsp)”을 사용하여 분석내용을 도출 하였습니다.

</aside>

> **정상 동작으로 판단한 GC 로그 - GC(18827)**
> 
- GC 유형: **Pause Young (Normal)**
- GC 알고리즘: **G1 GC**
- 힙 사용량 변화:
    - GC 전: **339MB**
    - GC 후: **37MB**
- GC 중단 시간(Pause Time): **약 4.75ms**
- Old 영역 증가 없음
- Metaspace 사용량 변화 없음

> **비정상 동작으로 의심된 GC 로그 - GC(19208)  GC(19209)**
> 
- GC 유형:
    - Pause Young (Concurrent Start)
    - Concurrent Cycle
- GC 알고리즘: **G1 GC**
- 힙 사용량 변화:
    - GC 전: **342MB**
    - GC 후: **39MB**
- GC 중단 시간:
    - Young GC: **약 4.3ms**
    - Remark 단계: **약 6.5ms**
- Concurrent Mark / Cleanup 정상 종료
- Old 영역, Metaspace 변화 없음

> **정상 동작으로 판단한 GC 로그 분석 - GC(18827)**
> 

### 힙 메모리 관점

- Eden 영역에 생성된 객체가 Young GC를 통해 정상적으로 회수됨
- Survivor, Old 영역으로의 비정상적인 승격 없음
- 메모리 누수 또는 Full GC 징후 없음

### GC 성능 관점

- Stop-The-World 구간이 5ms 이내로 매우 짧음
- CPU 사용량(User/Sys) 낮음
- 애플리케이션 처리에 영향을 줄 수준의 GC 지연 없음

📌 **결론:**

정상 GC 로그는 JVM 메모리 관리가 안정적으로 동작하고 있음을 보여준다.

> **비정상 동작으로 의심된 GC 로그 분석 - GC(19208)  GC(19209)**
> 

### GC 동작 특성

- Concurrent Cycle은 Old 영역 사용률 증가에 따라 **정상적으로 트리거됨**
- Concurrent Mark, Remark, Cleanup 단계가 모두 짧은 시간 내 종료
- Stop-The-World 구간 역시 10ms 미만으로 안정적

### 주의 깊게 본 포인트

- 로그 상 “Concurrent Start” 문구로 인해 비정상처럼 보일 수 있으나,
    
    이는 G1 GC의 **정상적인 Old 영역 마킹 사이클 시작**을 의미함
    
- GC 수행 중 힙 사용량 급증, 스레드 정지, 장시간 중단 현상 없음

📌 **결론:**

비정상으로 보였던 GC 로그 또한 **정상적인 G1 GC 동작 범위 내**에 있음.

### GC 로그 비교 요약

| 구분 | 정상 로그 | 비정상 의심 로그 |
| --- | --- | --- |
| GC 유형 | Young GC | Young + Concurrent GC |
| Pause Time | 약 4.7ms | 최대 약 6.5ms |
| Old 영역 증가 | 없음 | 없음 |
| Metaspace 변화 | 없음 | 없음 |
| GC 이상 징후 | 없음 | 없음 |

### GC 로그를 통한 그래프

**GC 유형별 중단 시간 비교**

![image.png](../img/project/shooting_post0004_002.png)

**X축**

GC ID - 시간 순서

**Y축**

GC 중단 시간(ms)

**범례**

정상  Young GC

Concurrent GC (Concurrent Start / Concurrent Cycle)

**정상 GC Heap Memory 변화**

![image.png](../img/project/shooting_post0004_003.png)

**X축**

GC ID - 시간 순서

**Y축**

Heap Memory사용량 (MB)

**범례**

GC 이전 Heap Memory

GC 이후 Heap Memory

**Concurrent GC Heap Memory 변화**

![image.png](../img/project/shooting_post0004_004.png)

**X축**

GC ID - 시간 순서

**Y축**

Heap Memory사용량 (MB)

**범례**

GC 이전 Heap Memory

GC 이후 Heap Memory

위 그래프와 내용을 종합적으로 분석 하게 된다면, 아래와 내용을 유추 할 수 있습니다.

**「GC는 정상 범위 내에서 수행되었으며, GC로 인한 서비스 정지나 Quartz Job 미실행을 유발할 만한 징후는 확인이 어렵다.」**따라서 장애 원인에서 제외

왜 **「논리적 스케줄 장애」라고 판단 했는가?** 발생 원인을 다시 한번 생각해보면 다음과 같은 결과를 도출 할 수 있었습니다.

**이전 발생 원인을 추측 했던 내용**

1. ~~GC Heap Memory 혹은 특정 자원이 고갈 되어 발생하는 문제~~  [ 위 내용을 통해서 문제없음을 확인 ]
2. ~~Delete Log( 개인정보보호법 관련된  데이터 삭제 )  대량 데이터 삭제로 인한 Long time Connection(Thread) 문제인것인가?~~ [ 테스트 결과 : 200만건 삭제 방식으로 진행 문제 없음 ]
3. ~~CPU 과점유로 인한 Job이 종료되지 않고 뫼비우스 띠 같은무한 루프상태~~ [위 테스트 결과와 동일]
4. GC 로그에서는 정상적으로 실행되었지만 Quartz의 **여러 개의 Job 중 단 한 개의 Job만 미 실행을 유발**하는 징후
5. 무분별한 시간 때가 아닌 **특정 패턴의 성향을 보이는 시간 때의 경우 발생**

**기존 발생한 현상의 내용**

1. JVM 관점
    - Thread 정상
    - GC 정상
    - Memory 정상
2. Quartz 관점
    - **특정 Job만 미실행**
    - **Scheduler Loop는 정상**

이러한 정황을 토대로 장애는 GC Heap Memory의 자원 부족이 아닌 시간 기반 스케줄 계산 로직에 발생한 논리적 스케줄 장애로 판단 하였습니다.

## Quartz와 NTP이 “동작 / 보정”하는 과정

<aside>
💡

현재 Quartz Scheduler 등록된 Cron이 아래와 같이 설정 되었다는 과정 아래 설명을 시작합니다

</aside>

### 설명을 위한 **Scheduler.xml Cron 예제**

- **[ 예시 ] Quartz Scheduler에 등록된 Cron 설정 값**
    
    ```xml
    <!-- 
        @SEE  해당 내용은 예제입니다.
      @MEMO 현재 예제에 보이는 Cron 값에 의문을 가지는 분들이 있으실텐데
            해당 Java에서 각각의 Job들을 Status를 통해서 관리하고 있어서 문제가 없음.
    -->
        <bean id="cronTriggerA"
              class="org.springframework.scheduling.quartz.CronTriggerFactoryBean">
            <property name="jobDetail" ref="jobDetailA"/>
            <property name="cronExpression" value="0/5 * * * * ?"/>
            <property name="timeZone" value="Asia/Seoul"/>
            <property name="misfireInstructionName" value="MISFIRE_INSTRUCTION_DO_NOTHING"/>
        </bean>
    
        <bean id="cronTriggerB"
              class="org.springframework.scheduling.quartz.CronTriggerFactoryBean">
            <property name="jobDetail" ref="jobDetailB"/>
            <property name="cronExpression" value="0/1 * * * * ?"/>
            <property name="timeZone" value="Asia/Seoul"/>
            <property name="misfireInstructionName" value="MISFIRE_INSTRUCTION_DO_NOTHING"/>
        </bean>
    
        <bean id="cronTriggerC"
              class="org.springframework.scheduling.quartz.CronTriggerFactoryBean">
            <property name="jobDetail" ref="jobDetailC"/>
            <property name="cronExpression" value="0/1 * * * * ?"/>
            <property name="timeZone" value="Asia/Seoul"/>
            <property name="misfireInstructionName" value="MISFIRE_INSTRUCTION_DO_NOTHING"/>
        </bean>
    ```
    

### 정상 동작 타임 라인 & 장애 발생 타임 라인

※ 해당 내용은 예시이며 읽는 독자에게 이해하기 편하도록 나열한 것임을 밝힙니다.

- **정상 동작 타임 라인**
    
    ![{0F2124C0-72B0-4B95-A73A-F30F63B77E5C}.png](../img/project/shooting_post0004_005.png)
    
    정상적으로 실행 되어 실행되는 구간에서는 문제가 없음으로 생략하도록하겠습니다.
    

- **장애 발생 타임 라인 - NTP 시간 보정 성공**
    
    ![{39920114-616B-4898-8607-4A378F6D58D0}.png](../img/project/shooting_post0004_006.png)
    
    여기서 「NTP 시간 보정 : 성공」이라고 말하였지만,  만약 여기서 NTP 시간 보정이 성공했습니다. 하면 수 많은 질문들을 융단 폭격 맞을 수도 있기 때문에 
    
    반드시 **“정확한 표현은 시스템 시간이 slew 방식을 통해서 점진적으로 보정 되어서 Quartz Scheduler의 Trigger 시간 계산에 영향을 주지 않았습니다.“** 
    
    즉, Quartz의 `현재 시간(now) ≥ 다음 실행 시간(nextFireTime)`  조건을 정상적으로 만족 시켰으며, 결과적으로Cron Trigger의 실행에는 영향 없으며 모든 Job이 정상적으로 실행되었다.
    

- **장애 발생 타임 라인 - NTP 시간 보정 실패**
    
    ![{956EA739-15B9-43A6-9AEA-F034A01A70C0}.png](../img/project/shooting_post0004_007.png)
    
    여기서「NTP 시간 보정 : 실패」과 동시에 이후 미실행에 대해서 중점적으로 봐야 한다. 
    
    이 말은 즉, **“시간이 순간적으로 과거로 이동 했다”**라는 의미로 해석해야 된다.
    
    Quartz Time Trigger는 10:00:04로 예약을 걸어 놨지만, Network Time Protocol은 이미 10:00:04 이상으로 지나갔음을 의미하며 Quartz에서는 이미 실행 시간이 안 되었다라 판단한다.
    
    이후 NTP 시간 보정 조차 하지 않고 **특정 Job이 대기 상태로 무한 대기로 인하여 미실행** 되는 것이다.
    

---

# 해결 방안

### 1. Quartz Scheduler 中 Cron의 값 수정

- 장점
    - Quartz 스케줄러 특정 Job 미실행 장애 예방
    - 해결 방안 제시안 中 가장 빠른 방식으로 대응이 가능함 
    다만, 성능이 떨어짐에 따른 고객(Client) 클레임이 들어올 가능성이 농후함
- 단점
    - 기존 성능에 비해서 성능이 낮아짐 - 발송량이 현저히 줄어들게됨
        
        >EX) 변경전 - 기존 1분에 10만개 발송 / 변경 후 - 1분에 6만개 발송
        

### 2. DB기반의 JobS**torage 개발 및 구축**

**※ Queue 방식과는 다른 방식임을 인지 해야합니다.**

- 장점
    - Job 하나하나에 실행 이력 추적 가능
    - 특정 Job의 미실행 여부 감지 가능
- 단점
    - 개발 소요시간이 많이 필요함 - ( 최소 인력 2명 )
        - 필수 범위와 운영 시 고려 범위를 고려해야 한다
            
            
            <aside>
            💡
            
            Quartz가 멈추거나 Job이 누락돼도 **발송은 “언젠가는” 반드시 처리된다**
            
            </aside>
            
            **필수 범위**
            
            - Quartz JobStoreTX 설정
            - Quartz 기본 테이블 생성/관리
            - Job / Trigger 등록
            - Cron 스케줄 관리
            - Misfire 정책
            - 타임존 고정
            
            <aside>
            💡
            
            발송은 되지만 **운영 사고로 번지지 않게 한다**
            
            </aside>
            
            **운영 시 고려 범위**
            
            - Job 실행 이력 저장
            - 미실행 / 중복 실행 감지
            - 장애 시 재기동 안전성
            - NTP 시간 변경 대응
            - 로그/모니터링
            
    - **고객(Client)에 심어야 하는 프로그램 서비스 혹은 데모임으로 고객(Client)사에서 요청을 받아 줄지 확인이 필요.**

### 3. Quartz + NTP 설정 변경

- 장점
    - 해결 방안 제시안 中 가장 빠른 방식으로 대응이 가능함 
    다만, 해결 방식에 대해서 전체적으로 보장하지 않는다.
- 단점
    - 데이터 발송 유실 혹은 중복 발송이 존재할 수도 있음
        
        > 유실 방지 혹은 중복발송등 많은 추가적인 문제점을 유발할 수 있음 **( 정확한 단발성으로 보내야 하는 발송에서는 문제가 많음 )
         - 해결 방안 :  중복 발송을 막기 위한 테이블 설계 구조를 변경해야 한다.** 
        
        위에 문제를 해결하기 위해서는 현재 제공되는 Query를 수정 후 LG CNS 서버에서 처리 구조 변경이 필요 - **( 현실적으로 불가능 )**

### 4. OS 레벨 감시 기반 자가 복구 서비스 or 데몬

- 장점
    - DB 구조 변경 없이 도입 가능
    - 빠른 구축
    - 운영자가 이해하기 쉬움
    - “죽어있는 서비스”는 거의 제거
- 단점
    - 개발 소요 시간이 많이 필요함 / 프로젝트 단위로 새로 개발을 요청이 필요 - ( 최소 인력 3명 )
        - 필수 범위와 운영 시 고려 범위를 고려해야 한다.
            
            
            <aside>
            💡
            
            **“죽은 Job / 멈춘 서비스는 반드시 다시 살아나게 한다”** → 최소 목표 : **발송 중단 방지**
            
            </aside>
            
            > **필수 범위**
            > 
            > - **Quartz Job 기본 설계**
            >     - Job 시작 / 종료 / 실행시각 / 식별자 로그 기록
            > - **로그 기준 상태 판단 체계**
            >     - 로그 파일 경로 표준화
            >     - Job별 로그 패턴 통일
            >     - 실행 실패 / 미실행 판단 기준 정의
            > - **OS 감시 스크립트**
            >     - 실행 주기
            >     - 서비스 프로세스 실행 여부
            >     - 최근 Job 실행 시각 확인
            >     - 기준 시간 초과 시 “이상 상태” 판단 - **장애의 기준 값 정의**
            > - **자동 재기동 로직**
            >     - Java 서비스 재기동 기능
            >     - 재기동 성공 여부 확인
            >     - 재기동 후 정상 로그 확인
            >     
            
            <aside>
            💡
            
            “자동 복구는 되지만, **운영 사고로 이어지지 않게 한다”**
            
            </aside>
            
            > **운영 시 고려 범위**
            > 
            > - **중복 실행 방지**
            >     - 재기동 후 Job 중첩 실행 방지
            >     - Job 내부 Lock (DB or File)
            >     - 일정 시간 내 재기동 횟수 제한
            > - **알림 / 가시성**
            >     - 재기동 발생 시 운영 담당자에게 알림
            >     - 장애 발생 로그 생성
            >     - 운영자 확인 가능 로그 생성
            > - **시간 관련 리스크 대응**
            >     - NTP 시간 변경 감지
            >     - 시간 점프 발생 시 감시 로직 보정
            >     - 시간 역행 시 오탐 방지
            > - **장애 시나리오 테스트**
            >     - 서비스 강제 종료 테스트
            >     - 로그 누락 테스트
            >     - OS 리부트 테스트
            > - **운영 문서화**
            >     - 장애 대응 매뉴얼 ( 로그 해석 방법 포함 )
            >     - 재기동 기준 설명
            >     - 운영자 체크리스트
    - **고객(Client)에 심어야 하는 추가 프로그램 서비스 혹은 데모임으로 고객(Client)사에서 요청을 받아 줄지 확인이 필요**
    - **고객(Client)사의 상주 요청이 있을 수도 있음** - **( 현실적으로 불가능 )**

---

# 결론

## Quartz와 NTP의 한 줄 요약

<aside>
💡

**Quartz**는 **“언제 실행할지”**를 관리하고 **NTP**는 **“지금이 몇 시인지”**를 맞춘다

</aside>

### NTP와 Quartz 간 충돌

**문제 원인 요약**

Quartz가 NTP에 의해 시간 변화로 인해 다음과 같은 문제 발생

- **시간 이동으로 인해 Trigger가 과거로 밀림**
- Misfire 정책에 따라 **Job이 실행 누락되거나 즉시 집약적 실행**됨
- 서버 간 시간 차이로 **클러스터 간 작업 불균형이 발생** - [[ 참조 문헌 ]](https://stackoverflow.com/questions/9998618/quartz-scheduler-cluster-time-sync?utm_source=chatgpt.com)

**해결 방안**

해결 방안 참조

### 방향성

Quartz와 NTP 문제는 시간 동기화 자체가 가져오는 **본질적인 특성**으로 완전히 무시할 수 없다.

**현실적인 방향성**

1. **DB 설계 구조 재설계  → 누락 방지**
2. **Misfire 정책 설정 → 시간 문제에 대한 예측 동작**
3. **OS 감시 + 자동 재기동 → 서비스 생존성 보완**

---

# 효율성 및 관리 지표

## 정합성

> 해당 내용은 문제 파악성임으로 실제 개발이 적용되지 않았음.
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

1. fastthread.io - [GC Heap Memeory](https://fastthread.io/)
2. heaphero.io - [GC Heap Memeory](https://heaphero.io/)
3. gceasy.io - [GC Heap Memeory](https://gceasy.io/gc-index.jsp)
4. Stack Overflow - [**Quartz Scheduler Cluster Time Sync**](https://stackoverflow.com/questions/9998618/quartz-scheduler-cluster-time-sync?utm_source=chatgpt.com)