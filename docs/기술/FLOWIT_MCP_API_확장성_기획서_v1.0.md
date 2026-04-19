# FLOWIT MCP/API 확장성 기획서 v1.0

> **작성일**: 2026-04-16  
> **작성자**: 윤종호 (DreamCoders 대표)  
> **상태**: 초안 (Draft)  
> **관련 문서**: FLOWIT_기능정의서_v2.3.md, FLOWIT_제품_로드맵_v2.0.md

---

## 1. 개요

### 1.1 배경

개발자들이 Claude Code, Codex 등 AI 에이전트 도구를 활용한 개발 워크플로우가 보편화되고 있다. FLOWIT의 데이터(PM 태스크, 커뮤니티 Q&A, AI 멘토링 맥락)를 외부 도구에서 직접 접근·활용할 수 있도록 MCP(Model Context Protocol) 서버 및 REST API를 제공하여 플랫폼 확장성을 확보한다.

### 1.2 목적

- FLOWIT 데이터를 Claude Code, Cursor, VS Code 등 개발 환경에서 직접 활용 가능하게 함
- B2B 고객(부트캠프, 소규모 스타트업)에게 관리·분석 API 제공
- 외부 서비스(Slack, Discord, GitHub Actions) 연동을 통한 워크플로우 자동화
- 플랫폼 락인 효과 강화 및 개발자 생태계 확장

### 1.3 타겟

| 구분 | 대상 | 주요 니즈 |
|------|------|-----------|
| B2C | 주니어 개발자, 1인 개발자 | 개발 환경에서 FLOWIT 태스크·멘토링 직접 활용 |
| B2B (소규모) | 스타트업 개발팀 (5~20명) | 팀 대시보드, CI/CD 연동, Webhook 알림 |
| B2B (엔터프라이즈) | 부트캠프, 교육기관 | 수강생 관리, 학습 진도 추적, SSO/SCIM |

---

## 2. MCP 서버 설계

### 2.1 설계 원칙

| 원칙 | 설명 |
|------|------|
| 인증 기반 접근제어 | OAuth 2.1 + PKCE, 본인 권한 범위 내에서만 CRUD 가능 |
| 안전한 삭제 정책 | 삭제는 soft-delete 또는 비활성화, 영구삭제 차단 (Notion 패턴) |
| 모듈별 분리 | TaskFlow / Agora / AI Mentor 3개 모듈로 Tool 그룹 분리 |
| 도구 수 최적화 | 모듈당 5~8개 Tool, 총 15~20개 이내 (MCP 베스트프랙티스) |

### 2.2 레퍼런스 분석

| 서비스 | Tool 수 | 특징 |
|--------|---------|------|
| Linear MCP | 21개 | 이슈 CRUD + 프로젝트/팀 관리 + 코멘트, OAuth 인증 |
| Notion MCP | 17개 | 페이지/DB CRUD, 삭제 차단, Notion-flavored Markdown |
| GitHub MCP | 15개+ | 레포/이슈/PR 관리, --read-only 모드, toolsets 필터링 |
| Slack MCP | 12개+ | 메시지/채널/캔버스, OAuth 2.1 + PKCE, 관리자 승인 |

### 2.3 FLOWIT MCP Tool 정의

#### 모듈 1: TaskFlow (PM 도구)

| Tool 이름 | 설명 | 권한 | 비고 |
|-----------|------|------|------|
| `flowit_list_projects` | 내 프로젝트 목록 조회 | Read | 필터: 상태, 최근순 |
| `flowit_get_project` | 프로젝트 상세 조회 | Read | 멤버, 설정 포함 |
| `flowit_list_tasks` | 태스크 목록 조회 | Read | 필터: 상태(TODO/IN_PROGRESS/REVIEW/HELP/DONE), 담당자, 프로젝트 |
| `flowit_get_task` | 태스크 상세 조회 | Read | 코멘트, 히스토리 포함 |
| `flowit_create_task` | 태스크 생성 | Write | 제목, 설명, 담당자, 우선순위 |
| `flowit_update_task` | 태스크 수정 (상태 변경 포함) | Write | 상태 전이: TODO→IN_PROGRESS→REVIEW→HELP→DONE |
| `flowit_add_comment` | 태스크에 코멘트 추가 | Write | 멘션, 첨부파일 지원 |
| `flowit_get_kanban` | 칸반보드 현황 조회 | Read | 상태별 태스크 수, 요약 |

