/**
 * Main entry point for the fantrax-scripts library
 *
 * This module exports the core functionality from all library modules:
 * - IBW converter functions for parsing Imaginary Brick Wall data
 * - Prospect matcher functions for finding matches between Fantrax and IBW data
 * - CSV utilities for reading, writing, and validating CSV files
 */

// IBW Converter functions
const { parseIBWText, parseIBWFile } = require("./ibwConverter");

// Prospect Matcher functions
const {
  findMatches,
  formatMatchResults,
  createPlayerMaps,
  createMatchKey,
  getFieldValue,
  validateColumns,
} = require("./prospectMatcher");

// CSV Utilities
const {
  readCSV,
  objectsToCSV,
  writeCSV,
  validateHeaders,
  getColumnByIndex,
} = require("./csvUtils");

// Export all functions
module.exports = {
  // IBW Converter
  parseIBWText,
  parseIBWFile,

  // Prospect Matcher
  findMatches,
  formatMatchResults,
  createPlayerMaps,
  createMatchKey,
  getFieldValue,
  validateColumns,

  // CSV Utils
  readCSV,
  objectsToCSV,
  writeCSV,
  validateHeaders,
  getColumnByIndex,
};
