#!/usr/bin/env node

const { Command } = require("commander");
const path = require("path");
const {
  readCSV,
  readIBWCSV,
  objectsToCSV,
  writeCSV,
  getColumnByIndex,
} = require("../lib/csvUtils");
const { findMatches, formatMatchResults } = require("../lib/prospectMatcher");

const program = new Command();

program
  .name("prospect-matcher")
  .description("Match prospects between Fantrax and IBW CSV files")
  .version("1.0.0")
  .requiredOption("-f, --fantrax <file>", "Fantrax CSV file path")
  .requiredOption("-i, --ibw <file>", "IBW CSV file path")
  .requiredOption("-o, --output <file>", "Output CSV file path")
  .option(
    "--fantrax-player-col <column>",
    "Fantrax player column name or index",
    "1"
  )
  .option(
    "--fantrax-team-col <column>",
    "Fantrax team column name or index",
    "2"
  )
  .option("--ibw-player-col <column>", "IBW player column name or index", "5")
  .option("--ibw-team-col <column>", "IBW team column name or index", "6")
  .option("--ibw-rank-col <column>", "IBW rank column name or index", "0")
  .option("--show-samples", "Show sample data for troubleshooting", false)
  .option("--verbose", "Verbose output", false);

program.action((options) => {
  try {
    console.log("Prospect Matcher");
    console.log("================");
    console.log(`Fantrax file: ${options.fantrax}`);
    console.log(`IBW file: ${options.ibw}`);
    console.log(`Output file: ${options.output}`);
    console.log("");

    // Read both CSV files
    console.log("Reading CSV files...");
    const fantraxPlayers = readCSV(options.fantrax);
    const ibwPlayers = readCSV(options.ibw, { columns: false });

    console.log(`✅ Fantrax file: ${fantraxPlayers.length} records`);
    console.log(`✅ IBW file: ${ibwPlayers.length} records`);
    
    // Filter out FYPD entries from IBW data
    const originalIBWCount = ibwPlayers.length;
    const filteredIBWPlayers = ibwPlayers.filter(row => {
      // Check if any column contains "FYPD" (case insensitive)
      return !row.some(value => 
        value && value.toString().toLowerCase().includes('fypd')
      );
    });
    
    if (filteredIBWPlayers.length < originalIBWCount) {
      const removedCount = originalIBWCount - filteredIBWPlayers.length;
      console.log(`🚫 Filtered out ${removedCount} FYPD entries`);
    }
    
    console.log(`✅ IBW file (after FYPD filtering): ${filteredIBWPlayers.length} records`);
    console.log("");

    // Display column information
    const fantraxColumns = Object.keys(fantraxPlayers[0]);
    const ibwColumns = filteredIBWPlayers[0] ? filteredIBWPlayers[0].map((_, idx) => idx.toString()) : [];

    console.log("Available columns:");
    console.log(
      `  Fantrax: ${fantraxColumns
        .map((col, idx) => `${idx}:${col}`)
        .join(", ")}`
    );
    console.log(
      `  IBW: ${ibwColumns.map((col, idx) => `${idx}:${col}`).join(", ")}`
    );
    console.log("");

    // Resolve column mappings (support both names and indices)
    const columnMapping = {
      fantrax: {
        player: resolveColumn(
          fantraxPlayers,
          options.fantraxPlayerCol,
          "Fantrax player"
        ),
        team: resolveColumn(
          fantraxPlayers,
          options.fantraxTeamCol,
          "Fantrax team"
        ),
        number: fantraxColumns.includes("Number") ? "Number" : null,
        position: fantraxColumns.includes("Position") ? "Position" : null,
        age: fantraxColumns.includes("Age") ? "Age" : null,
      },
      ibw: {
        player: options.ibwPlayerCol, // Direct column index for arrays
        team: options.ibwTeamCol,     // Direct column index for arrays
        rank: options.ibwRankCol,     // Direct column index for arrays
        number: options.ibwRankCol,   // Use rank as number
      },
    };

    console.log("Using column mappings:");
    console.log(`  Fantrax Player: ${columnMapping.fantrax.player}`);
    console.log(`  Fantrax Team: ${columnMapping.fantrax.team}`);
    console.log(`  IBW Player: ${columnMapping.ibw.player}`);
    console.log(`  IBW Team: ${columnMapping.ibw.team}`);
    console.log(`  IBW Rank: ${columnMapping.ibw.rank}`);
    console.log("");

    // Show sample data if requested
    if (options.showSamples) {
      console.log("Sample data:");
      console.log("Fantrax (first 2 records):");
      fantraxPlayers.slice(0, 2).forEach((player, idx) => {
        console.log(
          `  ${idx + 1}: Player="${
            player[columnMapping.fantrax.player]
          }" Team="${player[columnMapping.fantrax.team]}"`
        );
      });
      console.log("IBW (first 2 records):");
      filteredIBWPlayers.slice(0, 2).forEach((row, idx) => {
        console.log(
          `  ${idx + 1}: Player="${row[columnMapping.ibw.player]}" Team="${
            row[columnMapping.ibw.team]
          }"`
        );
      });
      console.log("");
    }

    // Find matches
    console.log("Finding matches...");
    const matchResult = findMatches(fantraxPlayers, filteredIBWPlayers, columnMapping);
    const { matches, stats } = matchResult;

    // Display results
    console.log("Match Results:");
    console.log(`  📊 Total IBW players: ${stats.totalIBWPlayers}`);
    console.log(`  ✅ Total matches found: ${stats.totalMatches}`);
    console.log(`  🎯 Exact matches (name + team): ${stats.exactMatches}`);
    console.log(`  📝 Name-only matches: ${stats.nameOnlyMatches}`);
    console.log(
      `  📈 Match rate: ${(
        (stats.totalMatches / stats.totalIBWPlayers) *
        100
      ).toFixed(1)}%`
    );
    console.log("");

    if (stats.totalMatches === 0) {
      console.log("❌ No matches found!");
      console.log("");
      console.log("Troubleshooting suggestions:");
      console.log(
        "1. Check that player names are spelled consistently between files"
      );
      console.log("2. Verify team names match between files");
      console.log("3. Use --show-samples to inspect the data");
      console.log(
        "4. Try different column mappings with --fantrax-player-col, --ibw-player-col, etc."
      );
      process.exit(1);
    }

    // Show individual matches in verbose mode
    if (options.verbose) {
      console.log("Individual matches:");
      matches.forEach((match, idx) => {
        const ibwName = match.ibwPlayer[columnMapping.ibw.player];
        const ibwTeam = match.ibwPlayer[columnMapping.ibw.team] || "N/A";
        console.log(
          `  ${idx + 1}. ${ibwName} (${ibwTeam}) - ${match.matchType} match`
        );
      });
      console.log("");
    }

    // Format and write output
    console.log("Generating output...");
    const formattedResults = formatMatchResults(matches, columnMapping);
    const csvContent = objectsToCSV(formattedResults);

    writeCSV(options.output, csvContent);

    console.log("✅ Results written successfully!");
    console.log(`📄 Output file: ${path.resolve(options.output)}`);
  } catch (error) {
    console.error("❌ Error during matching:");
    console.error(error.message);

    // Provide helpful hints for common errors
    if (error.message.includes("not found")) {
      console.error(
        "\n💡 Hint: Check that the input file paths are correct and files exist."
      );
    } else if (
      error.message.includes("column") ||
      error.message.includes("header")
    ) {
      console.error(
        "\n💡 Hint: Check column mappings. Use --show-samples to see available columns."
      );
    } else if (error.message.includes("CSV")) {
      console.error(
        "\n💡 Hint: Ensure input files are valid CSV format with headers."
      );
    }

    process.exit(1);
  }
});

/**
 * Resolves a column reference (name or index) to the actual column name
 * @param {Array} data - CSV data array
 * @param {string} columnRef - Column reference (name or index)
 * @param {string} description - Description for error messages
 * @returns {string} Resolved column name
 */
function resolveColumn(data, columnRef, description) {
  const availableColumns = Object.keys(data[0]);
  
  // First check if it's an exact column name match
  if (availableColumns.includes(columnRef)) {
    return columnRef;
  }
  
  // If it's a number, treat as index
  if (/^\d+$/.test(columnRef)) {
    const index = parseInt(columnRef, 10);
    return getColumnByIndex(data, index);
  }

  // Column name not found
  throw new Error(
    `${description} column "${columnRef}" not found. Available columns: ${availableColumns.join(
      ", "
    )}`
  );
}

// Handle the case where the module is executed directly
if (require.main === module) {
  program.parse();
}

module.exports = program;