**사용 시나리오:**
```
# Claude Code에서
"내 FLOWIT 프로젝트에서 REVIEW 상태인 태스크 가져와"
→ flowit_list_tasks(status: "REVIEW")
→ 코드리뷰 진행

"이 태스크 DONE으로 변경하고 코멘트 달아줘"
→ flowit_update_task(status: "DONE")
→ flowit_add_comment("코드리뷰 완료, PR #42 머지됨")
```

#### 모듈 2: Agora (커뮤니티)

| Tool 이름 | 설명 | 권한 | 비고 |
|-----------|------|------|------|
| `flowit_search_posts` | 게시글 검색 | Read | 키워드, 태그, 카테고리 필터 |
| `flowit_get_post` | 게시글 상세 조회 | Read | 본문, 댓글, 좋아요 수 |
| `flowit_list_qna` | Q&A 목록 조회 | Read | 필터: 미해결/해결, 태그 |
| `flowit_get_qna` | Q&A 상세 조회 | Read | 질문 + 답변 + AI 답변 포함 |
| `flowit_create_post` | 게시글 작성 | Write | 카테고리, 태그 지정 |
| `flowit_create_qna` | Q&A 질문 등록 | Write | HELP 상태 시 AI 자동 연결 |

**사용 시나리오:**
```
# Claude Code에서
"FLOWIT 커뮤니티에서 NestJS 에러 관련 Q&A 찾아줘"
→ flowit_search_posts(keyword: "NestJS 에러", category: "QNA")
→ 관련 해결책 참조하여 코드 수정

"이 에러 해결법을 FLOWIT Q&A에 공유해줘"
→ flowit_create_qna(title: "NestJS Prisma 연결 에러 해결", body: "...")
```

#### 모듈 3: AI Mentor

| Tool 이름 | 설명 | 권한 | 비고 |
|-----------|------|------|------|
| `flowit_ask_mentor` | AI 멘토에게 질문 | Write | 멀티모델 라우팅 + RAG 적용, 크레딧 차감 |
| `flowit_get_mentor_history` | 멘토링 대화 이력 조회 | Read | 세션별, 작업유형별 필터 |
| `flowit_list_mentor_sessions` | 멘토링 세션 목록 | Read | 최근순, 작업유형 필터 |

**핵심 차별점:**
- 외부 AI 도구(Claude Code)에서 호출하더라도 FLOWIT의 **RAG 파이프라인**을 거침
  - 공식 문서 + FLOWIT 커뮤니티 데이터 + 사용자 프로젝트 맥락 주입
  - 할루시네이션 최소화, 프로젝트 맞춤형 답변
- 일반 AI 호출과 차별화: **"내 프로젝트 맥락을 아는 AI"**

**사용 시나리오:**
```
# Claude Code에서
"FLOWIT 멘토에게 이 코드 리뷰 요청해"
→ flowit_ask_mentor(taskType: "CODE", tier: 2, message: "이 코드 리뷰해줘: ...")
→ FLOWIT 라우팅: GPT-4o mini 선택 → RAG로 프로젝트 맥락 주입 → 응답 반환
```

---

## 3. REST API 설계

### 3.1 API vs MCP 역할 분리

| 구분 | MCP | REST API |
|------|-----|----------|
| 대상 | AI 에이전트 (Claude Code, Cursor 등) | 외부 서비스, 커스텀 대시보드, CI/CD |
| 프로토콜 | MCP (JSON-RPC over stdio/HTTP) | REST (HTTPS) |
| 인증 | OAuth 2.1 + PKCE | API Key + Bearer Token |
| 용도 | 개발자의 AI 워크플로우 내 활용 | 자동화, 통합, 데이터 수집 |

### 3.2 API 제공 사유

MCP만으로는 커버할 수 없는 영역이 있다:
- **Webhook 수신**: 이벤트 기반 자동화 (MCP는 요청-응답 모델)
- **CI/CD 파이프라인**: GitHub Actions에서 REST API 호출이 표준
- **커스텀 대시보드**: B2B 고객이 자체 관리 도구에 FLOWIT 데이터 연동
- **벌크 작업**: 대량 데이터 조회/내보내기

### 3.3 주요 API 엔드포인트

```
# TaskFlow
GET    /api/v1/projects
GET    /api/v1/projects/:id/tasks
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id
POST   /api/v1/tasks/:id/comments

# Agora
GET    /api/v1/posts/search
GET    /api/v1/qna
POST   /api/v1/qna

# AI Mentor
POST   /api/v1/mentor/ask
GET    /api/v1/mentor/sessions

# B2B 관리
GET    /api/v1/admin/team/dashboard
GET    /api/v1/admin/team/members/:id/stats
GET    /api/v1/admin/usage/report

# Webhook
POST   /api/v1/webhooks
GET    /api/v1/webhooks
DELETE /api/v1/webhooks/:id
```

