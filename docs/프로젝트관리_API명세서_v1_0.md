# 프로젝트 관리 기능 - API 명세서

**작성일**: 2025-11-13  
**버전**: v1.0  
**기반 문서**: 프로젝트관리_기능요구사항정의서_v1_0.md  
**백엔드**: NestJS + TypeScript  
**DB**: PostgreSQL (Supabase)

---

## 목차
1. [API 개요](#1-api-개요)
2. [인증 및 권한](#2-인증-및-권한)
3. [공통 응답 형식](#3-공통-응답-형식)
4. [프로젝트 관리 API](#4-프로젝트-관리-api)
5. [Task 관리 API](#5-task-관리-api)
6. [칸반보드 API](#6-칸반보드-api)
7. [파일 관리 API](#7-파일-관리-api)
8. [코멘트 API](#8-코멘트-api)
9. [알림 API](#9-알림-api)
10. [에러 코드](#10-에러-코드)
11. [웹소켓 이벤트](#11-웹소켓-이벤트)
12. [Rate Limiting](#12-rate-limiting)

---

## 1. API 개요

### 1.1 Base URL
```
개발: http://localhost:3000/api/v1
프로덕션: https://api.techbuddy.io/v1
```

### 1.2 요청 형식
- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (`2025-11-13T14:00:00Z`)

### 1.3 버전 관리
- URL 경로에 버전 명시: `/api/v1/`
- Breaking Change 발생 시 버전 증가

---

## 2. 인증 및 권한

### 2.1 인증 방식
**JWT (JSON Web Token)** 사용

#### Access Token
```http
Authorization: Bearer {access_token}
```

- **유효기간**: 1시간
- **저장 위치**: 메모리 (XSS 방지)

#### Refresh Token
- **유효기간**: 14일
- **저장 위치**: HttpOnly Cookie (CSRF 방지)

### 2.2 토큰 갱신

**POST** `/auth/refresh`

**Request**:
```http
Cookie: refresh_token={refresh_token}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 2.3 권한 체계

요구사항 정의서의 4가지 역할:

| 역할 | 코드 | 설명 |
|-----|------|------|
| PM | `PM` | 프로젝트 매니저 (모든 권한) |
| 팀장 | `TEAM_LEADER` | Task 관리 + 멤버 초대 |
| 팀원 | `MEMBER` | 자신의 Task만 수정 |
| 멘토 | `MENTOR` | 읽기 전용 + 코멘트 |

---

## 3. 공통 응답 형식

### 3.1 성공 응답

```json
{
  "success": true,
  "data": {
    // 응답 데이터
  },
  "meta": {
    "timestamp": "2025-11-13T14:00:00Z",
    "version": "v1"
  }
}
```

### 3.2 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": {
      // 추가 정보 (선택)
    }
  },
  "meta": {
    "timestamp": "2025-11-13T14:00:00Z",
    "version": "v1"
  }
}
```

### 3.3 페이지네이션 응답

```json
{
  "success": true,
  "data": [
    // 아이템 목록
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 4. 프로젝트 관리 API

### 4.1 프로젝트 생성

**POST** `/projects`

**권한**: 인증된 사용자

**Request**:
```json
{
  "name": "쇼핑몰 프로젝트",
  "description": "부트캠프 최종 프로젝트",
  "startDate": "2025-11-13",
  "endDate": "2025-12-20",
  "isPublic": false
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "쇼핑몰 프로젝트",
    "description": "부트캠프 최종 프로젝트",
    "startDate": "2025-11-13",
    "endDate": "2025-12-20",
    "isPublic": false,
    "createdBy": {
      "id": "user-123",
      "name": "윤종호",
      "role": "PM"
    },
    "createdAt": "2025-11-13T14:00:00Z",
    "updatedAt": "2025-11-13T14:00:00Z"
  }
}
```

---

### 4.2 프로젝트 목록 조회

**GET** `/projects`

**권한**: 인증된 사용자

**Query Parameters**:
- `page`: 페이지 번호 (기본: 1)
- `limit`: 페이지당 항목 수 (기본: 20, 최대: 100)
- `status`: 프로젝트 상태 필터 (`active`, `completed`, `archived`)
- `search`: 검색어 (프로젝트명, 설명)

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "쇼핑몰 프로젝트",
      "description": "부트캠프 최종 프로젝트",
      "startDate": "2025-11-13",
      "endDate": "2025-12-20",
      "status": "active",
      "progress": 45,
      "memberCount": 5,
      "taskStats": {
        "total": 20,
        "todo": 8,
        "inProgress": 5,
        "done": 7,
        "help": 0
      },
      "createdAt": "2025-11-13T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 4.3 프로젝트 상세 조회

**GET** `/projects/:projectId`

**권한**: 프로젝트 멤버

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "쇼핑몰 프로젝트",
    "description": "부트캠프 최종 프로젝트",
    "startDate": "2025-11-13",
    "endDate": "2025-12-20",
    "status": "active",
    "isPublic": false,
    "overview": "# 프로젝트 개요\n\n온라인 쇼핑몰 구축...",
    "members": [
      {
        "id": "user-123",
        "name": "윤종호",
        "role": "PM",
        "avatar": "https://...",
        "joinedAt": "2025-11-13T14:00:00Z"
      },
      {
        "id": "user-456",
        "name": "박지승",
        "role": "MEMBER",
        "avatar": "https://...",
        "joinedAt": "2025-11-13T14:05:00Z"
      }
    ],
    "taskStats": {
      "total": 20,
      "todo": 8,
      "inProgress": 5,
      "done": 7,
      "help": 0
    },
    "createdAt": "2025-11-13T14:00:00Z",
    "updatedAt": "2025-11-13T16:00:00Z"
  }
}
```

---

### 4.4 프로젝트 수정

**PATCH** `/projects/:projectId`

**권한**: PM, TEAM_LEADER

**Request**:
```json
{
  "name": "쇼핑몰 프로젝트 v2",
  "description": "수정된 설명",
  "endDate": "2025-12-25",
  "overview": "# 프로젝트 개요\n\n..."
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "쇼핑몰 프로젝트 v2",
    // ... 나머지 필드
    "updatedAt": "2025-11-13T17:00:00Z"
  }
}
```

---

### 4.5 프로젝트 삭제

**DELETE** `/projects/:projectId`

**권한**: PM만

**Response (204)**:
```
No Content
```

---

### 4.6 팀원 초대

**POST** `/projects/:projectId/members`

**권한**: PM, TEAM_LEADER

**Request**:
```json
{
  "userId": "user-789",
  "role": "MEMBER"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "user-789",
    "name": "이준호",
    "role": "MEMBER",
    "avatar": "https://...",
    "joinedAt": "2025-11-13T14:30:00Z"
  }
}
```

---

### 4.7 팀원 역할 변경

**PATCH** `/projects/:projectId/members/:userId`

**권한**: PM만

**Request**:
```json
{
  "role": "TEAM_LEADER"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "user-789",
    "name": "이준호",
    "role": "TEAM_LEADER",
    "updatedAt": "2025-11-13T15:00:00Z"
  }
}
```

---

### 4.8 팀원 제거

**DELETE** `/projects/:projectId/members/:userId`

**권한**: PM만

**Response (204)**:
```
No Content
```

---

## 5. Task 관리 API

### 5.1 Task 생성

**POST** `/projects/:projectId/tasks`

**권한**: PM, TEAM_LEADER, MEMBER

**Request**:
```json
{
  "title": "회원가입 API 연동",
  "description": "- 백엔드 API 엔드포인트 확인\n- POST /api/auth/signup\n- 요청/응답 데이터 형식 정리",
  "assigneeId": "user-456",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2025-11-20",
  "labels": ["프론트엔드", "API"]
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "task-123",
    "title": "회원가입 API 연동",
    "description": "- 백엔드 API 엔드포인트 확인\n...",
    "assignee": {
      "id": "user-456",
      "name": "박지승",
      "avatar": "https://..."
    },
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2025-11-20",
    "labels": ["프론트엔드", "API"],
    "createdBy": {
      "id": "user-123",
      "name": "윤종호"
    },
    "createdAt": "2025-11-13T14:00:00Z",
    "updatedAt": "2025-11-13T14:00:00Z"
  }
}
```

---

### 5.2 Task 목록 조회

**GET** `/projects/:projectId/tasks`

**권한**: 프로젝트 멤버

**Query Parameters**:
- `status`: 상태 필터 (`TODO`, `IN_PROGRESS`, `DONE`, `HELP`)
- `assigneeId`: 담당자 필터
- `priority`: 우선순위 필터 (`HIGH`, `MEDIUM`, `LOW`)
- `labels`: 라벨 필터 (콤마 구분)
- `search`: 검색어

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "task-123",
      "title": "회원가입 API 연동",
      "assignee": {
        "id": "user-456",
        "name": "박지승",
        "avatar": "https://..."
      },
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2025-11-20",
      "labels": ["프론트엔드", "API"],
      "commentCount": 3,
      "createdAt": "2025-11-13T14:00:00Z",
      "updatedAt": "2025-11-13T15:00:00Z"
    }
  ]
}
```

---

### 5.3 Task 상세 조회

**GET** `/projects/:projectId/tasks/:taskId`

**권한**: 프로젝트 멤버

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "task-123",
    "title": "회원가입 API 연동",
    "description": "- 백엔드 API 엔드포인트 확인\n...",
    "assignee": {
      "id": "user-456",
      "name": "박지승",
      "avatar": "https://..."
    },
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "dueDate": "2025-11-20",
    "labels": ["프론트엔드", "API"],
    "checklist": [
      {
        "id": "check-1",
        "text": "API 엔드포인트 확인",
        "completed": true
      },
      {
        "id": "check-2",
        "text": "요청 데이터 형식 정리",
        "completed": false
      }
    ],
    "createdBy": {
      "id": "user-123",
      "name": "윤종호"
    },
    "createdAt": "2025-11-13T14:00:00Z",
    "updatedAt": "2025-11-13T15:00:00Z"
  }
}
```

---

### 5.4 Task 수정

**PATCH** `/projects/:projectId/tasks/:taskId`

**권한**: 
- PM, TEAM_LEADER: 모든 Task 수정 가능
- MEMBER: 자신에게 할당된 Task만 수정 가능

**Request**:
```json
{
  "title": "회원가입 API 연동 (수정)",
  "description": "수정된 설명...",
  "status": "DONE",
  "priority": "MEDIUM"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    // 수정된 Task 전체 정보
  }
}
```

---

### 5.5 Task 상태 변경 (칸반보드)

**PATCH** `/projects/:projectId/tasks/:taskId/status`

**권한**: 모든 프로젝트 멤버

**Request**:
```json
{
  "status": "IN_PROGRESS"
}
```

**Help 상태로 변경 시**:
```json
{
  "status": "HELP",
  "helpReason": "CORS 에러가 발생해서 도움이 필요합니다"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "task-123",
    "status": "HELP",
    "helpReason": "CORS 에러가 발생해서 도움이 필요합니다",
    "updatedAt": "2025-11-13T15:00:00Z"
  }
}
```

---

### 5.6 Task 삭제

**DELETE** `/projects/:projectId/tasks/:taskId`

**권한**: PM, TEAM_LEADER

**Response (204)**:
```
No Content
```

---

## 6. 칸반보드 API

### 6.1 칸반보드 조회

**GET** `/projects/:projectId/kanban`

**권한**: 프로젝트 멤버

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "id": "TODO",
        "name": "Todo",
        "tasks": [
          {
            "id": "task-123",
            "title": "회원가입 API 연동",
            "assignee": {
              "id": "user-456",
              "name": "박지승"
            },
            "priority": "HIGH",
            "dueDate": "2025-11-20",
            "labels": ["프론트엔드"]
          }
        ],
        "taskCount": 8
      },
      {
        "id": "IN_PROGRESS",
        "name": "In Progress",
        "tasks": [...],
        "taskCount": 5
      },
      {
        "id": "DONE",
        "name": "Done",
        "tasks": [...],
        "taskCount": 7
      },
      {
        "id": "HELP",
        "name": "Help",
        "tasks": [...],
        "taskCount": 0
      }
    ]
  }
}
```

---

## 7. 파일 관리 API

### 7.1 파일 업로드

**POST** `/projects/:projectId/files`

**권한**: PM, TEAM_LEADER, MEMBER

**Request** (multipart/form-data):
```
file: [파일 바이너리]
folder: "기획서"  // 기획서, 설계서, 발표자료, 기타
description: "프로젝트 기획서 v1.0"
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "file-123",
    "name": "프로젝트_기획서_v1.0.pdf",
    "originalName": "기획서.pdf",
    "folder": "기획서",
    "description": "프로젝트 기획서 v1.0",
    "size": 2457600,
    "mimeType": "application/pdf",
    "url": "https://storage.techbuddy.io/projects/550e8400.../file-123.pdf",
    "uploadedBy": {
      "id": "user-123",
      "name": "윤종호"
    },
    "uploadedAt": "2025-11-13T14:00:00Z"
  }
}
```

---

### 7.2 파일 목록 조회

**GET** `/projects/:projectId/files`

**권한**: 프로젝트 멤버

**Query Parameters**:
- `folder`: 폴더 필터 (`기획서`, `설계서`, `발표자료`, `기타`)

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "name": "기획서",
        "files": [
          {
            "id": "file-123",
            "name": "프로젝트_기획서_v1.0.pdf",
            "size": 2457600,
            "uploadedBy": {
              "id": "user-123",
              "name": "윤종호"
            },
            "uploadedAt": "2025-11-13T14:00:00Z"
          }
        ],
        "fileCount": 3,
        "totalSize": 7372800
      }
    ],
    "totalFiles": 11,
    "totalSize": 24576000
  }
}
```

---

### 7.3 파일 다운로드

**GET** `/projects/:projectId/files/:fileId/download`

**권한**: 프로젝트 멤버

**Response (200)**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="프로젝트_기획서_v1.0.pdf"

[파일 바이너리]
```

---

### 7.4 파일 삭제

**DELETE** `/projects/:projectId/files/:fileId`

**권한**: 
- PM, TEAM_LEADER: 모든 파일 삭제 가능
- MEMBER: 자신이 업로드한 파일만 삭제 가능

**Response (204)**:
```
No Content
```

---

### 7.5 전체 파일 일괄 다운로드

**GET** `/projects/:projectId/files/download-all`

**권한**: PM, TEAM_LEADER, MENTOR

**Response (200)**:
```
Content-Type: application/zip
Content-Disposition: attachment; filename="쇼핑몰_프로젝트_산출물.zip"

[ZIP 파일 바이너리]
```

---

## 8. 코멘트 API

### 8.1 코멘트 생성

**POST** `/projects/:projectId/tasks/:taskId/comments`

**권한**: 모든 프로젝트 멤버 (MENTOR 포함)

**Request**:
```json
{
  "content": "확인했습니다! CORS 설정을 확인해보세요.",
  "mentions": ["user-456"]
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "comment-123",
    "content": "확인했습니다! CORS 설정을 확인해보세요.",
    "author": {
      "id": "user-789",
      "name": "멘토님",
      "avatar": "https://..."
    },
    "mentions": [
      {
        "id": "user-456",
        "name": "박지승"
      }
    ],
    "createdAt": "2025-11-13T15:00:00Z",
    "updatedAt": "2025-11-13T15:00:00Z"
  }
}
```

---

### 8.2 코멘트 목록 조회

**GET** `/projects/:projectId/tasks/:taskId/comments`

**권한**: 프로젝트 멤버

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-123",
      "content": "확인했습니다! CORS 설정을 확인해보세요.",
      "author": {
        "id": "user-789",
        "name": "멘토님",
        "avatar": "https://..."
      },
      "mentions": [...],
      "createdAt": "2025-11-13T15:00:00Z"
    }
  ]
}
```

---

### 8.3 코멘트 수정

**PATCH** `/projects/:projectId/tasks/:taskId/comments/:commentId`

**권한**: 코멘트 작성자만

**Request**:
```json
{
  "content": "수정된 코멘트 내용"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    // 수정된 코멘트
  }
}
```

---

### 8.4 코멘트 삭제

**DELETE** `/projects/:projectId/tasks/:taskId/comments/:commentId`

**권한**: 코멘트 작성자 또는 PM

**Response (204)**:
```
No Content
```

---

## 9. 알림 API

### 9.1 알림 목록 조회

**GET** `/notifications`

**권한**: 인증된 사용자

**Query Parameters**:
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수
- `unreadOnly`: `true`면 읽지 않은 알림만 조회

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "type": "TASK_ASSIGNED",
      "title": "새 작업이 할당되었습니다",
      "message": "'회원가입 API 연동' 작업이 할당되었습니다",
      "relatedProject": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "쇼핑몰 프로젝트"
      },
      "relatedTask": {
        "id": "task-123",
        "title": "회원가입 API 연동"
      },
      "isRead": false,
      "createdAt": "2025-11-13T14:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### 9.2 알림 읽음 처리

