const fs = require("fs");
const path = require("path");
const { parseIBWText, parseIBWFile } = require("../src/lib/ibwConverter");

describe("IBW Converter", () => {
  const fixtureFile = path.join(__dirname, "fixtures", "sample-ibw.txt");
  let sampleIBWText;

  beforeAll(() => {
    sampleIBWText = fs.readFileSync(fixtureFile, "utf-8");
  });

  describe("parseIBWText", () => {
    test("should parse valid IBW text successfully", () => {
      const result = parseIBWText(sampleIBWText);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        number: 1,
        name: "Ronald Acuna Jr.",
        team: "ATL",
        position: "OF",
        age: 26.2,
      });
      expect(result[1]).toEqual({
        number: 2,
        name: "Mike Trout",
        team: "LAA",
        position: "OF",
        age: 32.5,
      });
    });

    test("should handle single player correctly", () => {
      const singlePlayer =
        "1) Juan Soto - NYY, OF, 25.8. Elite hitter with great plate discipline.";
      const result = parseIBWText(singlePlayer);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        number: 1,
        name: "Juan Soto",
        team: "NYY",
        position: "OF",
        age: 25.8,
      });
    });

    test("should handle multi-word team names", () => {
      const multiWordTeam =
        "1) Vladimir Guerrero Jr. - TOR, 1B, 24.5. Great young hitter.";
      const result = parseIBWText(multiWordTeam);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        number: 1,
        name: "Vladimir Guerrero Jr.",
        team: "TOR",
        position: "1B",
        age: 24.5,
      });
    });

    test("should handle integer ages", () => {
      const integerAge = "1) Young Player - TEX, SS, 22. Promising prospect.";
      const result = parseIBWText(integerAge);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        number: 1,
        name: "Young Player",
        team: "TEX",
        position: "SS",
        age: 22,
      });
    });

    test("should throw error for empty input", () => {
      expect(() => parseIBWText("")).toThrow(
        "Invalid input: textContent must be a non-empty string"
      );
      expect(() => parseIBWText(null)).toThrow(
        "Invalid input: textContent must be a non-empty string"
      );
      expect(() => parseIBWText(undefined)).toThrow(
        "Invalid input: textContent must be a non-empty string"
      );
    });

    test("should throw error for invalid text format", () => {
      const invalidText = "This is not a valid IBW format";
      expect(() => parseIBWText(invalidText)).toThrow(
        "No valid player data found in IBW text"
      );
    });

    test("should handle mixed valid and invalid lines", () => {
      const mixedText = `1) Valid Player - ATL, OF, 25.0. Good player.
Invalid line that should be skipped
2) Another Valid - LAD, 1B, 28.5. Another good player.
Another invalid line`;

      const result = parseIBWText(mixedText);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Valid Player");
      expect(result[1].name).toBe("Another Valid");
    });

    test("should handle whitespace and empty lines", () => {
      const textWithWhitespace = `
      
1) Player One - ATL, OF, 25.0. Description here.

      
2) Player Two - LAD, 1B, 28.5. Another description.
      
      `;

      const result = parseIBWText(textWithWhitespace);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Player One");
      expect(result[1].name).toBe("Player Two");
    });
  });

  describe("parseIBWFile", () => {
    test("should parse file successfully", () => {
      const result = parseIBWFile(fixtureFile);

      expect(result).toHaveLength(4);
      expect(result[0].name).toBe("Ronald Acuna Jr.");
      expect(result[3].name).toBe("Fernando Tatis Jr.");
    });

    test("should throw error for non-existent file", () => {
      const nonExistentFile = path.join(
        __dirname,
        "fixtures",
        "non-existent.txt"
      );
      expect(() => parseIBWFile(nonExistentFile)).toThrow("IBW file not found");
    });
  });

  describe("Edge Cases", () => {
    test("should handle special characters in names", () => {
      const specialChars = "1) José Ramírez - CLE, 3B, 31.0. Great player.";
      const result = parseIBWText(specialChars);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("José Ramírez");
    });

    test("should handle Jr./Sr. suffixes", () => {
      const suffix = "1) Ken Griffey Jr. - SEA, OF, 54.0. Hall of Famer.";
      const result = parseIBWText(suffix);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Ken Griffey Jr.");
    });

    test("should skip lines with missing required fields", () => {
      const missingFields = `1) - ATL, OF, 25.0. Missing name.
2) Valid Player - , OF, 25.0. Missing team.
3) Another Valid - ATL, , 25.0. Missing position.
4) Good Player - ATL, OF, 25.0. Valid entry.`;

      const result = parseIBWText(missingFields);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Good Player");
    });
  });
});