---

## 4. Webhook / 이벤트 시스템

### 4.1 지원 이벤트

| 이벤트 | 설명 | 주요 활용 |
|--------|------|-----------|
| `task.created` | 태스크 생성됨 | Slack 알림 |
| `task.status_changed` | 태스크 상태 변경 | 칸반 동기화, CI/CD 트리거 |
| `task.completed` | 태스크 완료 | 팀 리포트, 배포 승인 |
| `mentor.session_completed` | AI 멘토링 세션 종료 | 학습 로그 기록 |
| `qna.answered` | Q&A 답변 등록 | 알림, 지식베이스 업데이트 |
| `member.joined` | 새 멤버 합류 | 온보딩 자동화 |

### 4.2 Webhook 페이로드 예시

```json
{
  "event": "task.status_changed",
  "timestamp": "2026-04-16T10:30:00Z",
  "data": {
    "taskId": "task_abc123",
    "projectId": "proj_xyz789",
    "previousStatus": "REVIEW",
    "newStatus": "DONE",
    "updatedBy": "user_jh001"
  }
}
```

---

## 5. CI/CD 연동

### 5.1 GitHub Actions 연동

FLOWIT 태스크 상태를 CI/CD 파이프라인에 연결하여, 멘토링 기반 품질 게이트를 구현한다.

**시나리오 1: 코드리뷰 멘토링 완료 → 배포 승인**
```yaml
# .github/workflows/deploy.yml
name: Deploy with FLOWIT Gate
on:
  push:
    branches: [main]

jobs:
  flowit-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check FLOWIT task status
        run: |
          TASK_STATUS=$(curl -s -H "Authorization: Bearer $FLOWIT_API_KEY" \
            "https://api.flowit.dev/v1/tasks/$TASK_ID" | jq -r '.status')
          if [ "$TASK_STATUS" != "DONE" ]; then
            echo "❌ FLOWIT 태스크가 아직 완료되지 않았습니다."
            exit 1
          fi

  deploy:
    needs: flowit-check
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: echo "Deploying..."
```

**시나리오 2: PR 생성 시 FLOWIT 태스크 자동 연결**
```yaml
- name: Link PR to FLOWIT task
  run: |
    curl -X PATCH -H "Authorization: Bearer $FLOWIT_API_KEY" \
      "https://api.flowit.dev/v1/tasks/$TASK_ID" \
      -d '{"status": "REVIEW", "metadata": {"prUrl": "$PR_URL"}}'
```

**시나리오 3: 빌드 실패 시 FLOWIT 태스크 자동 생성**
```yaml
- name: Create FLOWIT task on failure
  if: failure()
  run: |
    curl -X POST -H "Authorization: Bearer $FLOWIT_API_KEY" \
      "https://api.flowit.dev/v1/tasks" \
      -d '{"title": "빌드 실패: $GITHUB_SHA", "status": "TODO", "priority": "HIGH"}'
```

### 5.2 Slack/Discord 알림 연동

Webhook 이벤트를 Slack Incoming Webhook 또는 Discord Webhook으로 포워딩:

```
FLOWIT 이벤트 발생
  → Webhook 페이로드 전송
  → Slack/Discord 채널에 포맷된 메시지 표시
```

**Slack 메시지 예시:**
```
🟢 [FLOWIT] 태스크 완료
프로젝트: FLOWIT MVP
태스크: 로그인 API 구현
담당자: 윤종호
상태: REVIEW → DONE
```

---

## 6. B2B 엔터프라이즈 기능

### 6.1 팀 대시보드

| 기능 | 설명 | API 엔드포인트 |
|------|------|----------------|
| 팀원별 진행률 | 태스크 완료율, 평균 처리 시간 | `GET /api/v1/admin/team/dashboard` |
| 활동 통계 | 일별/주별 커밋, 멘토링 횟수 | `GET /api/v1/admin/team/members/:id/stats` |
| 프로젝트 현황 | 프로젝트별 진행 상황, 병목 지점 | `GET /api/v1/admin/projects/overview` |

### 6.2 수강생 관리 (부트캠프용)

| 기능 | 설명 |
|------|------|
| 학습 진도 추적 | 수강생별 태스크 완료율, AI 멘토링 사용량, 활동 빈도 |
| AI 사용량 리포트 | 크레딧 소비 현황, 작업유형별 사용 패턴, Tier별 분포 |
| 성과 대시보드 | 수강생 순위, 성장 곡선, 주간/월간 리포트 |

### 6.3 SSO/SCIM (엔터프라이즈 플랜 확장 시점)

> **도입 시기**: 엔터프라이즈 플랜 출시 시점 (로드맵상 2027년 상반기 이후)

