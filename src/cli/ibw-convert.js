#!/usr/bin/env node

const { Command } = require("commander");
const path = require("path");
const { parseIBWFile } = require("../lib/ibwConverter");
const { objectsToCSV, writeCSV } = require("../lib/csvUtils");

const program = new Command();

program
  .name("ibw-convert")
  .description("Convert IBW (Imaginary Brick Wall) text files to CSV format")
  .version("1.0.0")
  .requiredOption("-i, --input <file>", "Input IBW text file path")
  .requiredOption("-o, --output <file>", "Output CSV file path")
  .option(
    "--headers <headers>",
    "Custom CSV headers (comma-separated)",
    "Number,Player,Team,Position,Age"
  )
  .option("--validate", "Validate output format", false);

program.action((options) => {
  try {
    console.log("IBW to CSV Converter");
    console.log("===================");
    console.log(`Input file: ${options.input}`);
    console.log(`Output file: ${options.output}`);
    console.log("");

    // Parse the IBW file
    console.log("Parsing IBW file...");
    const players = parseIBWFile(options.input);

    // Prepare CSV headers
    const headers = options.headers.split(",").map((h) => h.trim());
    console.log(`Using headers: ${headers.join(", ")}`);

    // Validate that we have the expected number of headers
    if (headers.length !== 5) {
      console.warn(
        "Warning: Expected 5 headers (Number,Player,Team,Position,Age), but got " +
          headers.length
      );
    }

    // Convert to CSV format
    console.log("Converting to CSV...");
    const csvContent = objectsToCSV(players, headers);

    // Write to output file
    console.log("Writing output file...");
    writeCSV(options.output, csvContent);

    console.log("");
    console.log("✅ Conversion complete!");
    console.log(`📊 Processed ${players.length} players`);
    console.log(`📄 Output written to: ${path.resolve(options.output)}`);

    // Optional validation
    if (options.validate) {
      console.log("");
      console.log("Validation:");
      const sampleOutput = players
        .slice(0, 3)
        .map(
          (p) =>
            `  ${p.number}. ${p.name} (${p.team}, ${p.position}, Age ${p.age})`
        );
      console.log("Sample converted entries:");
      sampleOutput.forEach((line) => console.log(line));
    }
  } catch (error) {
    console.error("❌ Error during conversion:");
    console.error(error.message);

    // Provide helpful hints for common errors
    if (error.message.includes("not found")) {
      console.error(
        "\n💡 Hint: Check that the input file path is correct and the file exists."
      );
    } else if (error.message.includes("format")) {
      console.error(
        '\n💡 Hint: Ensure your input file follows the IBW format: "number) name - team, position, age"'
      );
    }

    process.exit(1);
  }
});

// Handle the case where the module is executed directly
if (require.main === module) {
  program.parse();
}

module.exports = program;
