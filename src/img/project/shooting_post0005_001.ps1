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
