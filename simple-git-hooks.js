export default {
  'pre-commit': 'pnpm lint-staged',
  'commit-msg': 'pnpm commitlint --edit "$1"',
};
