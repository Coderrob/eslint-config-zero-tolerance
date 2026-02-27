#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const README_PATH = path.resolve(__dirname, '..', 'README.md');
const COVERAGE_SUMMARY_PATH = path.resolve(
  __dirname,
  '..',
  'packages',
  'plugin',
  'coverage',
  'coverage-summary.json',
);
const LCOV_PATH = path.resolve(__dirname, '..', 'packages', 'plugin', 'coverage', 'lcov.info');

const BADGE_PATTERN = /https:\/\/img\.shields\.io\/badge\/coverage-[^)\s]+/;

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
 * Returns line coverage percentage from Jest coverage summary.
 *
 * @param {string} coverageSummaryPath - Path to coverage-summary.json.
 * @returns {number} Rounded line coverage percentage.
 */
function getLineCoverage(coverageSummaryPath) {
  if (fs.existsSync(coverageSummaryPath)) {
    const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
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
  if (!fs.existsSync(lcovPath)) {
    throw new Error('Coverage files not found (coverage-summary.json or lcov.info)');
  }
  const lcov = fs.readFileSync(lcovPath, 'utf8');
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
  const readme = fs.readFileSync(readmePath, 'utf8');
  if (!BADGE_PATTERN.test(readme)) {
    throw new Error('README does not contain a coverage badge URL to update');
  }
  const nextReadme = readme.replace(BADGE_PATTERN, badgeUrl);
  fs.writeFileSync(readmePath, nextReadme);
}

function main() {
  const coverage = getLineCoverage(COVERAGE_SUMMARY_PATH);
  updateReadmeCoverageBadge(README_PATH, coverage);
  console.log(`Updated README coverage badge to ${coverage}%`);
}

main();
