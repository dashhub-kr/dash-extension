<div align="center">
  <img src="assets/icon.png" alt="DashHub Logo" width="120px" height="120px" />
  <br/>
  <h3>Algorithm Code Synchronization & Automation</h3>
  <br/>

  [![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
  [![Clean Architecture](https://img.shields.io/badge/Architecture-Clean-orange?style=flat-square)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
  [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
</div>

---

## 📖 Introduction

**DashHub**는 **DASH** 플랫폼의 핵심 구성요소로, [Baekjoon Online Judge (BOJ)](https://www.acmicpc.net/)와 [SW Expert Academy (SWEA)](https://swexpertacademy.com/)에서 제출한 코드를 **자동으로 감지하고 GitHub로 동기화**하는 크롬 익스텐션입니다.

사용자가 문제 풀이에만 집중할 수 있도록, **Zero-Manual 파이프라인**의 시작점 역할을 수행하며, 제출된 코드는 DASH 플랫폼에서 분석되어 성장 지표로 활용됩니다.

### 💡 Core Value
* **Zero-Manual Automation**: 별도의 업로드 과정 없이, 제출 즉시 코드를 GitHub 리포지토리에 푸시합니다.
* **Multi-Platform**: Baekjoon Online Judge(BOJ) 및 SW Expert Academy(SWEA)를 모두 지원하는 유일한 솔루션입니다.
* **Clean Architecture**: 유지보수성과 확장성을 고려하여 모듈화된 설계를 적용, 안정적인 서비스를 제공합니다.
* **Visual Feedback**: 제출 화면에서 직관적인 애니메이션으로 업로드 상태를 피드백합니다.

---

## 📂 Project Structure

유지보수성과 확장성을 고려하여 **Clean Architecture**를 지향하는 구조로 재설계되었습니다.

```bash
dash-hub/
├── scripts/
│   ├── common/       # 공통 유틸리티 (GitHub API, 포맷터, 로깅 등)
│   ├── boj/          # 백준(BOJ) 전용 파싱 및 로직
│   ├── swea/         # SWEA 전용 파싱 및 로직
│   ├── background.js # 서비스 워커 (이벤트 리스닝 및 메시징)
│   └── bridge.js     # DOM 주입 및 페이지-익스텐션 통신 브리지
├── css/
│   ├── content.css   # 문제 사이트(BOJ/SWEA) 주입 스타일
│   └── popup.css     # 익스텐션 팝업 스타일
├── popup.html        # 익스텐션 설정 및 연결 UI
├── manifest.json     # Manifest V3 설정 파일
└── config.js         # 환경 설정 (Git Ignore 처리됨)
```

---

## 🚀 Getting Started

### Installation
1. **리포지토리 클론**
   ```bash
   git clone https://github.com/dashhub-kr/dash-extension.git
   ```
2. **크롬 익스텐션 로드**
   - Chrome 주소창에 `chrome://extensions/` 입력
   - 우측 상단 **개발자 모드** 켜기
   - **압축해제된 확장 프로그램 로드** 클릭
   - `dash-extension` 폴더 선택

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
