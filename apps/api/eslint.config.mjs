import { config as baseConfig } from '@repo/eslint-config/base'
import globals from 'globals'

/**
 * ESLint configuration for the Fastify API (Node.js runtime).
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ['dist/**', 'coverage/**'],
  },
]
