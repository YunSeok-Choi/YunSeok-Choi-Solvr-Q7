# 릴리즈 분석 대시보드

GitHub 릴리즈 데이터를 시각화하고 분석하는 웹 기반 대시보드입니다.

## 🚀 기능

### 📊 차트 및 시각화

- **시계열 차트**: 날짜별 릴리즈 추이 (일일/누적)
- **파이 차트**: 저장소별, 릴리즈 타입별 분포
- **바 차트**: 요일별, 시간대별, 월별, 분기별 분포
- **히트맵**: 요일 × 시간대 릴리즈 패턴
- **메트릭 카드**: 주요 지표 및 트렌드

### 🔍 필터링

- 날짜 범위 선택
- 저장소별 필터링
- 요일 타입 (평일/주말/휴일)
- 릴리즈 타입 (major/minor/patch/pre-release)
- 시간대별 필터링
- 프리릴리즈/드래프트 포함 옵션

### 📱 반응형 디자인

- 모바일, 태블릿, 데스크톱 지원
- 차트 크기 자동 조정
- 터치 친화적 인터페이스

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript
- **차트**: Recharts
- **스타일링**: Tailwind CSS
- **라우팅**: React Router
- **HTTP 클라이언트**: Axios
- **아이콘**: Lucide React
- **날짜 처리**: date-fns
- **빌드 도구**: Vite

## 📦 설치 및 실행

### 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 테스트

```bash
# 테스트 실행
npm run test

# 테스트 감시 모드
npm run test:watch
```

## 🌐 API 연동

### 환경 변수

`.env` 파일을 생성하고 API 서버 URL을 설정하세요:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### API 엔드포인트

- `GET /api/dashboard` - 전체 대시보드 데이터
- `GET /api/dashboard/metrics` - 메트릭만
- `GET /api/dashboard/aggregations` - 집계 데이터만
- `GET /api/dashboard/timeseries` - 시계열 데이터만
- `GET /api/dashboard/raw` - Raw 데이터 (페이지네이션)

## 📊 차트 구성

### 메트릭 카드

주요 지표를 카드 형태로 표시:

- 총 릴리즈 수
- 평균 릴리즈 간격
- 주말 릴리즈 비율
- 프리릴리즈 비율

### 시계열 차트

- X축: 날짜
- Y축: 릴리즈 수
- 일일 릴리즈 수와 누적 릴리즈 수 표시
- 줌 및 팬 기능 지원

### 분포 차트

- **저장소별 분포**: 파이 차트
- **릴리즈 타입별 분포**: 도넛 차트
- **요일별 분포**: 바 차트
- **시간대별 분포**: 바 차트

### 히트맵

- X축: 요일 (일~토)
- Y축: 시간대 (새벽/오전/오후/저녁)
- 색상 강도: 릴리즈 수

## 🎨 커스터마이징

### 차트 색상

각 차트의 색상은 `colorScheme` prop으로 변경 가능:

```tsx
<PieChart data={data} colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']} />
```

### 새로운 차트 추가

1. `components/charts/` 에 새 차트 컴포넌트 생성
2. `pages/Dashboard.tsx` 에서 import 및 사용
3. 필요시 새로운 API 엔드포인트 추가

### 필터 옵션 추가

1. `types/dashboard.ts` 에서 `DashboardFilters` 타입 확장
2. `components/dashboard/FilterPanel.tsx` 에서 UI 추가
3. `services/dashboardService.ts` 에서 쿼리 파라미터 처리

## 📱 모바일 지원

- 반응형 그리드 레이아웃
- 터치 제스처 지원
- 작은 화면에 최적화된 차트 크기
- 모바일에서 필터 패널 축소

## 🔧 개발 가이드

### 컴포넌트 구조

```
src/
├── components/
│   ├── charts/          # 차트 컴포넌트
│   └── dashboard/       # 대시보드 컴포넌트
├── pages/              # 페이지 컴포넌트
├── services/           # API 서비스
├── types/              # TypeScript 타입
└── utils/              # 유틸리티 함수
```

### 타입 안정성

모든 컴포넌트는 TypeScript로 작성되어 타입 안정성을 보장합니다.

### 성능 최적화

- React.memo로 불필요한 리렌더링 방지
- 대용량 데이터셋 지원을 위한 가상화
- 차트 데이터 캐싱

## 🤝 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성

## 📄 라이선스

MIT License
