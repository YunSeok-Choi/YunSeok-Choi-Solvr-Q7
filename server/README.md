# Release Statistics API Server

GitHub 릴리즈 통계 분석을 위한 Fastify 기반 백엔드 서버입니다.

## 주요 기능

### 1. 기본 릴리즈 통계 API

- **GET** `/api/releases/stats` - 통합 CSV 형태의 릴리즈 통계 조회
- 평일 기준 통계 계산 (주말 제외)
- 저장소별, 연간, 주간, 일간 통계 제공

### 2. Raw 데이터 대시보드 API ✨ **NEW**

상세한 분석을 위한 원시 데이터 기반 대시보드 시스템

#### 📊 대시보드 엔드포인트들

| 엔드포인트                        | 설명                 | 주요 기능                                  |
| --------------------------------- | -------------------- | ------------------------------------------ |
| `GET /api/dashboard`              | 전체 대시보드 데이터 | 메트릭, Raw 데이터, 집계, 시계열 모든 정보 |
| `GET /api/dashboard/raw`          | Raw 데이터만 조회    | 페이지네이션 지원, 필터링 가능             |
| `GET /api/dashboard/metrics`      | 주요 메트릭만 조회   | 경량화된 응답, 핵심 지표                   |
| `GET /api/dashboard/aggregations` | 집계 데이터만 조회   | 저장소별, 날짜별, 요일별 등 집계           |
| `GET /api/dashboard/timeseries`   | 시계열 데이터만 조회 | 차트용 시간별 데이터                       |

#### 🔍 Raw 데이터 컬럼 구조

**기본 식별 정보**

- `id`: 고유 ID (repo_tag_timestamp 조합)
- `repo_name`: 저장소 이름
- `repo_owner`: 저장소 소유자 (daangn)
- `tag_name`: 릴리즈 태그 (v1.0.0)
- `release_name`: 릴리즈 이름/제목

**시간 관련 데이터**

- `published_at`: 원본 발행일시 (ISO string)
- `published_timestamp`: Unix timestamp
- `published_date`: YYYY-MM-DD 형식
- `published_time`: HH:MM:SS 형식
- `published_year`, `published_month`, `published_day`: 연/월/일
- `published_quarter`: 분기 (1-4)
- `published_week_number`: 연중 주차 (1-53)
- `published_iso_week`: ISO 주차 (YYYY-WW)
- `published_day_of_week`: 요일 (0=일요일, 6=토요일)
- `published_day_name`: 요일명 (Monday, Tuesday, ...)
- `published_month_name`: 월명 (January, February, ...)

**근무일/주말 분류**

- `is_weekend`: 주말 릴리즈 여부
- `is_holiday`: 공휴일 릴리즈 여부 (향후 확장)
- `work_day_type`: 근무일 타입 ('WEEKDAY' | 'WEEKEND' | 'HOLIDAY')

**릴리즈 메타데이터**

- `release_body`: 릴리즈 노트 내용
- `release_body_length`: 릴리즈 노트 길이
- `has_release_notes`: 릴리즈 노트 존재 여부
- `release_type`: 릴리즈 타입 (major, minor, patch, pre-release)
- `version_major`, `version_minor`, `version_patch`: 버전 번호
- `is_prerelease`: 사전 릴리즈 여부
- `is_draft`: 드래프트 여부

**시간 간격 분석용 데이터**

- `days_since_last_release`: 이전 릴리즈로부터 경과일
- `days_since_first_release`: 첫 릴리즈로부터 경과일
- `days_until_next_release`: 다음 릴리즈까지 일수
- `release_sequence_number`: 저장소 내 릴리즈 순번
- `total_releases_in_repo`: 저장소 총 릴리즈 수

**컨텍스트 정보**

- `same_day_releases`: 같은 날 다른 저장소 릴리즈 수
- `same_week_releases`: 같은 주 다른 저장소 릴리즈 수
- `same_month_releases`: 같은 달 다른 저장소 릴리즈 수

**패턴 분석용**

