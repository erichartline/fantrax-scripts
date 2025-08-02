const fs = require('fs');
const csv = require('csv-parse/sync');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify the question function for easier async usage
function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function findMatchingPlayers() {
  try {
    // Ask for file names
    const lmlFilename = await question('Enter the first CSV file name (LML players): ');
    const ibwFilename = await question('Enter the second CSV file name (IBW prospects): ');
    const outputFilename = await question('Enter the output CSV file name: ');

    // Read both CSV files
    const lmlContent = fs.readFileSync(lmlFilename, 'utf-8');
    const ibwContent = fs.readFileSync(ibwFilename, 'utf-8');

    // Parse both CSV files
    const lmlPlayers = csv.parse(lmlContent, {
      columns: true,
      skip_empty_lines: true
    });

    const ibwPlayers = csv.parse(ibwContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Debug: Show column names from both files
    console.log('\nLML CSV columns:', Object.keys(lmlPlayers[0]));
    console.log('IBW CSV columns:', Object.keys(ibwPlayers[0]));

    // Use the specific column indices as provided
    // LML CSV: Player is column 2, Team is column 3
    // IBW CSV: Name is column 4, Team is column 5 (updated as requested)
    const lmlColumns = Object.keys(lmlPlayers[0]);
    const ibwColumns = Object.keys(ibwPlayers[0]);

    const lmlPlayerColumn = lmlColumns[1]; // Column 2 (0-indexed)
    const lmlTeamColumn = lmlColumns[2];   // Column 3 (0-indexed)
    
    const ibwPlayerColumn = ibwColumns[3]; // Column 4 (0-indexed) - UPDATED
    const ibwTeamColumn = ibwColumns[4];   // Column 5 (0-indexed) - UPDATED
    const ibwRankColumn = ibwColumns[0];   // Assuming rank is in column 1
    
    console.log(`\nUsing column mappings:
      LML Player column: ${lmlPlayerColumn}
      LML Team column: ${lmlTeamColumn}
      IBW Player column: ${ibwPlayerColumn}
      IBW Team column: ${ibwTeamColumn}
      IBW Rank column: ${ibwRankColumn}
    `);

    // Create a map of LML players for efficient lookup using different matching strategies
    const lmlPlayersMap = new Map();
    
    lmlPlayers.forEach(record => {
      const playerName = record[lmlPlayerColumn]?.trim() || '';
      const teamName = record[lmlTeamColumn]?.trim() || '';
      
      // Store with full name and team (case-insensitive)
      const fullKey = `${playerName.toLowerCase()}_${teamName.toLowerCase()}`;
      lmlPlayersMap.set(fullKey, record);
      
      // Also store with just the player name
      const nameOnlyKey = playerName.toLowerCase();
      if (!lmlPlayersMap.has(nameOnlyKey)) {
        lmlPlayersMap.set(nameOnlyKey, record);
      }
    });

    // Find matches using different matching strategies
    console.log('\nLooking for matches...');
    const matchingPlayers = [];
    let exactMatches = 0;
    let nameOnlyMatches = 0;

    ibwPlayers.forEach((ibwPlayer, index) => {
      if (!ibwPlayer[ibwPlayerColumn]) {
        return; // Skip entries without a player name
      }
      
      const playerName = ibwPlayer[ibwPlayerColumn].trim();
      const teamName = (ibwPlayer[ibwTeamColumn] || '').trim();
      
      // Try different matching strategies
      const fullKey = `${playerName.toLowerCase()}_${teamName.toLowerCase()}`;
      const nameOnlyKey = playerName.toLowerCase();
      
      let lmlData = null;
      let matchType = null;
      
      // Try exact match first (name + team)
      if (lmlPlayersMap.has(fullKey)) {
        lmlData = lmlPlayersMap.get(fullKey);
        matchType = 'exact';
        exactMatches++;
      } 
      // Then try just name match
      else if (lmlPlayersMap.has(nameOnlyKey)) {
        lmlData = lmlPlayersMap.get(nameOnlyKey);
        matchType = 'name-only';
        nameOnlyMatches++;
      }
      
      if (lmlData) {
        matchingPlayers.push({
          ibwPlayer,
          lmlData,
          matchType
        });
        
        console.log(`Match found: ${playerName} (${teamName}) - ${matchType} match`);
      }
    });

    console.log(`\nFound ${matchingPlayers.length} matching players`);
    console.log(`- ${exactMatches} exact matches (name + team)`);
    console.log(`- ${nameOnlyMatches} name-only matches`);
    
    if (matchingPlayers.length === 0) {
      console.log('\nNo matches found. Here are some sample records to help troubleshoot:');
      console.log('\nLML Sample (first 2 records):');
      lmlPlayers.slice(0, 2).forEach((player, idx) => {
        console.log(`Record ${idx + 1}:`, 
          `Player: "${player[lmlPlayerColumn]}"`, 
          `Team: "${player[lmlTeamColumn]}"`
        );
      });
      
      console.log('\nIBW Sample (first 2 records):');
      ibwPlayers.slice(0, 2).forEach((player, idx) => {
        console.log(`Record ${idx + 1}:`, 
          `Player: "${player[ibwPlayerColumn]}"`, 
          `Team: "${player[ibwTeamColumn]}"`
        );
      });
      
      rl.close();
      return;
    }

    // Create output content
    const outputContent = matchingPlayers.map(match => {
      const { ibwPlayer, lmlData } = match;
      
      return {
        'IBW Rank': ibwPlayer[ibwRankColumn] || '',
        'IBW Player': ibwPlayer[ibwPlayerColumn] || '',
        'IBW Team': ibwPlayer[ibwTeamColumn] || '',
        'LML Number': lmlData.Number || lmlData['#'] || '',
        'LML Player': lmlData[lmlPlayerColumn] || '',
        'LML Team': lmlData[lmlTeamColumn] || '',
        'LML Position': lmlData.Position || lmlData.Pos || '',
        'LML Age': lmlData.Age || ''
      };
    });

    // Convert to CSV string
    const headers = Object.keys(outputContent[0] || {}).join(',');
    const rows = outputContent.map(row => 
      Object.values(row).map(val => `"${val || ''}"`).join(',')
    );
    
    const finalCsv = [headers, ...rows].join('\n');

    // Write matches to new file
    fs.writeFileSync(outputFilename, finalCsv);

    console.log(`\nResults written to ${outputFilename}`);

  } catch (error) {
    console.error('Error processing files:', error);
    console.error('Error details:', error.stack);
  } finally {
    // Close the readline interface
    rl.close();
  }
}

// Execute the function
findMatchingPlayers();