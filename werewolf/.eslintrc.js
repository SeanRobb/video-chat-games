module.exports = {
  "env": {
      "node": true,
      "es6": true
  },
  "extends": "google",
  "rules": {
    "require-jsdoc": "off",
    "indent": ["error", 2],
    "newline-per-chained-call": ["error", { "ignoreChainWithDepth": 2 }]
  }
};
