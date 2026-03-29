# JDK 상위 버전 마이그레이션 시 Windows 서비스 등록 불가로 인한 대처 방안

진행 상황: 최종완료
최종 업데이트 시간: 2026년 2월 21일 오후 7:38
개발 상태: 개발 완료
기술 타입: OS, Shell, 백그라운드 프로세스(Service)
영향도: 下
이슈 여부: 이슈 해결 성공

# 배경

<aside>
💡

JDK SE 8을 사용하여 **에이전트 운영 고객사의 특수성으로 인한 JDK 21 / 25 호환 버전을 요청 하여 개발 과정 중**
에이전트 제공하던  Windows 서비스(백그라운드에서 자동으로 실행을 도와주는 프로그램)의 호환성 문제로 JavaService.exe를 제거하고 NSSM.exe로 변경하는 작업

</aside>

---

# 분석

- 왜 데몬이라 지칭 하지 않고 서비스라는 단어를 사용했는가? **데몬(Daemon)와 서비스(Service)의 차이를 알아보자.**

**같은 점**: 백그라운드, 장기 실행, 자동 시작, 로그 기반 모니터링

**다른 점**: OS 환경, 제어 방식, 종료 처리 방식, 개발/등록 방법

- **정의**
    
    
    | **구분** | **데몬 ( Daemon )** | **서비스 ( Service )** |
    | --- | --- | --- |
    | **정의** | 백그라운드에서 지속적으로 실행되는 프로세스 | OS에서 관리되는 장기 실행 프로그램 |
    | **실행 방식** | 주로 Linux/Unix 환경, init/systemd 등으로 시작 | 주로 Windows 환경, Service Control Manager(SCM) 관리 |
    | **목적** | 시스템 기능, 백그라운드 작업 지원 (ex: cron, sshd) | 특정 애플리케이션/서비스 제공 (ex: DB, Web Server) |
    
    **데몬 ( Daemon)**
    
    ![Linux Daemon 안에 JVM의 모션 및 제어 방식](../img/project/shooting_post0002_001.png)
    
    Linux Daemon 안에 JVM의 모션 및 제어 방식
    
    **서비스 ( Service )**
    
    ![Windows Service 안에 JVM의 모션 및 제어 방식](../img/project/shooting_post0002_005.png)
    
    Windows Service 안에 JVM의 모션 및 제어 방식
    

- **공통점**
    - **백그라운드 실행**
        - 둘 다 사용자와 직접 상호 작용하지 않고, 시스템 백그라운드에서 동작
    - **장기 실행 목적**
        - 종료되지 않고 지속적으로 실행
    - **자동 시작 가능**
        - OS 부팅 시 자동으로 시작 가능 (init, systemd, Windows SCM)
    - **로그 기반 모니터링 필요**
        - UI가 없기 때문에 상태 확인은 로그 또는 상태 명령어를 통해 수행
- **차이점**
    
    
    | **구분** | **데몬 ( Daemon )** | **서비스 ( Service )** |
    | --- | --- | --- |
    | **운영체제** | Linux/Unix 계열 중심 | Windows 중심 |
    | **제어 방식** | kill, systemctl, init 스크립트 | sc 명령어, Windows 서비스 관리자 |
    | **JVM 적용** | jsvc를 통해 Java 프로세스를 데몬으로 실행 가능 | JavaService Wrapper, NSSM 등으로 Windows 서비스 등록 가능 |

