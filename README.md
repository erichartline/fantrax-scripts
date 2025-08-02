# Fantrax Scripts

> Fantasy baseball tools for converting IBW text to CSV and matching prospects between different datasets

## Overview

Fantrax Scripts is a collection of Node.js tools designed to help fantasy baseball analysts work with player data from different sources. The toolkit provides two main functions:

1. **IBW Converter**: Converts Imaginary Brick Wall (IBW) text files into structured CSV format
2. **Prospect Matcher**: Matches players between Fantrax and IBW CSV files using intelligent matching strategies

## Features

- 🔄 **IBW Text to CSV Conversion**: Parse IBW text files with regex-based extraction
- 🔍 **Intelligent Player Matching**: Multiple matching strategies (exact name+team, name-only fallback)
- 🛠️ **Flexible CLI Interface**: Command-line tools with configurable options
- 📊 **Robust Error Handling**: Comprehensive validation and helpful error messages
- 🧪 **Well Tested**: Complete test suite with fixtures and edge case coverage
- 📖 **Clear Documentation**: Usage examples and API documentation

## Installation

### Global Installation (Recommended)

```bash
npm install -g fantrax-scripts
```

After global installation, you can use the commands anywhere:

```bash
ibw-convert --help
prospect-matcher --help
```

### Local Installation

```bash
git clone https://github.com/user/fantrax-scripts.git
cd fantrax-scripts
npm install
```

## Usage

### IBW Converter

Convert IBW text files to CSV format:

```bash
ibw-convert -i players.txt -o players.csv
```

#### Options

- `-i, --input <file>`: Input IBW text file path (required)
- `-o, --output <file>`: Output CSV file path (required)
- `--headers <headers>`: Custom CSV headers (default: "Number,Player,Team,Position,Age")
- `--validate`: Validate output format and show sample entries
- `-h, --help`: Display help information

#### Example

```bash
# Basic conversion
ibw-convert -i prospects-2024.txt -o prospects-2024.csv

# With custom headers
ibw-convert -i prospects.txt -o prospects.csv --headers "Rank,Name,Team,Pos,Age"

# With validation
ibw-convert -i prospects.txt -o prospects.csv --validate
```

#### Expected IBW Text Format

The IBW converter expects text in the following format:

```
1) Ronald Acuna Jr. - ATL, OF, 26.2. The 2023 NL MVP is as close to a sure thing...
2) Mike Trout - LAA, OF, 32.5. Despite injury concerns, when healthy, Trout remains...
```

Pattern: `number) name - team, position, age. description...`

### Prospect Matcher

Match players between Fantrax and IBW CSV files:

```bash
prospect-matcher -f fantrax-players.csv -i ibw-prospects.csv -o matches.csv
```

#### Options

- `-f, --fantrax <file>`: Fantrax CSV file path (required)
- `-i, --ibw <file>`: IBW CSV file path (required)
- `-o, --output <file>`: Output CSV file path (required)
- `--fantrax-player-col <column>`: Fantrax player column name or index (default: "1")
- `--fantrax-team-col <column>`: Fantrax team column name or index (default: "2")
- `--ibw-player-col <column>`: IBW player column name or index (default: "3")
- `--ibw-team-col <column>`: IBW team column name or index (default: "4")
- `--ibw-rank-col <column>`: IBW rank column name or index (default: "0")
- `--show-samples`: Show sample data for troubleshooting
- `--verbose`: Show detailed match information
- `-h, --help`: Display help information

#### Example

```bash
# Basic matching
prospect-matcher -f my-league.csv -i prospects.csv -o matches.csv

# With custom column mappings
prospect-matcher -f league.csv -i prospects.csv -o matches.csv \
  --fantrax-player-col "PlayerName" --fantrax-team-col "TeamAbbr" \
  --ibw-player-col "Name" --ibw-team-col "Team"

# Troubleshooting with samples
prospect-matcher -f league.csv -i prospects.csv -o matches.csv --show-samples --verbose
```

#### Matching Strategies

The prospect matcher uses multiple strategies to find matches:

1. **Exact Match**: Player name + team name (case-insensitive)
2. **Name-Only Match**: Player name only (fallback when team names differ)

#### Output Format

The output CSV includes:

