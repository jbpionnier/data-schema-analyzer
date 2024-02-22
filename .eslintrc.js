/* eslint-disable no-undef, quote-props, unicorn/no-useless-spread */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    project: true,
    ecmaFeatures: {
      impliedStrict: true,
      jsx: false,
    },
  },
  plugins: ['@typescript-eslint', 'jest'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:jest/recommended',
  ],
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'id-length': 'warn',
    'strict': 'error',
    'no-import-assign': 'error',
    'no-useless-return': 'error',
    'func-names': 'error',
    'require-await': 'error',

    // @deprecated
    'no-extra-semi': 'off',
    'comma-dangle': 'off',
    'operator-linebreak': 'off',

    // recommended off
    'no-mixed-operators': 'off',
    'no-empty-function': 'off',
    'max-params': 'off',
    'no-implicit-coercion': 'off',
    'callback-return': 'off',
    'no-shadow': 'off', // ?
    'no-use-before-define': 'off', // ?
    // "no-unused-vars": "off", // ?

    // Complexity
    'max-lines': ['warn', { 'max': 500, 'skipBlankLines': true, 'skipComments': true }],
    'max-depth': ['warn', 2],
    'max-nested-callbacks': ['warn', 3],
    // 'max-statements': ['warn', 15],
    // 'complexity': ['warn', 14],

    // Typescript: enable specific rules
    '@typescript-eslint/no-unnecessary-qualifier': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-this-alias': 'error',
    '@typescript-eslint/no-unnecessary-type-arguments': 'error',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
    '@typescript-eslint/prefer-reduce-type-parameter': 'error',
    '@typescript-eslint/member-delimiter-style': ['error', { 'multiline': { 'delimiter': 'none' }, 'singleline': { 'delimiter': 'semi' } }],
    '@typescript-eslint/explicit-function-return-type': ['error', { 'allowExpressions': true }],
    '@typescript-eslint/prefer-destructuring': 'error',
    '@typescript-eslint/prefer-regexp-exec': 'error',

    // Typescript: disable recommended rules
    'indent': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off', // ?
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/prefer-literal-enum-member': 'off',
    '@typescript-eslint/indent': 'off', // ?
    '@typescript-eslint/no-explicit-any': 'off', // ?
    '@typescript-eslint/no-var-requires': 'off', // ?
    '@typescript-eslint/no-object-literal-type-assertion': 'off', // ?
    '@typescript-eslint/ban-types': 'off', // ?
    '@typescript-eslint/explicit-module-boundary-types': 'off', // ?
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    // unsafe ?
    '@typescript-eslint/no-unsafe-call': 'off', // ?
    '@typescript-eslint/no-unsafe-member-access': 'off', // ?
    '@typescript-eslint/no-unsafe-assignment': 'off', // ?
    '@typescript-eslint/no-unsafe-return': 'off', // ?
    '@typescript-eslint/no-unsafe-argument': 'off', // ?
    '@typescript-eslint/restrict-template-expressions': 'off', // ?
    '@typescript-eslint/require-await': 'off', // ?
    '@typescript-eslint/no-unused-vars': 'off', // ?
    '@typescript-eslint/no-redundant-type-constituents': 'off', // ?
    '@typescript-eslint/no-non-null-assertion': 'off', // ?

    // Typescript: disable specific rules stylistic
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
  },
  overrides: [
    {
      files: [
        '*.spec.ts',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: 'tsconfig.spec.json',
        sourceType: 'module',
      },
      rules: {
        'jest/no-test-callback': 'off',
        'jest/no-commented-out-tests': 'off',
        'jest/no-disabled-tests': 'off',
        'jest/no-test-return-statement': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/prefer-spy-on': 'error',
        'id-length': 'off',
        'max-nested-callbacks': ['warn', 4],
      },
    }, {
      files: [
        '**/benchmarks/**/*.ts',
      ],
      rules: {
        'id-length': 'off',
      },
    }
  ],
}
