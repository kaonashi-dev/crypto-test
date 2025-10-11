import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			
			// General best practices
			'no-console': 'warn',
			'no-debugger': 'error',
			'no-unused-vars': 'off', // Use TypeScript version instead
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/prefer-const': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			
			// Svelte specific rules
			'svelte/no-at-html-tags': 'error',
			'svelte/no-target-blank': 'error',
			'svelte/no-useless-mustaches': 'error',
			'svelte/prefer-class-directive': 'error',
			'svelte/prefer-style-directive': 'error',
			'svelte/no-reactive-functions': 'error',
			'svelte/no-reactive-literals': 'error',
			'svelte/require-each-key': 'error',
			'svelte/require-optimized-style-attribute': 'error',
			'svelte/require-slot-generic-type': 'error',
			'svelte/require-stores-init': 'error',
			'svelte/require-typed-reactive': 'error',
			'svelte/require-using-vars': 'error',
			'svelte/valid-compile': 'error',
			'svelte/no-dom-manipulating': 'error',
			'svelte/no-dupe-else-if-blocks': 'error',
			'svelte/no-dupe-on-directives': 'error',
			'svelte/no-dupe-style-properties': 'error',
			'svelte/no-dupe-use-directives': 'error',
			'svelte/no-dynamic-slot-name': 'error',
			'svelte/no-fallthrough-block': 'error',
			'svelte/no-ignored-unbound': 'error',
			'svelte/no-inner-declarations': 'error',
			'svelte/no-not-function-handler': 'error',
			'svelte/no-object-in-text-mustaches': 'error',
			'svelte/no-reactive-assignments': 'error',
			'svelte/no-reactive-reassignment': 'error',
			'svelte/no-shorthand-style-property-overrides': 'error',
			'svelte/no-spaces-around-equal-signs-in-attribute': 'error',
			'svelte/no-unknown-style-directive-property': 'error',
			'svelte/no-unused-svelte-ignore': 'error',
			'svelte/no-useless-concat': 'error',
			'svelte/no-useless-fragment': 'error',
			'svelte/no-var': 'error',
			'svelte/prefer-destructured-store-props': 'error',
			'svelte/prefer-svelte-else': 'error',
			'svelte/prefer-svelte-for': 'error',
			'svelte/prefer-svelte-if': 'error',
			'svelte/prefer-svelte-on': 'error',
			'svelte/require-store-callbacks-use-set-param': 'error',
			'svelte/require-store-reactive-return': 'error',
			'svelte/valid-each-key': 'error',
			'svelte/valid-each-segment': 'error',
			'svelte/valid-style-directive': 'error',
			'svelte/valid-using': 'error'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);