- IBW Rank, Player, Team
- Fantrax Number, Player, Team, Position, Age
- Match Type (exact/name-only)

## API Documentation

### IBW Converter (`src/lib/ibwConverter.js`)

#### `parseIBWText(textContent)`

Parses IBW text content into player objects.

**Parameters:**

- `textContent` (string): Raw IBW text content

**Returns:** Array of player objects with properties:

- `number` (number): Player ranking
- `name` (string): Player name
- `team` (string): Team abbreviation
- `position` (string): Position
- `age` (number): Player age

**Throws:** Error if text format is invalid

#### `parseIBWFile(filePath)`

Reads and parses an IBW text file.

**Parameters:**

- `filePath` (string): Path to IBW text file

**Returns:** Array of player objects

### Prospect Matcher (`src/lib/prospectMatcher.js`)

#### `findMatches(fantraxPlayers, ibwPlayers, columnMapping)`

Finds matches between Fantrax and IBW player datasets.

**Parameters:**

- `fantraxPlayers` (Array): Fantrax player objects
- `ibwPlayers` (Array): IBW player objects
- `columnMapping` (Object): Column mapping configuration

**Returns:** Object with:

- `matches` (Array): Array of match objects
- `stats` (Object): Matching statistics
- `columnMapping` (Object): Used column mapping

#### `formatMatchResults(matches, columnMapping)`

Formats match results for CSV output.

**Parameters:**

- `matches` (Array): Array of match objects
- `columnMapping` (Object): Column mapping configuration

**Returns:** Array of formatted output objects

### CSV Utils (`src/lib/csvUtils.js`)

#### `readCSV(filePath, options)`

Reads and parses a CSV file.

#### `objectsToCSV(objects, headers)`

Converts object array to CSV format.

#### `writeCSV(filePath, csvContent)`

Writes CSV content to file.

## Development

### Setup

```bash
git clone https://github.com/user/fantrax-scripts.git
cd fantrax-scripts
npm install
```

### Available Scripts

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Run development checks (lint + test)
npm run dev
```

### Project Structure

```
fantrax-scripts/
├── src/
│   ├── lib/              # Core business logic
│   │   ├── ibwConverter.js
│   │   ├── prospectMatcher.js
│   │   └── csvUtils.js
│   └── cli/              # CLI wrappers
│       ├── ibw-convert.js
│       └── prospect-matcher.js
├── bin/                  # Executable scripts
│   ├── ibw-convert
│   └── prospect-matcher
├── tests/                # Test files
│   ├── fixtures/         # Test data
│   ├── ibwConverter.test.js
│   ├── prospectMatcher.test.js
│   └── csvUtils.test.js
├── package.json
├── jest.config.js
├── .eslintrc.js
└── README.md
```

### Testing

The project uses Jest for testing with comprehensive coverage:

- **Unit Tests**: Core library functions
- **Integration Tests**: CLI workflows
- **Fixture Data**: Realistic test scenarios
- **Edge Cases**: Error handling and validation

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/ibwConverter.test.js

# Run with coverage
npm run test:coverage
```

### Code Quality

- **ESLint**: Code linting and style enforcement
- **Jest**: Testing framework with coverage reporting
- **Coverage Thresholds**: 80% minimum coverage requirement

## Troubleshooting

### Common Issues

#### IBW Converter

**No players found:**

- Check that your text follows the IBW format: `number) name - team, position, age`
- Verify there are no extra characters or formatting issues

**Missing player data:**

- Use `--validate` flag to see which lines were skipped
- Ensure all required fields (name, team, position, age) are present

#### Prospect Matcher

**No matches found:**

- Use `--show-samples` to inspect your data format
- Check that player names are spelled consistently
- Verify team abbreviations match between files
- Try different column mappings

**Column errors:**

- Use `--show-samples` to see available column names
- Specify correct column names or indices with `--fantrax-player-col`, etc.

### Getting Help

1. Use `--help` flag with any command
2. Check the troubleshooting section above
3. Review the test files for usage examples
4. Open an issue on the GitHub repository

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass and linting is clean
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### v1.0.0

- Initial release
- IBW text to CSV conversion
- Prospect matching between datasets
- Comprehensive CLI interface
- Full test coverage
- Documentation and examples