| 기능 | 설명 |
|------|------|
| SAML SSO | Google Workspace, Okta, Azure AD 등으로 통합 로그인 |
| SCIM 프로비저닝 | 외부 IdP에서 사용자 등록/해제 시 FLOWIT 계정 자동 동기화 |
| 감사 로그 (Audit Log) | 관리자 행위 추적, 보안 컴플라이언스 대응 |

**적용 예시:**
- 스마트인재개발원이 Google Workspace에 수강생 30명 등록 → FLOWIT에 자동 계정 생성 + 팀 배정
- 수료 시 계정 비활성화 → FLOWIT 계정도 자동 비활성화

---

## 7. 인증 및 보안

### 7.1 인증 방식

| 방식 | 용도 | 상세 |
|------|------|------|
| OAuth 2.1 + PKCE | MCP 연동 (B2C 개발자) | 사용자 인터랙티브 인증, 토큰 갱신 |
| API Key + Bearer Token | REST API (B2B, CI/CD) | 서비스 레벨 인증, 환경변수 저장 |
| SAML SSO | 엔터프라이즈 (추후) | IdP 위임 인증 |

### 7.2 권한 제어

- 모든 MCP Tool / API 엔드포인트는 인증된 사용자 본인의 데이터만 접근 가능
- 팀 관리 API는 Admin/Owner 역할만 접근
- 삭제 작업은 soft-delete 방식 (복구 가능)
- Rate Limiting: Free 100req/h, Pro 1,000req/h, Premium 5,000req/h, Enterprise 무제한

### 7.3 보안 원칙

- 사용자 입력값 JSON Schema 검증 필수
- SQL Injection / Shell Injection 방지 (파라미터 바인딩)
- 시크릿은 환경변수/시크릿 매니저에만 저장 (소스코드 커밋 금지)
- HTTPS/TLS 1.2+ 강제
- 감사 로그 기록 (누가, 언제, 어떤 API를, 어떤 데이터에 접근했는지)

---

## 8. 구현 로드맵

### Phase 1: MCP 서버 MVP (2027 Q1)

- [ ] TaskFlow MCP Tool 8개 구현
- [ ] OAuth 2.1 + PKCE 인증
- [ ] Claude Code / Cursor 연동 테스트
- [ ] MCP 서버 배포 (Remote HTTP)

### Phase 2: REST API + Webhook (2027 Q2)

- [ ] REST API v1 엔드포인트 구현
- [ ] API Key 발급/관리 시스템
- [ ] Webhook 이벤트 시스템 구축
- [ ] Slack/Discord 알림 연동
- [ ] GitHub Actions 연동 예제 제공

### Phase 3: Agora + AI Mentor MCP (2027 Q3)

- [ ] Agora MCP Tool 6개 구현
- [ ] AI Mentor MCP Tool 3개 구현 (RAG 파이프라인 연동)
- [ ] B2B 팀 대시보드 API
- [ ] 수강생 관리 API (부트캠프용)

### Phase 4: 엔터프라이즈 확장 (2027 Q4~)

- [ ] CI/CD 연동 심화 (품질 게이트, 자동 태스크 생성)
- [ ] SSO/SCIM 프로비저닝
- [ ] 감사 로그
- [ ] GraphQL API (커스텀 대시보드 빌더용)

---

## 9. 기대 효과

| 구분 | 효과 |
|------|------|
| B2C | 개발자 워크플로우에 FLOWIT 자연스럽게 통합 → 리텐션 향상, 일일 활성 사용 증가 |
| B2B 스타트업 | CI/CD·Slack 연동으로 팀 생산성 도구화 → 유료 전환 동기 강화 |
| B2B 부트캠프 | 수강생 관리·학습 분석 → 교육기관 도입 근거 (관리 비용 절감) |
| 플랫폼 | API/MCP 생태계 → 서드파티 연동 확대 → 네트워크 효과 + 전환 비용 증가 |

---

## 부록: 참고 자료

- [Linear MCP 서버](https://linear.app/docs/mcp) — 이슈 관리 MCP 레퍼런스
- [Notion MCP 서버](https://developers.notion.com/guides/mcp) — 문서 관리 MCP 레퍼런스
- [GitHub MCP 서버](https://github.com/github/github-mcp-server) — 코드 관리 MCP 레퍼런스
- [MCP 베스트프랙티스](https://modelcontextprotocol.io/docs/learn/architecture) — Tool 설계 원칙
- [OAuth 2.1 + MCP 인증](https://auth0.com/blog/an-introduction-to-mcp-and-authorization/) — 인증 아키텍처 참고
