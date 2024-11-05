import { ESLintUtils } from '@typescript-eslint/utils';
import { repoUrl } from '../const';

export const rulesDocsBaseUrl = `${repoUrl}/docs/rules`;

export const createRule = ESLintUtils.RuleCreator((name) => `${rulesDocsBaseUrl}/${name}.md`);
