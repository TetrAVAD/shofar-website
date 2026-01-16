
## System Review - 2024-01-14

### 발견된 문제점

- [x] "학습 시작하기" 버튼이 아무 동작도 하지 않음 (ModuleDetail.tsx)
- [x] Supabase 인증 시스템이 tRPC 기반 Manus Auth로 마이그레이션 필요
- [x] 게시판(Board.tsx)이 Supabase에 의존 - tRPC로 마이그레이션 필요
- [x] AuthContext.tsx가 Supabase 사용 - Manus Auth로 교체 필요
- [x] Auth.tsx 로그인 페이지가 Supabase 사용 - Manus Auth로 교체 필요
- [x] 커리큘럼 페이지(/curriculum)가 미구현 상태
- [x] 학습 진도 추적 기능 없음
- [x] 체크리스트 체크 상태 저장 기능 없음

## 새로운 요구사항 - 2024-01-14 (2차)

- [x] Gmail 계정 로그인으로 쉽게 회원가입 가능하도록 구현
- [x] 비회원 접근 시 화면 가운데에 회원가입 안내 버튼 표시
- [x] MD 파일 내용 기반 텍스트 교육 형태로 홈페이지 재구성 (/learn 페이지 생성)
- [ ] 전체 시스템 문제점 재점검 및 수정

## 추가 작업 - 2024-01-14 (3차)

- [x] 모든 모듈 페이지에서 하드코딩된 참고 자료 PDF 파일 목록 삭제

## Google OAuth 오류 수정 - 2024-01-14

- [ ] redirect_uri_mismatch 오류 원인 파악 및 수정
