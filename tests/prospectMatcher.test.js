const path = require("path");
const { readCSV } = require("../src/lib/csvUtils");
const {
  findMatches,
  formatMatchResults,
  createPlayerMaps,
  createMatchKey,
  getFieldValue,
} = require("../src/lib/prospectMatcher");

describe("Prospect Matcher", () => {
  let fantraxPlayers, ibwPlayers;

  beforeAll(() => {
    const fantraxFile = path.join(__dirname, "fixtures", "sample-fantrax.csv");
    const ibwFile = path.join(__dirname, "fixtures", "sample-ibw.csv");

    fantraxPlayers = readCSV(fantraxFile);
    ibwPlayers = readCSV(ibwFile);
  });

  describe("createMatchKey", () => {
    test("should create normalized keys correctly", () => {
      expect(createMatchKey("Juan Soto", "NYY")).toBe("juan soto_nyy");
      expect(createMatchKey("MIKE TROUT", "LAA")).toBe("mike trout_laa");
      expect(createMatchKey("ronald acuna jr.", "ATL")).toBe(
        "ronald acuna jr._atl"
      );
    });

    test("should handle name-only keys", () => {
      expect(createMatchKey("Juan Soto")).toBe("juan soto");
      expect(createMatchKey("MIKE TROUT")).toBe("mike trout");
    });

    test("should handle extra whitespace", () => {
      expect(createMatchKey("  Juan Soto  ", "  NYY  ")).toBe("juan soto_nyy");
      expect(createMatchKey("  Juan Soto  ")).toBe("juan soto");
    });
  });

  describe("getFieldValue", () => {
    const testObject = {
      Player: "Juan Soto",
      Team: "NYY",
      Number: 3,
      Age: null,
    };

    test("should get string field values correctly", () => {
      expect(getFieldValue(testObject, "Player")).toBe("Juan Soto");
      expect(getFieldValue(testObject, "Team")).toBe("NYY");
    });

    test("should handle numeric values", () => {
      expect(getFieldValue(testObject, "Number")).toBe("3");
    });

    test("should handle null/undefined values", () => {
      expect(getFieldValue(testObject, "Age")).toBe("");
      expect(getFieldValue(testObject, "NonExistent")).toBe("");
    });

    test("should handle array of field names", () => {
      expect(getFieldValue(testObject, ["#", "Number"])).toBe("3");
      expect(getFieldValue(testObject, ["NonExistent", "Player"])).toBe(
        "Juan Soto"
      );
      expect(getFieldValue(testObject, ["NonExistent1", "NonExistent2"])).toBe(
        ""
      );
    });
  });

  describe("createPlayerMaps", () => {
    test("should create correct lookup maps", () => {
      const mapping = {
        player: "Player",
        team: "Team",
      };

      const maps = createPlayerMaps(fantraxPlayers, mapping);

      expect(maps.exact.has("ronald acuna jr._atl")).toBe(true);
      expect(maps.exact.has("mike trout_laa")).toBe(true);
      expect(maps.nameOnly.has("juan soto")).toBe(true);
      expect(maps.nameOnly.has("fernando tatis jr.")).toBe(true);
    });

    test("should handle players without team names", () => {
      const playersWithoutTeam = [
        { Player: "Test Player", Team: "" },
        { Player: "Another Player", Team: null },
      ];
      const mapping = { player: "Player", team: "Team" };

      const maps = createPlayerMaps(playersWithoutTeam, mapping);

      expect(maps.exact.has("test player_")).toBe(true);
      expect(maps.nameOnly.has("test player")).toBe(true);
    });
  });

  describe("findMatches", () => {
    test("should find exact matches correctly", () => {
      const result = findMatches(fantraxPlayers, ibwPlayers);

      expect(result.stats.totalMatches).toBe(4);
      expect(result.stats.exactMatches).toBe(4);
      expect(result.stats.nameOnlyMatches).toBe(0);
      expect(result.matches).toHaveLength(4);
    });

    test("should find name-only matches when teams differ", () => {
      // Create IBW data with different team names
      const modifiedIBWPlayers = ibwPlayers.map((player) => ({
        ...player,
        Team: "DIFFERENT",
      }));

      const result = findMatches(fantraxPlayers, modifiedIBWPlayers);

      expect(result.stats.totalMatches).toBe(4);
      expect(result.stats.exactMatches).toBe(0);
      expect(result.stats.nameOnlyMatches).toBe(4);
    });

    test("should handle no matches scenario", () => {
      const noMatchPlayers = [
        {
          Number: "1",
          Player: "Unknown Player",
          Team: "UNK",
          Position: "OF",
          Age: "25",
        },
      ];

      const result = findMatches(fantraxPlayers, noMatchPlayers);

      expect(result.stats.totalMatches).toBe(0);
      expect(result.stats.exactMatches).toBe(0);
      expect(result.stats.nameOnlyMatches).toBe(0);
      expect(result.matches).toHaveLength(0);
    });

    test("should handle custom column mapping", () => {
      const customMapping = {
        fantrax: {
          player: "Player",
          team: "Team",
        },
        ibw: {
          player: "Player",
          team: "Team",
          rank: "Number",
        },
      };

      const result = findMatches(fantraxPlayers, ibwPlayers, customMapping);

      expect(result.stats.totalMatches).toBe(4);
      expect(result.columnMapping).toEqual(
        expect.objectContaining(customMapping)
      );
    });

    test("should handle duplicate names correctly", () => {
      const duplicateFantrax = [
        ...fantraxPlayers,
        {
          Number: "7",
          Player: "Juan Soto",
          Team: "WAS",
          Position: "OF",
          Age: "25",
          Status: "Active",
        },
      ];

      const result = findMatches(duplicateFantrax, ibwPlayers);

      // Should still match, but might prefer the first occurrence for name-only matches
      expect(result.stats.totalMatches).toBe(4);
    });

    test("should validate input parameters", () => {
      expect(() => findMatches([], ibwPlayers)).toThrow(
        "Fantrax players must be a non-empty array"
      );
      expect(() => findMatches(fantraxPlayers, [])).toThrow(
        "IBW players must be a non-empty array"
      );
      expect(() => findMatches(null, ibwPlayers)).toThrow(
        "Fantrax players must be a non-empty array"
      );
    });
  });

  describe("formatMatchResults", () => {
    test("should format results correctly", () => {
      const matchResult = findMatches(fantraxPlayers, ibwPlayers);
      const formatted = formatMatchResults(
        matchResult.matches,
        matchResult.columnMapping
      );

      expect(formatted).toHaveLength(4);
      expect(formatted[0]).toEqual({
        "IBW Rank": "1",
        "IBW Player": "Ronald Acuna Jr.",
        "IBW Team": "ATL",
        "Fantrax Number": "1",
        "Fantrax Player": "Ronald Acuna Jr.",
        "Fantrax Team": "ATL",
        "Fantrax Position": "OF",
        "Fantrax Age": "26",
        "Match Type": "exact",
      });
    });

    test("should handle missing data gracefully", () => {
      const partialMatch = {
        ibwPlayer: {
          Number: "1",
          Player: "Test Player",
          Team: "",
          Position: "OF",
          Age: "25",
        },
        fantraxData: {
          Number: "1",
          Player: "Test Player",
          Team: "",
          Position: "",
          Age: "",
          Status: "Active",
        },
        matchType: "name-only",
      };

      const columnMapping = {
        fantrax: {
          player: "Player",
          team: "Team",
          number: "Number",
          position: "Position",
          age: "Age",
        },
        ibw: { player: "Player", team: "Team", rank: "Number" },
      };

      const formatted = formatMatchResults([partialMatch], columnMapping);

      expect(formatted[0]["IBW Team"]).toBe("");
      expect(formatted[0]["Fantrax Position"]).toBe("");
      expect(formatted[0]["Fantrax Age"]).toBe("");
      expect(formatted[0]["Match Type"]).toBe("name-only");
    });
  });

  describe("Edge Cases", () => {
    test("should handle players with no names", () => {
      const playersWithEmptyNames = [
        { Number: "1", Player: "", Team: "ATL", Position: "OF", Age: "25" },
        {
          Number: "2",
          Player: "Valid Player",
          Team: "LAA",
          Position: "OF",
          Age: "30",
        },
      ];

      const result = findMatches(fantraxPlayers, playersWithEmptyNames);

      // Should skip empty names and not crash
      expect(result.stats.totalIBWPlayers).toBe(2);
      expect(result.stats.totalMatches).toBe(0); // No matches since first has no name, second doesn't match
    });

    test("should handle case-insensitive matching", () => {
      const caseVariations = [
        {
          Number: "1",
          Player: "RONALD ACUNA JR.",
          Team: "atl",
          Position: "OF",
          Age: "26.2",
        },
        {
          Number: "2",
          Player: "mike trout",
          Team: "LAA",
          Position: "OF",
          Age: "32.5",
        },
      ];

      const result = findMatches(fantraxPlayers, caseVariations);

      expect(result.stats.totalMatches).toBe(2);
      expect(result.stats.exactMatches).toBe(2);
    });

    test("should handle special characters in names", () => {
      const specialCharFantrax = [
        {
          Number: "1",
          Player: "José Ramírez",
          Team: "CLE",
          Position: "3B",
          Age: "31",
          Status: "Active",
        },
      ];
      const specialCharIBW = [
        {
          Number: "1",
          Player: "José Ramírez",
          Team: "CLE",
          Position: "3B",
          Age: "31",
        },
      ];

      const result = findMatches(specialCharFantrax, specialCharIBW);

      expect(result.stats.totalMatches).toBe(1);
      expect(result.stats.exactMatches).toBe(1);
    });
  });
});