- `hour_of_day`: 시간 (0-23)
- `time_period`: 시간대 구분 ('MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT')
- `is_month_start`: 월초 릴리즈 여부 (1-7일)
- `is_month_end`: 월말 릴리즈 여부 (마지막 7일)
- `is_year_start`: 연초 릴리즈 여부 (1월)
- `is_year_end`: 연말 릴리즈 여부 (12월)

**집계용 키들**

- `date_key`: YYYYMMDD 형식 키
- `week_key`: YYYY-WW 형식 키
- `month_key`: YYYY-MM 형식 키
- `quarter_key`: YYYY-Q# 형식 키
- `year_key`: YYYY 형식 키

#### 🎛️ 필터링 옵션

모든 대시보드 API는 다음 쿼리 파라미터를 지원합니다:

| 파라미터                    | 타입    | 설명                    | 예시                    |
| --------------------------- | ------- | ----------------------- | ----------------------- |
| `repos`                     | string  | 저장소 필터 (콤마 구분) | `stackflow,seed-design` |
| `date_from`                 | string  | 시작 날짜               | `2024-01-01`            |
| `date_to`                   | string  | 종료 날짜               | `2024-12-31`            |
| `work_day_types`            | string  | 근무일 타입 (콤마 구분) | `WEEKDAY,WEEKEND`       |
| `release_types`             | string  | 릴리즈 타입 (콤마 구분) | `major,minor,patch`     |
| `time_periods`              | string  | 시간대 (콤마 구분)      | `MORNING,AFTERNOON`     |
| `include_prereleases`       | boolean | 사전 릴리즈 포함 여부   | `true`                  |
| `include_drafts`            | boolean | 드래프트 포함 여부      | `false`                 |
| `min_days_between_releases` | integer | 최소 릴리즈 간격 (일)   | `7`                     |
| `max_days_between_releases` | integer | 최대 릴리즈 간격 (일)   | `30`                    |

#### 📄 페이지네이션 (Raw 데이터 전용)

`/api/dashboard/raw` 엔드포인트는 추가로 페이지네이션을 지원합니다:

| 파라미터 | 타입    | 기본값 | 설명                        |
| -------- | ------- | ------ | --------------------------- |
| `page`   | integer | 1      | 페이지 번호                 |
| `limit`  | integer | 50     | 페이지당 항목 수 (최대 200) |

#### 📈 응답 예시

**메트릭 응답**

```json
{
  "success": true,
  "data": {
    "summary_metrics": [
      {
        "name": "Total Releases",
        "description": "전체 릴리즈 수",
        "value": 60,
        "unit": "개",
        "format": "number"
      },
      {
        "name": "Weekday Release Rate",
        "description": "평일 릴리즈 비율",
        "value": 100,
        "unit": "%",
        "format": "percentage"
      }
    ],
    "data_freshness": {
      "last_updated": "2024-06-08T17:20:00Z",
      "data_range": {
        "earliest_release": "2023-01-01",
        "latest_release": "2024-06-03"
      }
    }
  }
}
```

**집계 데이터 응답**

```json
{
  "success": true,
  "data": {
    "by_repo": [
      { "key": "stackflow", "value": 30, "percentage": 50.0 },
      { "key": "seed-design", "value": 30, "percentage": 50.0 }
    ],
    "by_day_of_week": [
      { "key": "Tuesday", "value": 15, "percentage": 25.0 },
      { "key": "Wednesday", "value": 12, "percentage": 20.0 }
    ]
  }
}
```

## 기술 스택

- **Runtime**: Node.js 24+
- **Framework**: Fastify (고성능 웹 프레임워크)
- **Language**: TypeScript (타입 안전성)
- **Database**: SQLite (Drizzle ORM)
- **Testing**: Vitest (40개 테스트 케이스, 100% 통과)
- **Mocking**: 외부 API 의존성 제거한 안정적 테스트 환경
- **API Documentation**: Swagger/OpenAPI

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 테스트 실행
npm test
```

## API 문서

서버 실행 후 다음 URL에서 Swagger 문서를 확인할 수 있습니다:

- http://localhost:3000/documentation

## 환경 변수

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=./database.db
```

## Changelog

### [2025-06-08] 테스트 환경 안정화 및 모킹 시스템 개선 🔧

