const fs = require('fs');
const csv = require('csv-parse/sync');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt user for input
function promptUser(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function findMatchingPlayers() {
    try {
        // Ask user for input filenames
        const lmlFilename = await promptUser('Enter the filename for the list of all available baseball players (e.g., LML.csv): ');
        const prospectsFilename = await promptUser('Enter the filename for the list of ranked baseball players (e.g., ibw-prospects.csv): ');
        const outputFilename = await promptUser('Enter the filename for the output CSV (e.g., matching_players.csv): ');

        console.log(`\nReading files: ${lmlFilename} and ${prospectsFilename}`);

        // Read both CSV files
        const lmlContent = fs.readFileSync(lmlFilename, 'utf-8');
        const prospectsContent = fs.readFileSync(prospectsFilename, 'utf-8');

        // Parse LML CSV file
        const lmlPlayers = csv.parse(lmlContent, {
            columns: true,
            skip_empty_lines: true
        });

        // Parse prospects CSV file - handle the specific format of ibw-prospects.csv
        const prospectsPlayers = csv.parse(prospectsContent, {
            columns: false,
            skip_empty_lines: true
        });

        console.log(`Loaded ${lmlPlayers.length} players from ${lmlFilename}`);
        console.log(`Loaded ${prospectsPlayers.length} prospects from ${prospectsFilename}`);

        // Create a map of LML players for efficient lookup
        const lmlPlayersMap = new Map();
        
        lmlPlayers.forEach(record => {
            if (record.Player) {
                // Create keys with different variations to improve matching
                const playerName = record.Player.replace(/"/g, '').trim();
                const teamName = record.Team ? record.Team.trim() : '';
                
                // Key by name only (lowercase)
                const nameKey = playerName.toLowerCase();
                
                // Key by name and team (lowercase)
                const nameTeamKey = `${playerName.toLowerCase()}_${teamName.toLowerCase()}`;
                
                lmlPlayersMap.set(nameKey, record);
                lmlPlayersMap.set(nameTeamKey, record);
            }
        });

        // Find matches by going through prospects players in order
        const matchingPlayers = [];
        
        prospectsPlayers.forEach(prospect => {
            // For ibw-prospects.csv format: [rank, oldRank, name, team, position, age, notes]
            const rank = prospect[0];
            const playerName = prospect[2] ? prospect[2].trim() : '';
            const teamName = prospect[3] ? prospect[3].trim() : '';
            
            if (!playerName) return; // Skip if no player name
            
            // Try different matching strategies
            const nameKey = playerName.toLowerCase();
            const nameTeamKey = `${playerName.toLowerCase()}_${teamName.toLowerCase()}`;
            
            let lmlData = null;
            
            // Try to match by name and team first
            if (lmlPlayersMap.has(nameTeamKey)) {
                lmlData = lmlPlayersMap.get(nameTeamKey);
            } 
            // If no match, try by name only
            else if (lmlPlayersMap.has(nameKey)) {
                lmlData = lmlPlayersMap.get(nameKey);
            }
            
            if (lmlData) {
                matchingPlayers.push({
                    'Rank': rank,
                    'Player': playerName,
                    'Team': teamName,
                    'Position': prospect[4] || '',
                    'Age': prospect[5] || '',
                    'LML_ID': lmlData.ID ? lmlData.ID.replace(/"/g, '') : '',
                    'LML_Team': lmlData.Team || '',
                    'LML_Position': lmlData.Position || '',
                    'LML_Status': lmlData.Status || '',
                    'LML_Age': lmlData.Age || ''
                });
            }
        });

        // Sort by rank (which should maintain the original order)
        matchingPlayers.sort((a, b) => {
            return parseInt(a.Rank) - parseInt(b.Rank);
        });

        // Convert to CSV string
        const headers = Object.keys(matchingPlayers[0] || {}).join(',');
        const rows = matchingPlayers.map(row => 
            Object.values(row).map(val => `"${val}"`).join(',')
        );
        
        const finalCsv = [headers, ...rows].join('\n');

        // Write matches to new file
        fs.writeFileSync(outputFilename, finalCsv);

        console.log(`\nFound ${matchingPlayers.length} matching players. Results written to ${outputFilename}`);
        
        if (matchingPlayers.length > 0) {
            console.log('\nFirst few matches:');
            matchingPlayers.slice(0, 5).forEach(p => {
                console.log(`Rank ${p.Rank}: ${p.Player} (${p.Team}) - Matched with LML ID: ${p.LML_ID}`);
            });
        }

    } catch (error) {
        console.error('Error processing files:', error);
        console.error('Error details:', error.stack);
    } finally {
        rl.close();
    }
}

// Run the function
findMatchingPlayers();