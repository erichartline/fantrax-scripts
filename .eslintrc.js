module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // Code quality
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-console": "off", // Allow console.log in CLI tools
    "no-debugger": "error",
    "no-unreachable": "error",

    // Style
    indent: ["error", 2],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double", { allowTemplateLiterals: true }],
    semi: ["error", "always"],
    "comma-dangle": ["error", "never"],
    "trailing-comma": "off",

    // Best practices
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-new-wrappers": "error",

    // ES6+
    "prefer-const": "error",
    "no-var": "error",
    "arrow-spacing": "error",
    "template-curly-spacing": "error",

    // Node.js specific
    "no-process-exit": "off", // Allow process.exit in CLI tools
    "no-path-concat": "error",
  },
  overrides: [
    {
      files: ["tests/**/*.js"],
      env: {
        jest: true,
      },
      rules: {
        "no-unused-expressions": "off",
      },
    },
    {
      files: ["src/cli/**/*.js", "bin/**/*"],
      rules: {
        "no-process-exit": "off", // Allow process.exit in CLI tools
      },
    },
  ],
};
