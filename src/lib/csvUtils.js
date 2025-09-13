const fs = require("fs");
const { parse } = require("csv-parse/sync");

/**
 * Reads and parses a CSV file
 * @param {string} filePath - Path to the CSV file
 * @param {Object} options - Parsing options
 * @returns {Array} Array of objects representing CSV rows
 */
function readCSV(filePath, options = {}) {
  const defaultOptions = {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  };

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const records = parse(content, { ...defaultOptions, ...options });

    if (records.length === 0) {
      throw new Error(
        `CSV file is empty or contains no valid data: ${filePath}`
      );
    }

    return records;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`CSV file not found: ${filePath}`);
    }
    // csv-parse errors often contain parsing-related error messages
    if (
      error.message &&
      (error.message.includes("Quote") ||
        error.message.includes("parse") ||
        error.code === "CSV_PARSE_ERROR")
    ) {
      throw new Error(
        `Invalid CSV format in file: ${filePath}. ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Reads and parses a CSV file with custom column mapping for IBW format
 * @param {string} filePath - Path to the CSV file
 * @returns {Array} Array of objects representing CSV rows
 */
function readIBWCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const records = parse(content, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      throw new Error(
        `CSV file is empty or contains no valid data: ${filePath}`
      );
    }

    // Convert to objects with proper column names and filter out FYPD entries
    return records
      .filter((row) => {
        // Filter out FYPD entries - they have "FYPD-X" in column 2
        return !row[2] || !row[2].toString().includes('FYPD');
      })
      .map((row, index) => ({
        "0": row[0], // Overall rank
        "1": row[1], // Secondary rank
        "2": row[2], // Tertiary rank
        "3": row[3], // Some other data
        "4": row[4], // More data
        "5": row[5], // Player name
        "6": row[6], // Team
        "7": row[7], // Position
        "8": row[8], // Age
        "9": row[9], // Description
      }));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`CSV file not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Converts an array of objects to CSV format
 * @param {Array} objects - Array of objects to convert
 * @param {Array} headers - Optional array of header names. If not provided, uses object keys
 * @returns {string} CSV formatted string
 */
function objectsToCSV(objects, headers = null) {
  if (!Array.isArray(objects) || objects.length === 0) {
    throw new Error("Invalid input: objects must be a non-empty array");
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(objects[0]);

  // Validate that all objects have the required headers
  objects.forEach((obj, index) => {
    csvHeaders.forEach((header) => {
      if (!(header in obj)) {
        throw new Error(
          `Missing header "${header}" in object at index ${index}`
        );
      }
    });
  });

  // Create CSV content
  const headerRow = csvHeaders.join(",");
  const dataRows = objects.map((obj) =>
    csvHeaders
      .map((header) => {
        const value = obj[header] || "";
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (
          typeof value === "string" &&
          (value.includes(",") || value.includes('"') || value.includes("\n"))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      })
      .join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Writes CSV content to a file
 * @param {string} filePath - Path where to write the CSV file
 * @param {string} csvContent - CSV formatted content
 */
function writeCSV(filePath, csvContent) {
  try {
    fs.writeFileSync(filePath, csvContent);
  } catch (error) {
    throw new Error(`Failed to write CSV file: ${filePath}. ${error.message}`);
  }
}

/**
 * Validates that required headers exist in CSV data
 * @param {Array} csvData - Parsed CSV data
 * @param {Array} requiredHeaders - Array of required header names
 * @throws {Error} If any required headers are missing
 */
function validateHeaders(csvData, requiredHeaders) {
  if (!csvData || csvData.length === 0) {
    throw new Error("CSV data is empty");
  }

  const availableHeaders = Object.keys(csvData[0]);
  const missingHeaders = requiredHeaders.filter(
    (header) => !availableHeaders.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required headers: ${missingHeaders.join(
        ", "
      )}. Available headers: ${availableHeaders.join(", ")}`
    );
  }
}

/**
 * Gets column by index (for backward compatibility with hardcoded indices)
 * @param {Array} csvData - Parsed CSV data
 * @param {number} columnIndex - Zero-based column index
 * @returns {string} Column name
 */
function getColumnByIndex(csvData, columnIndex) {
  if (!csvData || csvData.length === 0) {
    throw new Error("CSV data is empty");
  }

  const headers = Object.keys(csvData[0]);
  if (columnIndex < 0 || columnIndex >= headers.length) {
    throw new Error(
      `Column index ${columnIndex} is out of bounds. Available columns: 0-${
        headers.length - 1
      }`
    );
  }

  return headers[columnIndex];
}

module.exports = {
  readCSV,
  readIBWCSV,
  objectsToCSV,
  writeCSV,
  validateHeaders,
  getColumnByIndex,
};
