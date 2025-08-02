const fs = require("fs");

/**
 * Parses IBW (Imaginary Brick Wall) text content into an array of player objects
 * @param {string} textContent - The raw IBW text content
 * @returns {Array} Array of player objects with parsed data
 * @throws {Error} If the text format is invalid or malformed
 */
function parseIBWText(textContent) {
  if (!textContent || typeof textContent !== "string") {
    throw new Error("Invalid input: textContent must be a non-empty string");
  }

  const lines = textContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("Invalid IBW file: No content found");
  }

  const players = [];
  const skippedLines = [];

  lines.forEach((line, index) => {
    // Improved regex pattern to handle edge cases like multi-word team names
    // Pattern: number) name - team, position, age
    const basicInfoMatch = line.match(
      /^(\d+)\)\s*([^-]+)-\s*([^,]+),\s*([^,]+),\s*(\d+\.?\d*)/
    );

    if (basicInfoMatch) {
      const [, number, name, team, position, age] = basicInfoMatch;

      // Validate extracted data
      if (!name.trim() || !team.trim() || !position.trim()) {
        skippedLines.push({
          line: index + 1,
          content: line,
          reason: "Missing required fields",
        });
        return;
      }

      players.push({
        number: parseInt(number, 10),
        name: name.trim(),
        team: team.trim(),
        position: position.trim(),
        age: parseFloat(age),
      });
    } else {
      skippedLines.push({
        line: index + 1,
        content: line,
        reason: "Does not match expected IBW format",
      });
    }
  });

  // Provide feedback about parsing
  if (skippedLines.length > 0) {
    console.warn(
      `Warning: Skipped ${skippedLines.length} lines that did not match IBW format`
    );
    skippedLines.forEach((skip) => {
      console.warn(
        `  Line ${skip.line}: ${skip.reason} - "${skip.content.substring(
          0,
          50
        )}..."`
      );
    });
  }

  if (players.length === 0) {
    throw new Error(
      "No valid player data found in IBW text. Please check the input format."
    );
  }

  console.log(`Successfully parsed ${players.length} players from IBW text`);
  return players;
}

/**
 * Reads and parses an IBW text file
 * @param {string} filePath - Path to the IBW text file
 * @returns {Array} Array of player objects
 */
function parseIBWFile(filePath) {
  try {
    const textContent = fs.readFileSync(filePath, "utf-8");
    return parseIBWText(textContent);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`IBW file not found: ${filePath}`);
    }
    throw error;
  }
}

module.exports = {
  parseIBWText,
  parseIBWFile,
};
