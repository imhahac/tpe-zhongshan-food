import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Readable } from 'stream';

const SHEET_ID = process.env.SHEET_ID || '1k7IUK_FrCZbTatBzo8tfCVHp7Xrc1764eFq2fBQuScg';
const GID = process.env.GID || '401944406';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const outputDir = './src/data';
const outputPath = path.join(outputDir, 'data.json');

async function generateData() {
    console.log(`Fetching data from Google Sheets...`);
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        const data = [];
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir, { recursive: true });
        }

        Readable.from([csvText])
            .pipe(csv())
            .on('data', (row) => {
                data.push(row);
            })
            .on('end', () => {
                fs.writeFileSync(outputPath, JSON.stringify(data, null, 4));
                console.log(`Successfully generated ${outputPath} with ${data.length} records.`);
            });
            
    } catch (error) {
        console.error('Error fetching or parsing CSV:', error);
        process.exit(1);
    }
}

generateData();
