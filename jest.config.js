/** @type {import('jest').Config} */
const config = {
    verbose: false,
    globalSetup: './tests/setup.js',
    globalTeardown: './tests/teardown.js',
};

module.exports = config;