- 고객(Client)사로 제공 되고 있는 운영 체제 및 JDK 지원 현황
    
    > 카카오톡 브랜드메시지 2026년 01월 01부터 친구톡이 없어지며, 새로운 명칭인 **“브랜드메세지”**으로서  제공 예정
    > 
    - 현재 운영 서비스
        
        
        ### Windwos
        
        - JDK1.6 - 지원 종료 中
            - Agent 3.0
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 친구톡 제공`
                
        - JDK SE 8 ( JDK 1.8 )
            - Agent 3.0
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 친구톡 제공`
                
            - Agent 3.1
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 친구톡 제공`
                
            - Agent 3.2
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 친구톡 제공`
                
            - Agent 3.3
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 친구톡 제공`
                
                `RCS 기능 제공`
                
        
        ### Linux
        
        - ~~JDK1.6~~ 공식 지원 종료
        - JDK SE 8 ( JDK 1.8 )
            - Agent 3.0
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 친구톡 제공`
                
            - Agent 3.1
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 친구톡 제공`
                
            - Agent 3.2
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 친구톡 제공`
                
            - Agent 3.3
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 친구톡 제공`
                
                `RCS 기능 제공`
                
    - 제공 예정인 서비스
        
        
        ### Windwos
        
        - JDK 21 [ 테스트 배포 완료 / 2026년 1월 운영 지원 예정 ]
            - Agent 4.0
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 브랜드메시지 제공`
                
                `RCS 기능 제공`
                
                `네이버톡톡 기능 제공`
                
        - JDK 25 [ 테스트 배포 완료 / 2026년 1월 운영 지원 예정 ]
            - Agent 4.0
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 브랜드메시지 제공`
                
                `RCS 기능 제공`
                
                `네이버톡톡 기능 제공`
                
        
        ### Linux
        
        - JDK 21 [ 테스트 배포 완료 / 2026년 1월 운영 지원 예정 ]
            - Agent 4.0
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 브랜드메시지 제공`
                
                `RCS 기능 제공`
                
                `네이버톡톡 기능 제공`
                
        - JDK 25 [ 테스트 배포 완료 / 2026년 1월 운영 지원 예정 ]
            - Agent 4.0
                
                `문자 SMS MMS LMS 제공`
                
                `카카오톡 알림톡 브랜드메시지 제공`
                
                `RCS 기능 제공`
                
                `네이버톡톡 기능 제공`
                

