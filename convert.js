const fs = require('fs');
const path = require('path');

function convertToCSV() {
    try {
        // Read the players.txt file
        const playersContent = fs.readFileSync('players.txt', 'utf-8');

        // Parse the content and create CSV rows
        const players = playersContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                // Extract the basic info before the scouting report
                // Pattern: number) name - team, position, age
                const basicInfoMatch = line.match(/^(\d+)\)\s*([^-]+)-\s*([^,]+),\s*([^,]+),\s*(\d+\.?\d*)/);
                
                if (basicInfoMatch) {
                    const [_, number, name, team, position, age] = basicInfoMatch;
                    // Return CSV formatted row
                    return `${number},"${name.trim()}","${team.trim()}","${position.trim()}",${age}`;
                }
                // Debug logging
                console.log('Skipped line:', line.substring(0, 100) + '...');
                return null;
            })
            .filter(line => line !== null);

        // Add header row
        const csvContent = ['Number,Player,Team,Position,Age', ...players].join('\n');

        // Write to new CSV file
        fs.writeFileSync('players.csv', csvContent);

        console.log('Conversion complete! Check players.csv');
        console.log(`Processed ${players.length} players`);
        
        // Debug: Show first processed entry if any
        if (players.length > 0) {
            console.log('\nFirst processed entry:', players[0]);
        }
        
    } catch (error) {
        console.error('Error converting file:', error);
    }
}

convertToCSV();