**PATCH** `/notifications/:notificationId/read`

**권한**: 알림 수신자

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "notif-123",
    "isRead": true,
    "readAt": "2025-11-13T15:00:00Z"
  }
}
```

---

### 9.3 모든 알림 읽음 처리

**PATCH** `/notifications/read-all`

**권한**: 인증된 사용자

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "readCount": 15
  }
}
```

---

## 10. 에러 코드

### 10.1 인증/권한 에러

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `UNAUTHORIZED` | 401 | 인증 실패 (토큰 없음/만료) |
| `FORBIDDEN` | 403 | 권한 없음 |
| `INVALID_TOKEN` | 401 | 유효하지 않은 토큰 |

### 10.2 리소스 에러

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `PROJECT_NOT_FOUND` | 404 | 프로젝트를 찾을 수 없음 |
| `TASK_NOT_FOUND` | 404 | Task를 찾을 수 없음 |
| `FILE_NOT_FOUND` | 404 | 파일을 찾을 수 없음 |

### 10.3 비즈니스 로직 에러

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `DUPLICATE_PROJECT_NAME` | 409 | 중복된 프로젝트명 |
| `MEMBER_ALREADY_EXISTS` | 409 | 이미 프로젝트 멤버임 |
| `CANNOT_REMOVE_PM` | 400 | PM은 제거할 수 없음 |
| `FILE_TOO_LARGE` | 413 | 파일 크기 초과 (최대 50MB) |
| `INVALID_FILE_TYPE` | 400 | 허용되지 않는 파일 형식 |

