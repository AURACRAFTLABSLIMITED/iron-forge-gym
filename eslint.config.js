/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: eslint.config.js
 * Purpose: ESLint configuration including @firebase/eslint-plugin-security-rules
 *          to audit Firestore security rules for vulnerabilities.
 */

import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
