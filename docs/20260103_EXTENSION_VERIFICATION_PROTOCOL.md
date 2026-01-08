# DASH Extension Verification Protocol Report

**문서 번호**: 20260103_EXTENSION_VERIFICATION_PROTOCOL  
**작성자**: Yoo Seung-jun(utact)  
**최종 업데이트**: 2026-01-08  

## 1. 개요
DASH 서비스의 온보딩 과정에서 익스텐션의 설치 및 설정 상태를 투명하고 확실하게 검증하기 위한 통신 프로토콜을 정의합니다. 본 문서는 `scripts/bridge.js`의 동작 방식과 웹 애플리케이션(Dash Frontend)이 이를 어떻게 활용해야 하는지를 기술합니다.

## 2. 통신 메커니즘 (Bridge Mechanism)

### 2.1 데이터 주입 (Data Injection)
익스텐션은 DASH 도메인(`dash.utact.com` 등) 접속 시 `scripts/bridge.js`를 통해 DOM에 숨겨진 요소를 주입합니다.

- **Target Element**: `div#DashHub-dash-data` (Hidden)
- **Attributes**:
  - `data-extension-installed`: `"true"` (고정값, 설치 여부 확인용)
  - `data-repo`: `string` (설정된 리포지토리 이름, 예: `algorithm-study`)
  - `data-hook`: `string` (실제 연동된 훅 정보, 예: `username/algorithm-study`)
  - `data-username`: `string` (GitHub 사용자명)

### 2.2 이벤트 통신 (Event Communication)
웹 애플리케이션(Vue.js 등)의 라이프사이클과 비동기적으로 상호작용하기 위해 Custom Event를 사용합니다.

- **Event Name (Extension → Web)**: `DashHub-dash-ready`
  - **Detail Object**: `{ repo, hook, username, extensionInstalled: true, extensionId: string }`
  - **Trigger Timing**: 
    1. DOM 주입 직후 즉시 발송.
    2. `DOMContentLoaded` 시점 발송.
    3. 웹의 요청(`DashHub-dash-request`) 수신 시 발송.

- **Event Name (Web → Extension)**: `DashHub-dash-request`
  - **Purpose**: 웹 애플리케이션이 로드된 후, 익스텐션에게 "현재 상태 데이터를 다시 보내달라"고 요청.

## 3. 검증 요구사항 (Verification Requirements for Client)

### 3.1 설치 검증
클라이언트는 반드시 `data-extension-installed="true"` 속성 또는 `DashHub-dash-ready` 이벤트 수신을 통해 설치를 확인해야 합니다.

### 3.2 연동 검증
클라이언트는 `data-repo`보다는 **`data-hook`** 값의 존재 유무를 통해 실제 GitHub 리포지토리와의 연동 상태를 판단해야 합니다. `repo` 값은 단순 설정명일 수 있으나, `hook` 값은 실제 훅이 생성되었음을 보장합니다.

## 4. 참고 사항 (Implementation Note)
이 프로토콜은 `scripts/bridge.js`에 구현되어 있으며, 프로젝트 리팩토링 후에도 동일한 스펙을 유지하고 있습니다. 모든 이벤트와 데이터 속성은 `DashHub-` 프리픽스를 사용합니다.