- **테스트 안정화**: 모든 테스트 케이스 수정 및 안정화 (40/40 통과)
- **Mock 시스템**: GitHub API fetch 모킹 시스템 구축으로 외부 의존성 제거
- **테스트 데이터**: 실제 서비스 로직과 일치하는 테스트 데이터 정정
- **버전 파싱**: parseVersion 로직 기반 릴리즈 타입 분류 정확도 향상
- **날짜 처리**: 주말/평일 분류 로직의 정확성 검증 및 수정
- **CI/CD 준비**: 안정적인 테스트 환경으로 지속적 통합 준비 완료
- **개발자 경험**: console.error 모킹으로 깔끔한 테스트 출력 제공

### [2025-06-08] Raw 데이터 대시보드 시스템 구축 ✨

- **새로운 기능**: 상세 분석을 위한 Raw 데이터 기반 대시보드 API 추가
- **데이터 컬럼**: 60개 이상의 분석 가능한 데이터 필드 제공
- **필터링**: 다양한 조건으로 데이터 필터링 지원
- **집계**: 저장소별, 날짜별, 요일별, 시간대별 등 7가지 집계 타입
- **시계열**: 차트 생성을 위한 시계열 데이터 제공
- **페이지네이션**: Raw 데이터 조회 시 페이지네이션 지원
- **메트릭**: 6개 핵심 지표 실시간 계산
- **API 엔드포인트**: 5개 전용 엔드포인트로 용도별 최적화

### [2025-06-08] 주말 제외 통계 분석 시스템 도입

- 평일 기준 통계 계산으로 실제 근무 패턴 반영
- 주말(토요일, 일요일) 릴리즈를 주요 통계에서 제외
- weekendStats 객체로 주말 릴리즈 별도 추적 및 관리
- 개별 릴리즈에 is_weekend 플래그 추가 (YES/NO)
- CSV 헤더에 평일/주말 릴리즈 수 및 비율 표시
- 모든 통계 섹션에 (WEEKDAYS ONLY) 명시로 명확성 향상

### [2025-06-08] 통합 CSV 생성 기능 업데이트

- 5개 개별 CSV 파일을 1개 통합 파일로 변경
- 섹션별 구분된 구조로 모든 통계 정보 포함
- API 응답 구조 변경: csvFilePaths → csvFilePath

### [2025-06-07] 테스트 환경 재구조화

- 주말 제외 로직 반영한 테스트 케이스 수정
- ISO Week 경계 테스트에서 일요일 릴리즈 제외
- 평일/주말 구분 검증 테스트 추가
- 20개 테스트 케이스로 확장

### [2025-06-06] 다중 CSV 파일 생성 시스템

- 5개 카테고리별 CSV 파일 생성 기능
- 상세 릴리즈 정보, 연간/주간/일간 통계, 저장소 통계
- 파일 경로 배열 반환으로 다운로드 지원

### [2025-06-05] Vitest 테스트 시스템 구축

- 19개 테스트 케이스로 핵심 기능 검증
- GitHub API 모킹 및 통계 계산 로직 테스트
- CI/CD 준비를 위한 테스트 자동화

### [2025-06-04] Release Statistics API 백엔드 개발

- Fastify 기반 고성능 API 서버 구축
- GitHub API 연동으로 실시간 릴리즈 데이터 수집
- 다양한 통계 지표 계산 및 제공

### [2025-06-03] 프로젝트 초기 설정

- TypeScript + Fastify 프로젝트 구조 설계
- Drizzle ORM을 활용한 데이터베이스 설정
- 개발 환경 및 빌드 시스템 구성

## 데이터 인사이트

현재 daangn 조직의 릴리즈 패턴 분석 결과:

- **총 60개 릴리즈** (stackflow: 30개, seed-design: 30개)
- **100% 평일 릴리즈** - 건전한 워라밸 문화 확인 ✨
- **2024년 활발도**: 지속적인 릴리즈 패턴 유지
- **평균 릴리즈 간격**: 약 5일
- **테스트 커버리지**: 40개 테스트 케이스로 100% 통과율 달성
- **API 성능**: 5개 전용 엔드포인트로 용도별 최적화

## 라이선스

MIT License