- 고객(Client)사가 JDK SE 8에서 JDK21 or JDK25로 업데이트 하는 이유
    
    <aside>
    💡
    
    **※ 고객사 요청으로 인해서 개발을 진행하였지만, 심도 있게 고민을 해봐야 한다고 생각합니다.**
    
    1. 비용 절감의 관점 (인프라 & 유지보수)
    **JDK 21은 JDK 8 대비 메모리 처리 효율(G1GC 개선, ZGC 도입)과 처리량이 압도적으로 높기 때문**에 같은 트래픽을 처리하는데 사용되는 각각의 서버 (인스턴스)와 사양을 낮출 수 있으며,  그에 따른 비용의 감소가 되어 프로젝트 유지에 도움이 된다 예측합니다.
    멀리 내다 보게 된다면, 노후화 된 레거시 유지를 위해 향후 인재에 확보에 대한 유지 보수 비용이 더 많이 나올 수 있습니다.
        
        
    2. 생태계 고립 탈출 (서비스 안정성)
    현재 특정 도메인을 제외한 대부분의 도메인들에서는 Spring3.x와 DBMS을 사용하기 위해서 JDK SE 8버전을 지원하지 않는 케이스들이 많이 보이고 있습니다. 
    따라서 현재 JDK SE 8버전을 계속 유지하게 되었을 때 **“라이브러리의 중단”, “DBMS 연동 불가”, “보안”, “트래픽 성능 개선”등 많은 문제가 발생** 할 수 있으며,
    시스템에 지속 가능성이 불가 하여 서비스를 중단하는 상황까지 발생할 것으로 생각합니다.
    </aside>
    
    1. 고객(Client)사 서버 구축을 JDK21 혹은 JDK25로 처리하는 이유
        
        고객(Client)사에 제공되는 타 서비스 제품들이 JDK21 혹은 JDK25로 지원 함으로써, 비용 절감의 이유로 버전으로 넘어가지 않을 이유가 없을 것으로 생각된다.
        
    2. DBMS의 주된 차이로 인하여 Oracle과 Mysql을 통한 JDK21과 JDK25를 사용하는 이유에 대해서
        
        
        |  | Oracle 11g (구형/지원 종료) | Oracle 19c (Long Term Support, LTS) | Oracle 21c (최신/혁신 릴리즈) |
        | --- | --- | --- | --- |
        | 지원 | 공식 기술 지원 종료 | **장기 기술 지원 (LTS)** 제공. 안정적인 보안 및 버그 수정. | **혁신 릴리즈(Innovation Release)**. 최신 기능이 빠르게 도입됨 (단, 지원 기간은 LTS 버전보다 짧음). |
        | 아키텍처 | 주로 전통적인 단일 인스턴스 구조. | **멀티테넌트(Multitenant) 아키텍처 (CDB/PDB)**: 관리 효율성과 리소스 공유에 유리하며 클라우드 환경에 최적화됨. | **멀티테넌트(Multitenant) 강제** (CDB/PDB). 클라우드 환경 및 관리 효율성 극대화. |
        | 성능/자동화 | 기본적인 자동화 기능. | **자동 인덱싱 (Automatic Indexing)**: 머신러닝 기반 인덱스 자동 생성 및 조정으로 성능을 지속적으로 개선. | **자동 인덱싱(Automatic Indexing)**: 머신러닝 기반으로 인덱스를 자동 관리하여 성능을 지속적으로 최적화. |
        | 데이터 유형 | 기본적인 SQL 및 XML 지원. | **쿼리 격리 (Query Quarantine)**: 리소스를 과도하게 소모하는 쿼리를 자동으로 차단하여 시스템 안정성 보장. | **블록체인 테이블(Blockchain Tables)**: 데이터가 위변조되지 않도록 보호하는 기능. **네이티브 JSON(Native JSON)** 지원 강화. |
        | In-Memory | 부분 지원. | **JSON 데이터 유형 강화 및 지원**: JSON 데이터를 DB 내에서 효율적으로 처리하고 변경할 수 있음. | **In-Memory 기능 강화**: 데이터베이스 내 메모리 영역에서 데이터 분석 및 쿼리 속도 대폭 향상. |
        
        <br/>

        | JDBC 드라이버 파일 | 호환되는 JDK 버전 (일부 예시) | 최소 JDK | JDBC Spec |
        | --- | --- | --- | --- |
        | ojdbc8.jar | JDK 8, 11, 17, 19, 21 | JDK 8 | JDBC 4.2 |
        | ojdbc11.jar | JDK 11, 17, 19, 21 | JDK 11 | JDBC 4.3 |
        | ojdbc17.jar | JDK 17, 19, 21 | JDK 17 | JDBC 4.3 |
        
        <br/>

        | 특징 | JDBC 4.2 (이전) | JDBC 4.3 (개선) | 설명 및 목적 |
        | --- | --- | --- | --- |
        | 모듈화 | 모듈화 지원 미흡 | 모듈 시스템 지원 | Java 9의 모듈 시스템(Jigsaw)**에 맞춰 JDBC 드라이버를 모듈로 구성할 수 있게 되어 런타임 최적화 및 의존성 관리가 용이해졌습니다. |
        | Stream API 지원 | `java.util.Stream` 미지원 | `java.util.Stream` 지원 | `ResultSet` 등에서 데이터를 스트림(Stream) 형태로 반환하는 메서드가 추가되어 **함수형 프로그래밍 방식**으로 데이터 처리 및 변환이 가능해졌습니다. |
        | 자동 Close | 연결 관리가 복잡함 | Connection 자동 닫기 | `Connection` 객체에 새로운 인터페이스(예: `Statement`, `ResultSet` 등)가 추가되어 **자동으로 리소스를 닫는 기능**이 강화되어 누수(Resource Leak) 방지 및 코드 간결화에 도움이 됩니다. |
        | 새로운 타입 지원 | 일부 최신 DB 타입 미지원 | 신규 데이터 타입 지원 | `java.time` API(날짜/시간) 등 Java 8 이후 추가된 타입 및 최신 데이터베이스의 신규 타입에 대한 매핑 및 지원이 강화되었습니다. |
        | Optional 반환 타입 | `Optional` 사용 미흡 | `Optional` 타입 활용 | 메서드 반환 값이 `null`일 가능성이 있는 경우 `Optional`을 사용하여 null-체크 로직을 단순화하고 안정성을 높였습니다. |

# JavaService를 사용하지 못 하는 이유와 NSSM을 채택한 이유

- 고객(Client)사의 명령 프롬프트(cmd&PowerShell) 혹은 터미널을 최소화하기 위한 shell파일 혹은 bat파일 생성 타당성
    1. 고객(Client)사의 **잘못된 실행 작업을 방지**
        
        ```powershell
        **rem 정상적인 기동**
        C:\트러블슈팅_관련_작업물\service\install>install.bat C:\Program Files\java\jre\bin\server\jvm.dll ^
          -Dfile.encoding="UTF-8" "-Xms256m" "-Xmx512m" ^
          -Djava.class.path=C:\트러블슈팅_관련_작업물\service\lib\*.jar
          -start TestMainApp -params start
          
          
        **rem 비정상적인 기동 - "실제 고객사에서 실행이 안되요"라는 CS 질문**
        C:\트러블슈팅_관련_작업물\service\install>install.bat **C:\Program Files\java\bin\javaw.exe** ^  <<<-----  잘못된 경로 처리
          -Dfile.encoding="UTF-8" "-Xms256m" "-Xmx512m" ^
          -Djava.class.path=C:\트러블슈팅_관련_작업물\service\lib\*.jar
          -start TestMainApp -params start
        ```
        
    2. Windows “서비스 관리 도구” 프로그램을 제어를 통해서 **고객(Client)불편함 방지** 및 **비개발자군이 사용성 편리**