### 10.4 유효성 검사 에러

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `VALIDATION_ERROR` | 400 | 요청 데이터 유효성 검사 실패 |
| `MISSING_REQUIRED_FIELD` | 400 | 필수 필드 누락 |
| `INVALID_DATE_FORMAT` | 400 | 잘못된 날짜 형식 |

### 10.5 서버 에러

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |
| `SERVICE_UNAVAILABLE` | 503 | 서비스 일시 중단 |

---

## 11. 웹소켓 이벤트

### 11.1 연결

**URL**: `wss://api.techbuddy.io/v1/ws`

**인증**: Query parameter로 JWT 토큰 전달
```
wss://api.techbuddy.io/v1/ws?token={access_token}
```

---

### 11.2 프로젝트 채널 구독

**Client → Server**:
```json
{
  "type": "SUBSCRIBE",
  "channel": "project:{projectId}"
}
```

---

### 11.3 실시간 이벤트

#### Task 상태 변경
**Server → Client**:
```json
{
  "type": "TASK_STATUS_CHANGED",
  "data": {
    "taskId": "task-123",
    "taskTitle": "회원가입 API 연동",
    "status": "DONE",
    "changedBy": {
      "id": "user-456",
      "name": "박지승"
    },
    "timestamp": "2025-11-13T14:00:00Z"
  }
}
```

