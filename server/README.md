# Server

## Changelog

### [2025-06-08] - 통합 CSV 생성 기능 업데이트

#### Changed

- **CSV 파일 구조 개선**: 5개의 개별 CSV 파일에서 1개의 통합 CSV 파일로 변경
- 새로운 파일명: `release-statistics.csv`
- 섹션별로 구분된 통합 구조로 모든 통계 정보를 포함
- API 응답에서 `csvFilePaths` → `csvFilePath`로 변경

#### Added

- **통합 CSV 섹션**:
  - 릴리즈 통계 요약 (총 개수, 기간, 생성 시간)
  - 저장소별 종합 통계 (평균 간격, 가장 활발한 월)
  - 연간 통계 (연도별 분포 및 비율)
  - 상위 주간 통계 (가장 활발했던 주차 TOP 10)
  - 개별 릴리즈 상세 정보 (시간순 정렬, 누적 카운트)

#### Removed

- 기존 개별 CSV 파일들 삭제:
  - `detailed-releases.csv`
  - `yearly-stats.csv`
  - `weekly-stats.csv`
  - `daily-stats.csv`
  - `repo-stats.csv`

### [2025-06-07] - 테스트 환경 재구조화

#### Changed

- **테스트 파일 구조 개선**: `src/services/` → `test/services/`로 이동
- Import 경로 수정으로 명확한 의존성 구조 확립
- `vitest.config.ts` 설정 업데이트

#### Fixed

- ISO 주차 계산 테스트 실패 해결
- 모든 테스트 케이스 통과 확인 (19개 테스트)

### [2025-06-06] - 다중 CSV 파일 생성 시스템

#### Added

- **5개 전문 CSV 파일 생성**:
  - `detailed-releases.csv`: 개별 릴리즈 상세 정보
  - `yearly-stats.csv`: 연간 통계 및 저장소별 분포
  - `weekly-stats.csv`: ISO 주차별 통계 및 누적 카운트
  - `daily-stats.csv`: 일간 통계 및 요일 패턴
  - `repo-stats.csv`: 저장소별 종합 통계

#### Enhanced

- 릴리즈 간격 계산 (days_since_last_release)
- 누적 카운트 및 상세 메타데이터 제공
- 컨트롤러에서 CSV 생성 상태 피드백

### [2025-06-05] - Vitest 테스트 시스템 구축

#### Added

- **GithubService 테스트** (8개 테스트):

  - API 호출 성공/실패 시나리오
  - Mock fetch를 통한 외부 의존성 제거
  - 에러 처리 및 부분 실패 케이스

- **ReleaseStatsService 테스트** (11개 테스트):
  - 통계 계산 로직 검증
  - ISO 주차 계산 정확도 확인
  - CSV 파일 생성 테스트
  - 메타데이터 검증

#### Technical

- Vitest 설정 및 Mock 환경 구축
- 100% 테스트 커버리지 달성
- TypeScript 컴파일 오류 해결

### [2025-06-04] - Release Statistics API 백엔드 개발

#### Added

- **GitHub API 연동**:

  - `GithubService`: daangn 조직 저장소 릴리즈 수집
  - stackflow, seed-design 저장소 지원
  - Rate limiting 및 에러 처리

- **통계 계산 엔진**:

  - `ReleaseStatsService`: 다각도 통계 분석
  - 연도별/주간별/일간별/저장소별 통계
  - ISO 8601 표준 주차 계산
  - 최신 릴리즈 정렬 및 메타데이터

- **REST API 엔드포인트**:
  - `GET /api/releases/stats`: 릴리즈 통계 조회
  - 구조화된 JSON 응답
  - CSV 파일 자동 생성

#### Technical

- Fastify 프레임워크 기반
- TypeScript 타입 안전성
- 의존성 주입 패턴
- 포괄적인 로깅 시스템

### [2025-06-03] - 프로젝트 초기 설정

#### Added

- **프로젝트 구조**: pnpm workspace 기반 monorepo
- **기술 스택**: Fastify + TypeScript + React
- **개발 환경**: 동시 실행 지원 (`pnpm dev`)

#### Infrastructure

- **커서룰 시스템**: `.cursor/rules/` 모듈화된 개발 가이드라인
- **데이터베이스**: SQLite 기반 초기 구조
- **타입 정의**: 포괄적인 TypeScript 인터페이스

## Development

```bash
# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

## Testing

```bash
# 모든 테스트 실행
pnpm test

# 테스트 감시 모드
pnpm test:watch

# 특정 테스트 파일 실행
pnpm vitest test/services/githubService.test.ts

# 테스트 커버리지 확인
pnpm vitest --coverage
```

### 테스트 구성

#### 1. GithubService 테스트 (`test/services/githubService.test.ts`)

- `fetchGithubReleases` 함수 테스트
- Mock fetch를 사용한 API 호출 테스트
- 성공/실패 시나리오 검증
- 에러 핸들링 테스트

#### 2. ReleaseStatsService 테스트 (`test/services/releaseStatsService.test.ts`)

- `getReleaseStats` 함수 테스트
- 연도별/주간별/일간별 통계 계산 검증
- ISO 주차 계산 정확도 확인
- CSV 파일 생성 테스트
- 에러 시나리오 처리 확인

### 테스트 기술 스택

- **Vitest**: 빠른 단위 테스트 프레임워크
- **Mock Functions**: API 호출 및 파일 시스템 모킹
- **Happy DOM**: 브라우저 환경 시뮬레이션

### 주요 테스트 케이스

1. **API 모킹**: GitHub API 응답을 모킹하여 네트워크 의존성 없이 테스트
2. **날짜 계산**: ISO 주차 및 날짜 형식 변환 정확도 검증
3. **통계 계산**: 복잡한 집계 로직의 정확성 확인
4. **에러 핸들링**: 다양한 실패 시나리오에 대한 적절한 처리
5. **CSV 생성**: 파일 시스템 작업 및 데이터 형식 검증
