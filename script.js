const fs = require('fs');
const csv = require('csv-parse/sync');

function findMatchingPlayers() {
    try {
        // Read both CSV files
        const lmlContent = fs.readFileSync('stakes.csv', 'utf-8');
        const ibwContent = fs.readFileSync('IBW.csv', 'utf-8');

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

        // Create a map of LML players for efficient lookup using both name and team
        const lmlPlayersMap = new Map(
            lmlPlayers.map(record => {
                const key = `${record.Player.toLowerCase().trim()}_${record.Team.toLowerCase().trim()}`;
                return [key, record];
            })
        );

        // Get the column names from IBW CSV
        const ibwColumns = Object.keys(ibwPlayers[0]);
        const rankColumn = ibwColumns[1];    // Second column for ranking
        const playerColumn = ibwColumns[2];   // Third column for player name
        const teamColumn = ibwColumns[3];     // Fourth column for team

        // Find matches by going through IBW players in order
        const matchingPlayers = ibwPlayers.filter(ibwPlayer => {
            const playerName = ibwPlayer[playerColumn].toLowerCase().trim();
            const teamName = ibwPlayer[teamColumn].toLowerCase().trim();
            const key = `${playerName}_${teamName}`;
            const hasMatch = lmlPlayersMap.has(key);
            console.log(`Checking "${ibwPlayer[playerColumn]} - ${ibwPlayer[teamColumn]}" (${key}): ${hasMatch}`);
            return hasMatch;
        });

        // Create output content
        const outputContent = matchingPlayers.map(ibwPlayer => {
            const playerName = ibwPlayer[playerColumn].toLowerCase().trim();
            const teamName = ibwPlayer[teamColumn].toLowerCase().trim();
            const key = `${playerName}_${teamName}`;
            const lmlData = lmlPlayersMap.get(key);
            return {
                'IBW Rank': ibwPlayer[rankColumn],
                'IBW Player': ibwPlayer[playerColumn],
                'IBW Team': ibwPlayer[teamColumn],
                'LML Number': lmlData.Number,
                'LML Team': lmlData.Team,
                'LML Position': lmlData.Position,
                'LML Age': lmlData.Age
            };
        });

        // Convert to CSV string
        const headers = Object.keys(outputContent[0] || {}).join(',');
        const rows = outputContent.map(row => 
            Object.values(row).map(val => `"${val}"`).join(',')
        );
        
        const finalCsv = [headers, ...rows].join('\n');

        // Write matches to new file
        fs.writeFileSync('matching_players_stakes.csv', finalCsv);

        console.log(`\nFound ${matchingPlayers.length} matching players. Results written to matching_players_ibw.csv`);
        if (matchingPlayers.length > 0) {
            console.log('First few matches:', matchingPlayers.slice(0, 3).map(p => 
                `Rank ${p[rankColumn]}: ${p[playerColumn]} (${p[teamColumn]})`
            ));
        }

    } catch (error) {
        console.error('Error processing files:', error);
        console.error('Error details:', error.stack);
    }
}

findMatchingPlayers();