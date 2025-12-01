# TechBuddy 문서 (Docs)

이 폴더는 TechBuddy 프로젝트의 공식 문서를 관리합니다.

---

## 폴더 구조

```
docs/
├── 01-planning/       # 기획 문서
├── 02-database/       # DB 설계 (ERD)
├── 03-api/            # API 명세서
├── 04-architecture/   # 아키텍처 및 개발 가이드
├── 05-auth/           # 인증 시스템 가이드
└── 06-ui-ux/          # UI/UX 가이드
```

---

## 각 폴더 설명

### 01-planning (기획)
- `TechBuddy_기획서_v1_3.md` - 전체 서비스 기획서
- `프로젝트관리_기능요구사항정의서_v1.0.md` - 기능 요구사항 정의

### 02-database (데이터베이스)
- `TechBuddy_ERD_*.jpg` - ERD 다이어그램 이미지
- `TechBuddy_ERD_*.txt` - ERD 텍스트 설명

### 03-api (API)
- `프로젝트관리_API명세서_v1_0.md` - API 엔드포인트 명세

### 04-architecture (아키텍처)
- `Frontend_아키텍처_가이드.md` - 프론트엔드 구조 가이드
- `개발_워크플로우_가이드.md` - 개발 프로세스 및 워크플로우

### 05-auth (인증)
- `Auth_구현_가이드.md` - JWT 인증 구현 가이드

### 06-ui-ux (UI/UX)
- `01-landing-header.md` - 랜딩 페이지 헤더 가이드
- `02-landing-content.md` - 랜딩 페이지 컨텐츠 가이드 (Hero, 기능 소개, Footer)
- `03-frontend-page-structure.md` - Nuxt 프론트엔드 페이지 구조 가이드
- `04-ui-library-guide.md` - UI 라이브러리 가이드 (Nuxt UI vs Shadcn-vue)

---

## 문서 작성 규칙

1. **파일명**: 한글 또는 영문, 언더스코어(_) 사용
2. **버전 관리**: 중요 문서는 파일명에 버전 포함 (예: `_v1_0.md`)
3. **마크다운**: 모든 문서는 `.md` 형식으로 작성

---

*마지막 업데이트: 2025.12.02*