#### Help 요청
**Server → Client** (멘토에게):
```json
{
  "type": "HELP_REQUESTED",
  "data": {
    "taskId": "task-789",
    "taskTitle": "결제 연동",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "projectName": "쇼핑몰 프로젝트",
    "assignee": {
      "id": "user-456",
      "name": "박지승"
    },
    "helpReason": "CORS 에러가 발생합니다",
    "timestamp": "2025-11-13T12:00:00Z"
  }
}
```

#### 새 코멘트
**Server → Client**:
```json
{
  "type": "COMMENT_ADDED",
  "data": {
    "taskId": "task-123",
    "commentId": "comment-456",
    "content": "확인했습니다!",
    "author": {
      "id": "user-789",
      "name": "멘토"
    },
    "mentions": ["user-456"],
    "timestamp": "2025-11-13T14:30:00Z"
  }
}
```

---

## 12. Rate Limiting

### 12.1 제한 정책

| 엔드포인트 카테고리 | 제한 |
|-------------------|------|
| 인증 API | 10 requests / 1분 |
| 일반 API | 100 requests / 1분 |
| 파일 업로드 | 10 requests / 1분 |
| 웹소켓 연결 | 10 connections / 1분 |

### 12.2 Rate Limit 응답 헤더

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699876543
```

### 12.3 Rate Limit 초과 시

**Response (429 Too Many Requests)**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청 횟수 제한을 초과했습니다",
    "retryAfter": 60
  }
}
```

---

## 작성 완료

**문서 버전**: v1.0  
**최종 수정일**: 2025-11-13

---

## 다음 단계

1. ✅ API 명세서 작성 완료
2. ⏭️ DB 스키마 설계
3. ⏭️ NestJS 프로젝트 구조 설계
4. ⏭️ Prisma 스키마 작성
5. ⏭️ API 구현 시작

---

**변경 이력**
- 2025-11-13: v1.0 초안 작성
