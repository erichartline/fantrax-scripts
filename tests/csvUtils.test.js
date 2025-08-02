const fs = require("fs");
const path = require("path");
const {
  readCSV,
  objectsToCSV,
  writeCSV,
  validateHeaders,
  getColumnByIndex,
} = require("../src/lib/csvUtils");

describe("CSV Utils", () => {
  const fixturesDir = path.join(__dirname, "fixtures");
  const fantraxFile = path.join(fixturesDir, "sample-fantrax.csv");
  const ibwFile = path.join(fixturesDir, "sample-ibw.csv");
  const tempFile = path.join(fixturesDir, "temp-test.csv");

  afterEach(() => {
    // Clean up temp files after each test
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  });

  describe("readCSV", () => {
    test("should read Fantrax CSV file correctly", () => {
      const data = readCSV(fantraxFile);

      expect(data).toHaveLength(6);
      expect(data[0]).toEqual({
        Number: "1",
        Player: "Ronald Acuna Jr.",
        Team: "ATL",
        Position: "OF",
        Age: "26",
        Status: "Active",
      });
    });

    test("should read IBW CSV file correctly", () => {
      const data = readCSV(ibwFile);

      expect(data).toHaveLength(4);
      expect(data[0]).toEqual({
        Number: "1",
        Player: "Ronald Acuna Jr.",
        Team: "ATL",
        Position: "OF",
        Age: "26.2",
      });
    });

    test("should handle custom parsing options", () => {
      const data = readCSV(fantraxFile, {
        columns: true,
        skip_empty_lines: false,
      });

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test("should throw error for non-existent file", () => {
      const nonExistentFile = path.join(fixturesDir, "non-existent.csv");
      expect(() => readCSV(nonExistentFile)).toThrow("CSV file not found");
    });

    test("should throw error for empty file", () => {
      // Create an empty temp file
      fs.writeFileSync(tempFile, "");
      expect(() => readCSV(tempFile)).toThrow(
        "CSV file is empty or contains no valid data"
      );
    });

    test("should handle malformed CSV", () => {
      // Create a malformed CSV file
      const malformedCSV = 'Name,Team\n"Unclosed quote,ATL\nPlayer 2,LAA';
      fs.writeFileSync(tempFile, malformedCSV);

      expect(() => readCSV(tempFile)).toThrow("Invalid CSV format");
    });
  });

  describe("objectsToCSV", () => {
    const sampleData = [
      { name: "John Doe", team: "ATL", age: 25 },
      { name: "Jane Smith", team: "LAA", age: 30 },
    ];

    test("should convert objects to CSV correctly", () => {
      const result = objectsToCSV(sampleData);

      const lines = result.split("\n");
      expect(lines[0]).toBe("name,team,age");
      expect(lines[1]).toBe('"John Doe","ATL","25"');
      expect(lines[2]).toBe('"Jane Smith","LAA","30"');
    });

    test("should use custom headers", () => {
      const customHeaders = ["team", "name"];
      const result = objectsToCSV(sampleData, customHeaders);

      const lines = result.split("\n");
      expect(lines[0]).toBe("team,name");
      expect(lines[1]).toBe('"ATL","John Doe"');
      expect(lines[2]).toBe('"LAA","Jane Smith"');
    });

    test("should handle special characters and quotes", () => {
      const specialData = [
        { name: "Player, Jr.", team: "ATL", quote: 'He said "Hello"' },
        { name: "Normal Player", team: "LAA", quote: "Simple text" },
      ];

      const result = objectsToCSV(specialData);
      const lines = result.split("\n");

      expect(lines[1]).toBe('"Player, Jr.","ATL","He said ""Hello"""');
      expect(lines[2]).toBe('"Normal Player","LAA","Simple text"');
    });

    test("should handle newlines in data", () => {
      const dataWithNewlines = [
        { name: "Player\nWith\nNewlines", team: "ATL", age: 25 },
      ];

      const result = objectsToCSV(dataWithNewlines);
      expect(result).toContain('"Player\nWith\nNewlines"');
    });

    test("should handle empty values", () => {
      const dataWithEmpties = [
        { name: "Player", team: "", age: null },
        { name: "", team: "LAA", age: undefined },
      ];

      const result = objectsToCSV(dataWithEmpties);
      const lines = result.split("\n");

      expect(lines[1]).toBe('"Player","",""');
      expect(lines[2]).toBe('","LAA",""');
    });

    test("should throw error for empty array", () => {
      expect(() => objectsToCSV([])).toThrow(
        "Invalid input: objects must be a non-empty array"
      );
    });

    test("should throw error for non-array input", () => {
      expect(() => objectsToCSV(null)).toThrow(
        "Invalid input: objects must be a non-empty array"
      );
      expect(() => objectsToCSV("not an array")).toThrow(
        "Invalid input: objects must be a non-empty array"
      );
    });

    test("should throw error for missing headers in objects", () => {
      const inconsistentData = [
        { name: "Player 1", team: "ATL" },
        { name: "Player 2" }, // Missing 'team' property
      ];

      expect(() => objectsToCSV(inconsistentData)).toThrow(
        'Missing header "team" in object at index 1'
      );
    });
  });

  describe("writeCSV", () => {
    test("should write CSV content to file", () => {
      const csvContent = 'name,team\n"John Doe","ATL"\n"Jane Smith","LAA"';

      writeCSV(tempFile, csvContent);

      expect(fs.existsSync(tempFile)).toBe(true);
      const writtenContent = fs.readFileSync(tempFile, "utf-8");
      expect(writtenContent).toBe(csvContent);
    });

    test("should throw error for invalid file path", () => {
      const invalidPath = "/invalid/path/that/does/not/exist.csv";
      expect(() => writeCSV(invalidPath, "content")).toThrow(
        "Failed to write CSV file"
      );
    });
  });

  describe("validateHeaders", () => {
    const sampleData = [
      { name: "Player 1", team: "ATL", position: "OF" },
      { name: "Player 2", team: "LAA", position: "SS" },
    ];

    test("should pass validation for existing headers", () => {
      expect(() => validateHeaders(sampleData, ["name", "team"])).not.toThrow();
      expect(() =>
        validateHeaders(sampleData, ["name", "team", "position"])
      ).not.toThrow();
    });

    test("should throw error for missing headers", () => {
      expect(() => validateHeaders(sampleData, ["name", "age"])).toThrow(
        "Missing required headers: age. Available headers: name, team, position"
      );
    });

    test("should throw error for empty data", () => {
      expect(() => validateHeaders([], ["name"])).toThrow("CSV data is empty");
      expect(() => validateHeaders(null, ["name"])).toThrow(
        "CSV data is empty"
      );
    });

    test("should throw error for multiple missing headers", () => {
      expect(() =>
        validateHeaders(sampleData, ["name", "age", "salary"])
      ).toThrow("Missing required headers: age, salary");
    });
  });

  describe("getColumnByIndex", () => {
    const sampleData = [{ first: "A", second: "B", third: "C" }];

    test("should return correct column name by index", () => {
      expect(getColumnByIndex(sampleData, 0)).toBe("first");
      expect(getColumnByIndex(sampleData, 1)).toBe("second");
      expect(getColumnByIndex(sampleData, 2)).toBe("third");
    });

    test("should throw error for out of bounds index", () => {
      expect(() => getColumnByIndex(sampleData, 3)).toThrow(
        "Column index 3 is out of bounds. Available columns: 0-2"
      );
      expect(() => getColumnByIndex(sampleData, -1)).toThrow(
        "Column index -1 is out of bounds. Available columns: 0-2"
      );
    });

    test("should throw error for empty data", () => {
      expect(() => getColumnByIndex([], 0)).toThrow("CSV data is empty");
      expect(() => getColumnByIndex(null, 0)).toThrow("CSV data is empty");
    });
  });

  describe("Integration Tests", () => {
    test("should handle complete read-write cycle", () => {
      // Read the original file
      const originalData = readCSV(fantraxFile);

      // Convert back to CSV
      const csvContent = objectsToCSV(originalData);

      // Write to temp file
      writeCSV(tempFile, csvContent);

      // Read the temp file back
      const roundTripData = readCSV(tempFile);

      // Should match original data
      expect(roundTripData).toEqual(originalData);
    });

    test("should preserve data integrity with special characters", () => {
      const specialData = [
        {
          name: "José Ramírez",
          team: "CLE",
          note: 'Player with "quotes" and, commas',
        },
        { name: "Regular Player", team: "ATL", note: "Normal text" },
      ];

      const csvContent = objectsToCSV(specialData);
      writeCSV(tempFile, csvContent);
      const roundTripData = readCSV(tempFile);

      expect(roundTripData).toEqual(specialData);
    });
  });
});
