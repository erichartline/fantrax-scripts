/**
 * Finds matches between Fantrax players and IBW prospects using multiple matching strategies
 * @param {Array} fantraxPlayers - Array of Fantrax player objects
 * @param {Array} ibwPlayers - Array of IBW player objects
 * @param {Object} columnMapping - Column mapping configuration
 * @returns {Object} Object containing matched results and statistics
 */
function findMatches(fantraxPlayers, ibwPlayers, columnMapping = {}) {
  // Default column mapping (can be overridden)
  const defaultMapping = {
    fantrax: {
      player: "Player",
      team: "Team",
      number: "Number",
      position: "Position",
      age: "Age",
    },
    ibw: {
      player: "Player",
      team: "Team",
      rank: "Number",
      number: "Number",
    },
  };

  const mapping = {
    fantrax: { ...defaultMapping.fantrax, ...columnMapping.fantrax },
    ibw: { ...defaultMapping.ibw, ...columnMapping.ibw },
  };

  // Validate inputs
  if (!Array.isArray(fantraxPlayers) || fantraxPlayers.length === 0) {
    throw new Error("Fantrax players must be a non-empty array");
  }
  if (!Array.isArray(ibwPlayers) || ibwPlayers.length === 0) {
    throw new Error("IBW players must be a non-empty array");
  }

  // Validate required columns exist (filter out null values)
  validateColumns(fantraxPlayers[0], Object.values(mapping.fantrax).filter(col => col !== null), "Fantrax");
  validateColumns(ibwPlayers[0], Object.values(mapping.ibw).filter(col => col !== null), "IBW");

  // Create lookup maps for efficient matching
  const fantraxPlayersMap = createPlayerMaps(fantraxPlayers, mapping.fantrax);

  // Track matching statistics
  const stats = {
    exactMatches: 0,
    nameOnlyMatches: 0,
    totalMatches: 0,
    totalIBWPlayers: ibwPlayers.length,
  };

  const matchingPlayers = [];

  // Process each IBW player
  ibwPlayers.forEach((ibwPlayer, index) => {
    const playerName = getFieldValue(ibwPlayer, mapping.ibw.player);
    if (!playerName) {
      return; // Skip entries without a player name
    }

    const teamName = getFieldValue(ibwPlayer, mapping.ibw.team) || "";

    // Try different matching strategies
    const fullKey = createMatchKey(playerName, teamName);
    const nameOnlyKey = createMatchKey(playerName);

    let fantraxData = null;
    let matchType = null;

    // Strategy 1: Exact match (name + team)
    if (fantraxPlayersMap.exact.has(fullKey)) {
      fantraxData = fantraxPlayersMap.exact.get(fullKey);
      matchType = "exact";
      stats.exactMatches++;
    }
    // Strategy 2: Name-only match
    else if (fantraxPlayersMap.nameOnly.has(nameOnlyKey)) {
      fantraxData = fantraxPlayersMap.nameOnly.get(nameOnlyKey);
      matchType = "name-only";
      stats.nameOnlyMatches++;
    }

    if (fantraxData) {
      matchingPlayers.push({
        ibwPlayer,
        fantraxData,
        matchType,
        ibwIndex: index,
      });
      stats.totalMatches++;
    }
  });

  return {
    matches: matchingPlayers,
    stats,
    columnMapping: mapping,
  };
}

/**
 * Creates lookup maps for Fantrax players
 * @param {Array} fantraxPlayers - Array of Fantrax player objects
 * @param {Object} mapping - Column mapping for Fantrax data
 * @returns {Object} Object with exact and nameOnly maps
 */
function createPlayerMaps(fantraxPlayers, mapping) {
  const exactMap = new Map();
  const nameOnlyMap = new Map();

  fantraxPlayers.forEach((record) => {
    const playerName = getFieldValue(record, mapping.player);
    const teamName = getFieldValue(record, mapping.team) || "";

    if (!playerName) {
      return; // Skip records without player names
    }

    // Store with full name and team (case-insensitive)
    const fullKey = createMatchKey(playerName, teamName);
    exactMap.set(fullKey, record);

    // Store with just the player name (only if not already present to avoid conflicts)
    const nameOnlyKey = createMatchKey(playerName);
    if (!nameOnlyMap.has(nameOnlyKey)) {
      nameOnlyMap.set(nameOnlyKey, record);
    }
  });

  return {
    exact: exactMap,
    nameOnly: nameOnlyMap,
  };
}

