#!/usr/bin/env node

/**
 * Copyright 2026 Robert Lindley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const repoRoot = resolve(currentDirPath, '..');

const README_PATH = resolve(repoRoot, 'README.md');
const COVERAGE_SUMMARY_PATH = resolve(
  repoRoot,
  'packages',
  'plugin',
  'coverage',
  'coverage-summary.json',
);
const LCOV_PATH = resolve(repoRoot, 'packages', 'plugin', 'coverage', 'lcov.info');

const BADGE_PATTERN = /https:\/\/img\.shields\.io\/badge\/coverage-[^)"\s]+/;

/**
 * Returns a shields color based on coverage percentage.
 *
 * @param {number} percentage - Coverage percentage.
 * @returns {string} Shields color token.
 */
function getCoverageColor(percentage) {
  if (percentage >= 95) {
    return 'brightgreen';
  }
  if (percentage >= 90) {
    return 'green';
  }
  if (percentage >= 80) {
    return 'yellow';
  }
  if (percentage >= 70) {
    return 'orange';
  }
  return 'red';
}

/**
 * Returns line coverage percentage from Jest coverage summary or lcov fallback.
 *
 * @param {string} coverageSummaryPath - Path to coverage-summary.json.
 * @returns {number} Rounded line coverage percentage.
 */
function getLineCoverage(coverageSummaryPath) {
  if (existsSync(coverageSummaryPath)) {
    const summary = JSON.parse(readFileSync(coverageSummaryPath, 'utf8'));
    const lineCoverage = summary?.total?.lines?.pct;
    if (typeof lineCoverage === 'number') {
      return Math.round(lineCoverage * 100) / 100;
    }
  }
  return getLineCoverageFromLcov(LCOV_PATH);
}

/**
 * Returns line coverage percentage by parsing lcov.info.
 *
 * @param {string} lcovPath - Path to lcov.info.
 * @returns {number} Rounded line coverage percentage.
 */
function getLineCoverageFromLcov(lcovPath) {
  if (!existsSync(lcovPath)) {
    throw new Error('Coverage files not found (coverage-summary.json or lcov.info)');
  }
  const lcov = readFileSync(lcovPath, 'utf8');
  const totalFound = [...lcov.matchAll(/^LF:(\d+)$/gm)].reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  );
  const totalHit = [...lcov.matchAll(/^LH:(\d+)$/gm)].reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  );
  if (totalFound === 0) {
    throw new Error('Could not calculate line coverage from lcov.info');
  }
  return Math.round((totalHit / totalFound) * 10000) / 100;
}

/**
 * Updates the coverage badge URL in README.md.
 *
 * @param {string} readmePath - Path to README.md.
 * @param {number} coverage - Line coverage percentage.
 */
function updateReadmeCoverageBadge(readmePath, coverage) {
  const color = getCoverageColor(coverage);
  const encodedCoverage = `${coverage}%25`;
  const badgeUrl = `https://img.shields.io/badge/coverage-${encodedCoverage}-${color}`;
  const readme = readFileSync(readmePath, 'utf8');
  if (!BADGE_PATTERN.test(readme)) {
    throw new Error('README does not contain a coverage badge URL to update');
  }
  const nextReadme = readme.replace(BADGE_PATTERN, badgeUrl);
  writeFileSync(readmePath, nextReadme);
}

function main() {
  const coverage = getLineCoverage(COVERAGE_SUMMARY_PATH);
  updateReadmeCoverageBadge(README_PATH, coverage);
  console.log(`Updated README coverage badge to ${coverage}%`);
}

main();
