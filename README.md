# Realtor CRM 🏡

리얼터를 위한 심플한 손님 관리(CRM) 웹앱입니다.

## 기능

- **스마트 자동 정렬**: 연락이 늦어진 손님 → 오늘 연락할 손님 → 곧 연락할 손님 순서. Hot/계약 진행 상태, 가까운 구매 예정일, 오래 연락 안 한 손님에게 가산점이 붙습니다 (`src/lib/sorting.ts`).
  다음 컨택일, 마지막 컨택일, 구매 예정일, 이름, 최근 수정 순으로도 정렬할 수 있습니다.
- **손님 정보**: 상태(신규/진행 중/Hot/계약 진행/거래 완료/장기 관리/종료), 매수·매도 구분, 예산, 희망 지역, 연락처, 메모
- **날짜 관리**: 마지막 컨택일, 다음 컨택 예정일(+1일/+3일/+1주… 원클릭 미루기), 집 구매 예정일
- **대화 기록**: 전화/문자/이메일/미팅/쇼잉별 타임라인. 기록을 추가하면 마지막 컨택일이 자동 업데이트됩니다.
- **대시보드**: 연락 지연 / 오늘 / 이번 주 / 30일 내 구매 예정 카운트 (클릭해서 필터링)
- **팔로업 제안**: 다음 연락일 + 메시지 초안 생성 (현재는 규칙 기반, AI로 교체할 수 있게 설계)
- 검색, 상태 필터, JSON 백업 내보내기/불러오기, 모바일 화면과 다크 모드 지원

데이터는 현재 브라우저 `localStorage`에 저장됩니다. 기기나 브라우저를 바꾸면 데이터가 따라오지 않으니 메뉴(⋯)에서 백업을 내보내 두세요.

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm test         # 정렬 로직 테스트
npm run build    # 배포용 빌드 (dist/)
```

`dist/`는 정적 파일이라 Vercel, Netlify, GitHub Pages 등에 바로 올릴 수 있습니다.

## 구조

```
src/
  types.ts               데이터 모델 (Client, Interaction)
  lib/sorting.ts         스마트 정렬 / 우선순위 점수
  lib/dates.ts           날짜 유틸
  data/repository.ts     저장소 인터페이스 (현재 localStorage)
  data/useClients.ts     상태 관리 훅
  ai/followUp.ts         팔로업 제안 Provider (규칙 기반 + AI 연동 자리)
  components/            UI
```

## 나중에 AI 팔로업 자동화 붙이기

`src/ai/followUp.ts`의 `FollowUpProvider` 인터페이스만 구현하면 UI 변경 없이 교체됩니다.

1. API 키를 보관하는 작은 서버 엔드포인트를 만듭니다 (키는 절대 브라우저에 넣지 않기). 요청 body의 `prompt`(`buildFollowUpPrompt()` 결과)를 LLM에 보내고
   `{ nextContactDate, channel, reason, draftMessage }` JSON을 돌려주면 됩니다.
2. `.env.local`에 `VITE_AI_ENDPOINT=https://.../follow-up`을 설정하면 자동으로 `RemoteAIProvider`가 사용됩니다. 실패하면 규칙 기반으로 돌아갑니다.
3. 완전 자동화(매일 아침 연락 지연 손님에게 보낼 초안 생성 등)는 데이터를 서버 DB로 옮긴 뒤 (`ClientRepository` 구현 추가) 서버 스케줄러에서 같은 프롬프트를 재사용하면 됩니다.
