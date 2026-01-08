# SW Expert Academy Solving Club Integration Report

**문서 번호**: 20260104_SWEA_CLUB_INTEGRATION_REPORT  
**작성자**: Yoo Seung-jun(utact)  
**최종 업데이트**: 2026-01-08  

## 1. 개요
SW Expert Academy의 'Solving Club(그룹)' 기능 내에서 문제 풀이 시, **문제 목록을 거치지 않고 직접 링크로 접근했을 때** 발생하던 확장프로그램 미동작 및 리다이렉트 오류 해결 내역입니다. 이 로직은 `scripts/swea/` 모듈에 통합되어 운영 중입니다.

## 2. 문제 상황 및 원인 분석

### 2.1 증상
1. Solving Club 내 문제 풀이 페이지로 직접 접근 시, 제출 후 일반 결과 페이지(`problemSolver.do`)로 이동됨 (클럽 기록 누락).
2. 리다이렉트 시 "시스템 오류" 또는 "잘못된 접근" 메시지 발생.
3. 확장프로그램이 특정 페이지(`problemView.do`)에서 아예 실행되지 않음.

### 2.2 원인
1. **Trigger 누락**: `solvingProblem.do`(모의테스트)만 감시하고 `problemView.do`(클럽 문제)를 감시하지 않음.
2. **ID 탐색 실패**: 직접 링크 접근 시 URL 파라미터에 `solveclubId`가 없어 일반적인 파싱 로직 실패.
3. **잘못된 파라미터**: 리다이렉트 URL 생성 시 `problemBoxCnt` 등 빈 값을 전송하여 서버 에러 유발.

## 3. 구현 내용 (Implementation)

이 기능은 `scripts/swea/swexpertacademy.js`와 `scripts/swea/parsing.js`에 구현되어 있습니다.

### 3.1 Trigger 조건 추가 (`scripts/swea/swexpertacademy.js`)
확장프로그램이 로드되는 조건에 클럽 문제 풀이 페이지를 명시적으로 추가했습니다.

```javascript
if (
  (currentUrl.includes("/main/solvingProblem/solvingProblem.do") && /* ... */) ||
  currentUrl.includes("/main/talk/solvingClub/problemView.do") // Club View Trigger
) {
  startLoader();
}
```

### 3.2 Hidden Input 탐색 로직 강화 (`scripts/swea/parsing.js`)
URL에 ID가 없는 경우를 대비하여, 페이지 내부의 숨겨진 Input 요소를 최우선으로 탐색합니다.

```javascript
/* solveclubId Detection Priority */
1. document.querySelector("#solveclubId").value  // Hidden Input (Primary)
2. document.querySelector("input[name='solveclubId']").value
3. URLSearchParams (Fallback)
4. window.opener (Deep Fallback)
```

이 로직은 `solveclubId` 뿐만 아니라 `probBoxId`, `problemBoxTitle` 등 모든 메타데이터 추출에 적용되어 있습니다.

### 3.3 리다이렉트 URL 안정화 (`scripts/swea/swexpertacademy.js`)
서버 에러를 유발하던 불필요한/빈 파라미터를 제거하고, 필수 파라미터만으로 `submitUrl`을 안전하게 재구성합니다.

## 4. 검증 결과 (Verification)

### 4.1 시나리오
1. **Case A (목록 진입)**: Solving Club > 문제 목록 > 문제 선택 진입. (URL에 ID 있음)
2. **Case B (직접 진입)**: 문제 URL을 복사하여 새 탭에서 열기. (URL에 ID 없음)

### 4.2 결과
- **Case A, B 모두**: 제출 후 `problemPassedUser.do`(클럽 결과 페이지)로 정상 리다이렉트됨.
- 확장프로그램이 `solveclubId`를 정확히 추출하여 GitHub 업로드 시 디렉토리 경로가 정상 생성됨.