/**
 * Creates a normalized key for matching
 * @param {string} playerName - Player name
 * @param {string} teamName - Team name (optional)
 * @returns {string} Normalized key
 */
function createMatchKey(playerName, teamName = "") {
  const normalizedName = playerName.trim().toLowerCase();
  const normalizedTeam = teamName.trim().toLowerCase();

  return teamName ? `${normalizedName}_${normalizedTeam}` : normalizedName;
}

/**
 * Gets field value from object or array, handling multiple possible column names
 * @param {Object|Array} obj - Object or array to get value from
 * @param {string|Array} fieldName - Field name, array index, or array of possible field names
 * @returns {string} Field value or empty string
 */
function getFieldValue(obj, fieldName) {
  if (Array.isArray(fieldName)) {
    for (const name of fieldName) {
      if (Array.isArray(obj)) {
        const index = parseInt(name, 10);
        if (obj[index] !== undefined && obj[index] !== null) {
          return String(obj[index]).trim();
        }
      } else {
        if (obj[name] !== undefined && obj[name] !== null) {
          return String(obj[name]).trim();
        }
      }
    }
    return "";
  }

  if (Array.isArray(obj)) {
    const index = parseInt(fieldName, 10);
    return obj[index] !== undefined && obj[index] !== null
      ? String(obj[index]).trim()
      : "";
  }

  return obj[fieldName] !== undefined && obj[fieldName] !== null
    ? String(obj[fieldName]).trim()
    : "";
}

/**
 * Validates that required columns exist in the data
 * @param {Object|Array} sampleRecord - Sample record to check columns
 * @param {Array} requiredColumns - Array of required column names/indices
 * @param {string} dataType - Type of data (for error messages)
 */
function validateColumns(sampleRecord, requiredColumns, dataType) {
  if (Array.isArray(sampleRecord)) {
    const maxIndex = Math.max(...requiredColumns.map(col => parseInt(col, 10)));
    if (maxIndex >= sampleRecord.length) {
      throw new Error(
        `Missing required columns in ${dataType} data: column index ${maxIndex} not found. Available columns: 0-${sampleRecord.length - 1}`
      );
    }
  } else {
    const availableColumns = Object.keys(sampleRecord);
    const missingColumns = requiredColumns.filter(
      (col) => !availableColumns.some((available) => available === col)
    );

    if (missingColumns.length > 0) {
      throw new Error(
        `Missing required columns in ${dataType} data: ${missingColumns.join(
          ", "
        )}. Available columns: ${availableColumns.join(", ")}`
      );
    }
  }
}

/**
 * Formats matched results for output
 * @param {Array} matches - Array of match objects
 * @param {Object} columnMapping - Column mapping configuration
 * @returns {Array} Array of formatted output objects
 */
function formatMatchResults(matches, columnMapping) {
  return matches.map((match) => {
    const { ibwPlayer, fantraxData, matchType } = match;

    return {
      "IBW Rank": getFieldValue(ibwPlayer, columnMapping.ibw.rank),
      "IBW Player": getFieldValue(ibwPlayer, columnMapping.ibw.player),
      "IBW Team": getFieldValue(ibwPlayer, columnMapping.ibw.team),
      "Fantrax Number": getFieldValue(fantraxData, [
        columnMapping.fantrax.number,
        "Number",
        "#",
        "ID"
      ].filter(col => col !== null)),
      "Fantrax Player": getFieldValue(
        fantraxData,
        columnMapping.fantrax.player
      ),
      "Fantrax Team": getFieldValue(fantraxData, columnMapping.fantrax.team),
      "Fantrax Position": getFieldValue(fantraxData, [
        columnMapping.fantrax.position,
        "Position",
        "Pos",
      ].filter(col => col !== null)),
      "Fantrax Age": getFieldValue(fantraxData, columnMapping.fantrax.age || "Age"),
      "Match Type": matchType,
    };
  });
}

module.exports = {
  findMatches,
  formatMatchResults,
  createPlayerMaps,
  createMatchKey,
  getFieldValue,
  validateColumns,
};