- 현재 Windows 백그라운드에서 실행을 도와주는 (유틸리티)JavaService.exe는 사용이 불가능한가?
    
    > JavaService.exe가 무엇인지 모르는 분들을 위한 JavaService가 무엇인가?
    > 
    
    자바 애플리케이션을 **Windows 서비스로 실행할 수 있도록 해주는 오픈 소스 유틸리티**
    

> JDK 21 or JDK 25에서는 왜 JavaService.exe를 사용하지 못 하는 이유
> 

제일 큰 이슈는 JavaSevice.exe는 JDK SE 8(JDK1.8)버전의 코드를 자세하게 보면 **코드가 하드 코딩[참조. 중점적으로 봐야하는 코드]** 되어 있는 것을 확인 할 수 있으며, JDK SE 8(JDK1.8)버전까지만 있던 `tools.jar`가 존재하지 않아서 해당 JavaService.exe를 실행 시키지 못하는 것을 알 수 있습니다.

참조 주소 :  [https://github.com/robinrosenberg/javaservice](https://github.com/robinrosenberg/javaservice)

경로 : javaservice/javaservice/scripts/InstallTomcat.bat

```bash
rem .. 코드 내용 생략

**rem <중요> 중점적으로 봐야하는 코드 Start**

**SET jvmdll=%JAVA_HOME%\jre\bin\server\jvm.dll**
**if not exist** "%jvmdll%" **SET jvmdll=%JAVA_HOME%\jre\bin\hotspot\jvm.dll <<----- 하드코딩된 경로
if not exist** "%jvmdll%" **SET jvmdll=%JAVA_HOME%\jre\bin\client\jvm.dll  <<----- 하드코딩된 경로**
if not exist "%jvmdll%" goto no_java

**SET toolsjar=%JAVA_HOME%\lib\tools.jar <<----- 하드코딩된 경로
if not exist "%toolsjar%" goto no_java**

r**em <중요>중점적으로 봐야하는 코드 End**

rem check that Tomcat exists and parameter is specified
if "%2" == "" goto no_tomcat
SET TC_HOME=%2
SET TC_BIN=%2\bin
if not exist "%TC_BIN%" goto no_tomcat

rem set up version-specific values for Tomcat install
goto tcv%TC_VERS%

rem .. 코드 내용 생략
```

서비스에서 Tomcat을 띄울 수 없다면 에이전트에 필요한.jar파일들과 에이전트 로직 class파일을 빌드 할 수 있는 방법이 없습니다.

그렇다면 “JDK 최대 몇 버전까지 지원이 가능한가? “를 찾아보게 된다면, 아래와 같은 표를 볼 수 있습니다.

- **`tools.jar`의 존재 여부**
    
    
    | **버전** | **`tools.jar` 실제 파일 존재 여부** | **하위 호환성용 더미 파일** | **주요 변화 및 결과** |
    | --- | --- | --- | --- |
    | **JDK 6** | **실제 파일 존재** | 해당 없음 | 파일이 물리적으로 존재.
    당시에 표준 구조이며, 레거시 도구와 완벽하게 호환된다. |
    | **JDK 8** | **실제 파일 존재** | 해당 없음 | 파일이 물리적으로 존재하며, 레거시 도구와 정상 호환된다. |
    | **JDK 9 ~ 10** | **존재 안 함** (모듈화됨) | **존재함** (빈 파일/더미) | 경로 참조 시 파일 부재 오류는 없으나, 실제 클래스가 없어 작동은 어렵다. |
    | **JDK 11 ~ 25** | **존재 안 함** (완전 제거) | **존재 안 함** | `$JAVA_HOME/lib/tools.jar` 경로 참조 시 파일 부재 오류가 발생하며 호환되지 않는다. |
- **`jvm.dll`**의 경로
    
    
    | **버전** | **아키텍처** | **기본경로** | **결과** |
    | --- | --- | --- | --- |
    | **-** | **JavaService.exe 등록된 하드 코드 경로** | %JAVA_HOME%\jre\bin\server\jvm.dll | 정상 |
    | **JDK 6** | 64비트 (x64) | %JAVA_HOME%\jre\bin\server\jvm.dll | 정상 |
    | **JDK 6** | 32비트 (x86) | %JAVA_HOME%\jre\bin\client\jvm.dll | 정상 |
    | **JDK 8** | 64비트 (x64) | %JAVA_HOME%\jre\bin\server\jvm.dll | 정상 |
    | **JDK 8** | 32비트 (x86) | %JAVA_HOME%\jre\bin\client\jvm.dll | 정상 |
    | **JDK 9~25** | 64비트 (x64) | %JAVA_HOME%\bin\server\jvm.dll | 비정상 |
    | **JDK 9~25** | 32비트 (x86) | %JAVA_HOME%\bin\client\jvm.dll 또는 %JAVA_HOME%\bin\server\jvm.dll | 비정상 |

위 표를 보게 된다면 **JDK SE 8 버전 이하에서만 사용 가능한 것으로 확인**이 되었으며, 확인 작업을 했을 때에도 동일한  결과를 확인하였습니다.

따라서 이슈 제기를 통해서 JavaService.exe파일을 걷어내고 다른 오픈 소스 유틸리티를 통하여 “Windows 서비스”에 서비스를 등록 해야 한다 생각하였습니다.

- 현재 JavaService에서 NSSM 혹은 prunsrv 둘 중 어떤 것이 사용하는 것이 더 효율적인가?
    
    레지스트리에 필요한 값들이 추가하기 위해서는 보다 정확히 알고 사용하는 것이 중요하며, Windows 환경의 고객(Client)사의 편리성을 위해서 가장 빠르게 개발이 가능한 것이 좋다고 생각합니다.
    

---

# NSSM 관련 코드 내용 정리

<aside>
💡

**※ 관련 코드를 설명하기 전에 ‼‼**
먼저 집에서 공부와 개발한 후 회사에 제공함으로써, 회사에 귀속된 개발 내용은 전혀 없음을 밝혀드리는 바입니다. 
또한, 아래 작성되는 코드는 **회사 자원에 대한 기밀 유지 조항 사유**로 인하여 실제 서비스가 아닌 예제 코드를 적용하였으며, 회사의 코드와는 무관함을 알려드립니다.

</aside>

## as-is(javaService.exe)와 to-be(NSSM.exe) 비교

<aside>
💡

기존 JavaService.exe와 NSSM.exe 방식과 동일하지만 서로 다른 점에 대한 내용 정리

</aside>

**차이점**

NSSM과 JavaServuce 두 도구는 윈도우 운영체제에 서 특정 프로그램을 서비스 형태로 실행되도록 만들어주는 역할을 하지만,

안전성 측면과 사용 편의성, 핵심 차이점을 봤을 때 큰 차이점을 볼 수 있다.

**용도 및 범용성**

- **NSSM (Non-Sucking Service Manager):**
    - **범용성:** 자바 애플리케이션, 배치 파일, 파이썬 스크립트 등 **모든 종류의 실행 파일**을 윈도우 서비스로 등록할 수 있는 다목적 도구입니다.
- **JavaService:**
    - **특화됨:** 이름 그대로 **자바 애플리케이션 실행에만 특화**되어 있습니다. 주로 과거의 윈도우 및 JVM 환경에서 사용되었습니다.

**성능관리**

- 성능 자체는 구동되는 애플리케이션에 따라 달라지지만, **서비스의 안정적인 운영** 측면에서는 NSSM이 월등히 뛰어납니다.
    
    
    | **특징** | **NSSM** | **JavaService** |
    | --- | --- | --- |
    | **자동 복구** | **강력한 자동 재시작 및 모니터링 기능 제공** | 기본 서비스 등록 기능에 충실함 |
    | **호환성** | **최신 윈도우 OS 완벽 지원** | 최신 OS/JVM에서 호환성 문제 발생 가능성 높음 |
    | **안정성** | 시스템 안정성 및 가용성 향상에 기여 | 비호환성 문제로 불안정성 유발 가능 |

**핵심 내용 정리**

| **구분** | **NSSM (Non-Sucking Service Manager)** | **JavaService** |
| --- | --- | --- |
| **범용성** | **범용적** (모든 실행 파일/스크립트 지원) | **특화됨** (자바 애플리케이션 전용) |
| **사용 환경** | 최신 윈도우 OS 완벽 지원 | 구식 윈도우/JVM 환경에 국한 |
| **설정 방식** | GUI 및 CLI 지원, 사용 용이 | 주로 CLI 방식, 구성이 복잡할 수 있음 |
| **오픈소스 여부** | 오픈소스 | 대부분 구식 상용/오픈소스 |

---

## Windows Service Install **Batch File**

<aside>
💡

NSSM을 사용하여 해당 코드 설명을 통해서 적용된 내용 설명

</aside>

- **[install_info.bat] Windows Service 설치 정보**
    
    ```powershell
    @echo off
    
    rem 각각의 경로
    set MAIN_PATH=D:\etc\트러블슈팅_관련_작업물\Service
    set JAVA_PATH=C:\Program Files\java\jdk21
    set START_METHOD_NAME=DefaultMainApp
    
    rem memory 최소값과 최대값 인코딩 방식 설정
    set ENCODING="UTF-8"
    set XMS="-Xms64m"
    set XMX="-Xmx128m"
    
    rem 서비스명
    set SERVICE_NAME=Version_Upagrede
    
    rem Argument 동적으로 데이터 전달 처리과정
    set ARGUMENT_DATA=Dpath="D:\etc\트러블슈팅_관련_작업물\Service"
    
    rem 서비스 설명 내용을 담기위한 내용
    set DESCRIPTION="안녕하세요 JDK 상위버전 마이그레이션을 작성하기 위해서 작업물을 만들기 위한 서비스입니다."
    
    rem classapth and *.jar(라이브러리)파일 경로
    set CLASSPATH=
    
    endlocal & SET CLASSPATH=%CLASSPATH%
    ```
    

- **[install.bat] Windows Service 설치 및 Memory 수정 설정 Main 화면**
    
    ```powershell
    @echo off
    @chcp 65001 1> NUL 2> NUL
    
    call %~dp0install_info.bat
    
    :Start
    cls
    
    :LOOP1
    echo ####################  Install_Service  ####################
    echo ###########################################################
    echo # 0. Exit						                                     #
    echo # 1. Window Service Install (NSSM - 32bit style)	         #
    echo # 2. Window Service Install (NSSM - 64bit style)	         #
    echo # 3. Remove Window Service (NSSM - 32bit style)	         #
    echo # 4. Remove Window Service (NSSM - 64bit style)	         #
    echo # 5. Window Service Register Memory[ xms/xmx ] Modify     #
    echo ###########################################################
    
    set /p NB1=# Enter Number (0~5) : 
    
    if "%NB1%"=="0" goto EndCmd
    if "%NB1%"=="1" goto Exe1
    if "%NB1%"=="2" goto Exe2
    if "%NB1%"=="3" goto Exe3
    if "%NB1%"=="4" goto Exe4
    if "%NB1%"=="5" goto Exe5
    
    goto LOOP1
    
    :EndCmd
    echo.
    echo Exit.
    pause
    exit
    ```
    

- **[install.bat] Windows Service 설치 32Bit / 64Bit**
    
    ```powershell
    :: =======================================================
    :: 1. Window Service Registration (NSSM - 32bit style)
    :: =======================================================
    :Exe1
    echo.
    echo === Window Service Registration (NSSM - 32bit style) ===
    
    if not exist %MAIN_PATH%\logs (
        echo "logs" 디렉토리가 존재하지 않아 해당 경로에 디렉토리를 생성합니다.
        mkdir %MAIN_PATH%\logs
    ) 
    
    :: nssm32bit에 접근하기 위한 경로 셋팅
    set NSSM_PATH=%MAIN_PATH%\bin\nssm32.exe
    
    %NSSM_PATH% install %SERVICE_NAME% %JAVA_PATH%\bin\java.exe ^
     -Dfile.encoding=%ENCODING% %XMS% %XMX% ^
     { 추가로 java option도 추가 가능 }
     -Dfile.agument=%AGUMENT_DATA% ^
     -cp %MAIN_PATH%\lib/* %START_METHOD_NAME% start
    
    pause
    goto Start
    
    :: =======================================================
    :: 2. Window Service Registration (NSSM - 64bit style)
    :: =======================================================
    :Exe2
    echo.
    echo === Window Service Registration (NSSM - 64bit style) ===
    
    if not exist %MAIN_PATH%\logs (
        echo "logs" 디렉토리가 존재하지 않아 해당 경로에 디렉토리를 생성합니다.
        mkdir %MAIN_PATH%\logs
    ) 
    
    :: nssm64bit에 접근하기 위한 경로 셋팅
    set NSSM_PATH=%MAIN_PATH%\bin\nssm64.exe
    
    %NSSM_PATH% install %SERVICE_NAME% %JAVA_PATH%\bin\java.exe ^
     -Dfile.encoding=%ENCODING% %XMS% %XMX% ^
     { 추가로 java option도 추가 가능 }
     -Dfile.agument=%AGUMENT_DATA% ^
     -cp %MAIN_PATH%\lib/* %START_METHOD_NAME% start
    
    pause
    goto Start
    ```
    

- **[install.bat] Windows Service 삭제 32Bit / 64Bit**
    
    ```powershell
    :: =======================================================
    :: 3. Remove Window Service (NSSM - 32bit style)
    :: =======================================================
    :Exe3
    echo.
    echo === Removing Window Service (NSSM - 32bit style) ===
    
    :: nssm32bit에 접근하기 위한 경로 셋팅
    set NSSM_PATH=%MAIN_PATH%\bin\nssm32.exe
    
    %NSSM_PATH% remove %SERVICE_NAME% confirm
    
    pause
    goto Start
    
    :: =======================================================
    :: 4. Remove Window Service (NSSM - 64bit style)
    :: =======================================================
    :Exe4
    echo.
    echo === Removing Window Service (NSSM - 64bit style) ===
    
    :: nssm64bit에 접근하기 위한 경로 셋팅
    set NSSM_PATH=%MAIN_PATH%\bin\nssm64.exe
    
    %NSSM_PATH% remove %SERVICE_NAME% confirm
    
    pause
    goto Start
    ```
    

- **[install.bat] Windows Service Memory Modify - Windows Service 32Bit or 64Bit 여부 확인**
    
    ```powershell
    
    :: =======================================================
    :: 5. Window Register Memory[ xms/xmx ] Modify
    :: =======================================================
    :Exe5
    echo.
    echo === Window Register Memory[ xms/xmx ] Modify ===
    echo 현재 Windows에 설치된 %SERVICE_NAME%를 레지스트리에서 검색합니다. 
    echo Windows 32bit인지 확인 하는 중입니다.
    echo.
    
        set SERVICE_INSTALLED=0
        for /f %%a in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node" /s /f "%SERVICE_NAME%" ^| findstr /i "%SERVICE_NAME%" 2^>nul') do (
            set SERVICE_INSTALLED=1
        )
        if !SERVICE_INSTALLED!==1 (
            echo Windows 32bit 설치된 프로세스입니다.
            echo Windows 32bit 경로로 설정하여, 메모리를 업데이트를 진행합니다.
            set "WINDOWS_PATH=HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\SYSTEM\CurrentControlSet\Services\%SERVICE_NAME%\Parameters	"	
            call :REG_PATH %WINDOWS_PATH%
            
            goto :MEMORY_MODIFY	
        ) else (
            echo Windows 32bit에서 %SERVICE_NAME%를 찾지 못하여, Windows 64bit에서 %SERVICE_NAME%를 검색합니다.
            echo.
            
            set seconds=0
            set SERVICE_INSTALLED=0
            for /f %%a in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE" /s /f "%SERVICE_NAME%" ^| findstr /i "%SERVICE_NAME%" 2^>nul') do (
    
                set /a seconds+=1
                echo !seconds!
                if !seconds! GEQ 300 (
                    echo.
                    echo 5분 경과로 인하여 초기 화면으로 돌아갑니다.
                    goto :Start				
    
                ) else (
                    set SERVICE_INSTALLED=1
                )
            )
            if !SERVICE_INSTALLED!==1 (
                echo Windows 64bit 설치된 프로세스입니다.
                echo Windows 64bit 경로로 설정하여, 메모리를 업데이트를 진행합니다.		
                set "WINDOWS_PATH=HKLM\SYSTEM\CurrentControlSet\Services\%SERVICE_NAME%\Parameters"
                call :REG_PATH !WINDOWS_PATH!
                
                goto :MEMORY_MODIFY
            ) else (
                echo Windows 32bit/64bit에서 "%SERVICE_NAME%"가 발견되지 않았습니다.
                echo 아무키를 입력하면 첫 화면으로 돌아갑니다.
                echo.
                echo.
                
                pause
                goto Start
            )
        )
        
    pause
    goto Start
    ```
    

- **[install.bat] Windows Service Memory Modify - Windows Service Memory Modify**
    
    ```powershell
    
    :: =======================================================
    :: 5-1. Window Register Memory[ xms/xmx ] Modify - 메모리 Modify rogic
    :: =======================================================
    :MEMORY_MODIFY
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
        echo    ######################################################
        echo    #          MEMORY            #       CURRENT         #
        echo    ######################################################
        echo    # info.bat에서 호출한 최소 값 # !SET_MEMORY_MIN_SIZE! #
        echo    # info.bat에서 호출한 최대 값 # !SET_MEMORY_MAX_SIZE! #
        echo    ######################################################
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
        echo    ########################################################################################
        echo    #          NAME           #             CURRENT         #             CHANGE           #
        echo    ########################################################################################
        echo    # !GET_MEMORY_MIN_NAME!   #       !GET_MEMORY_MIN_SIZE! #        !SET_MEMORY_MIN_SIZE! #
        echo    # !GET_MEMORY_MAX_NAME!   #       !GET_MEMORY_MAX_SIZE! #        !SET_MEMORY_MAX_SIZE! #
        echo    ########################################################################################
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
    ```
    

- **[install.bat] Windows Service Memory Modify - Windows Service Memory Modify Response Message**
    
    ```powershell
    :: =======================================================
    :: 5-1. Window Register Memory[ xms/xmx ] Modify - Result Response Msg rogic
    :: =======================================================
    :MSG_TYPE
    set MSG_TYPE=%~1
    goto :EOF
    
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
        echo 	아무키를 입력하면 첫 화면으로 돌아갑니다.
        echo.
        
    pause
    goto Start
    ```
    

## Windows Service Install & Service Start / Shutdown

<aside>
💡

NSSM을 사용하여 적용된 Windows Service로 시각화 설명

</aside>

- **Windows Service Install - 64Bit**
    - **Windows Service Install** 된 경우 같은 위치에 해당 디렉토리 생성 확인
        
        ![image.png](../img/project/shooting_post0002_002.png)
        
    
- **Windows Service Delete - 64Bit**
    - Windows Service Delete 된 경우 같은 위치에 해당 디렉토리 삭제 확인
        
        ![image.png](../img/project/shooting_post0002_003.png)
        
    
- **Windows Serivce Register Memory Mdoify**
    - Windows Service가 있는 상태로 Memory Modify 하는 경우
        
        
    
    - **Windows Service가 없는 상태 혹은 Windows Service가 발견되지 않는 상태**로 Memory Modify 하는 경우
        
        ![image.png](../img/project/shooting_post0002_004.png)
        

---

# 결론

### JavaService 사용 불가

1. JDK 버전별로 적용 되어 있는 **tools.jar의 존재 유무와 jvm.dll 경로가 하드 코딩 되어 있어  JDK 8버전 이상 사용 불가**
2. 기존 에이전트에서 제공하는 Windows 서비스 등록을 제공하기 위해서 NSSM이라는 유틸리티 채택하여 사용

### NSSM을 선택한 이유

1. JDK 버전에 의존하지 않음
2. prunsrv의 복잡함을 가진 것과 달리 **실행 파일 / 스크립트 지정 만으로 간단히 서비스 생성 가능**
3. **유지 보수가 매우 낮은 편**이기에 인수인계가 필요 없을 정도

---

# 효율성 및 관리 지표

## 정합성

> OS가 Windows이면서 JDK21 ~ 25를 사용하는 고객(Client)사 제공한 TEST 버전을 **외근 설치 및 원격 설치를 통하여
모든 결과에서 오류의 발생 없이 정상적으로 기동**하는 것을 확인 하였습니다.
> 

## 효율성

> 효율성의 공식은 운영에 반영한 데이터를 토대로  공식을 구했으며,
사람 손수 작업하는 작업을 통해서 오차 범위가 발생하기 때문에 오차 범위를 줄이고자 
ChatGPT를 통해서 정확한 결과 값을 추출하였습니다.
> 

### 효율성 공식 - 효율성을 수치화를 할 수 없습니다.

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
| 시간 기반 효율성 |  |  |  |  |
| 비용 기반 효율성 |  |  |  |  |
| 자원 기반 효율성 |  |  |  |  |
| 목표 기반 효율성 |  |  |  |  |
| 정확성 |  |  |  |  |


💡 **GPT** **해석 요약**

- JDK 8 → JDK 21/25 상위 버전 전환 과정에서 Windows 서비스 실행 구조의 호환성 문제를 사전 식별
- JavaService.exe 제거 후 NSSM 기반으로 서비스 실행 구조를 재설계하여 JDK 종속성 제거
- OS(Service Control Manager)와 JVM 실행 계층을 분리하여 장기적인 버전 확장성 확보
- 레거시 실행 구조 탈피를 통해 향후 JDK 업그레이드 리스크 사전 차단

# 개발 추가 보안점

> 현재까지 존재하지 않음
> 
