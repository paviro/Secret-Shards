/** @type {import('jest').Config} */
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverageFrom: [
        'src/lib/encryption/**/*.ts',
        'src/lib/protocol/**/*.ts',
        '!**/__tests__/**',
        '!**/*.d.ts',
    ],
    coverageDirectory: 'coverage',
    verbose: true,
};

module.exports = config;
