// Conventional Commits + AGENTS.md File ownership 의 영역 슬러그 강제.
// scope 미정의 시 에러. 변경 시 AGENTS.md "Branch / commit convention" 섹션 동기 유지.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'stamp', // src/features/stamp/
        'map', // src/features/map/
        'tour', // src/features/tour/
        'core', // src/core/* (network/location/storage/auth)
        'shared', // src/shared/*
        'app', // app/ 라우트
        'harness', // ESLint·CI·문서·skills 등 인프라
        'docs', // README/AGENTS/CLAUDE/docs/skills 본문 수정
        'deps', // 의존성 bump
      ],
    ],
    'scope-empty': [2, 'never'], // scope 필수
    'subject-case': [0], // 한글 메시지 허용 — case 룰 끔
    'body-max-line-length': [1, 'always', 200], // 한 줄 200자까지 허용 (한글 가독성)
  },
};
