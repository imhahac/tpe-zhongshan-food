import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Readable } from 'stream';

const SHEET_ID = process.env.SHEET_ID || '1k7IUK_FrCZbTatBzo8tfCVHp7Xrc1764eFq2fBQuScg';
const GID = process.env.GID || '401944406';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const MAPPING_GID = process.env.MAPPING_GID || '';

const outputDir = './src/data';
const outputPath = path.join(outputDir, 'data.json');
const mappingOutputPath = path.join(outputDir, 'mapping.json');

async function generateData() {
    console.log(`Fetching data from Google Sheets...`);
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        // Fetch main data
        const data = await new Promise((resolve, reject) => {
            const results = [];
            Readable.from([csvText])
                .pipe(csv({
                    mapHeaders: ({ header }) => header.trim(),
                    mapValues: ({ value }) => typeof value === 'string' ? value.trim() : value
                }))
                .on('data', (row) => results.push(row))
                .on('end', () => resolve(results))
                .on('error', reject);
        });

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 4));
        console.log(`Successfully generated ${outputPath} with ${data.length} records.`);

        // Fetch mappings if MAPPING_GID is provided
        const mappingObj = { locationMapping: {}, genreMapping: {} };
        if (MAPPING_GID) {
            console.log(`Fetching mappings from Google Sheets...`);
            const MAPPING_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${MAPPING_GID}`;
            const mappingRes = await fetch(MAPPING_CSV_URL);
            
            if (mappingRes.ok) {
                const mappingCsvText = await mappingRes.text();
                await new Promise((resolve, reject) => {
                    Readable.from([mappingCsvText])
                        .pipe(csv({
                            mapHeaders: ({ header }) => header.trim(),
                            mapValues: ({ value }) => typeof value === 'string' ? value.trim() : value
                        }))
                        .on('data', (row) => {
                            if (row.Location && row.locationMapping) {
                                mappingObj.locationMapping[row.Location] = row.locationMapping;
                            }
                            if (row.Genre && row.genreMapping) {
                                mappingObj.genreMapping[row.Genre] = row.genreMapping;
                            }
                        })
                        .on('end', resolve)
                        .on('error', reject);
                });
                console.log(`Successfully parsed mapping CSV.`);
            } else {
                console.warn(`Failed to fetch mapping CSV: ${mappingRes.statusText}`);
            }
        }
        
        fs.writeFileSync(mappingOutputPath, JSON.stringify(mappingObj, null, 4));
        console.log(`Successfully generated ${mappingOutputPath}.`);
            
    } catch (error) {
        console.error('Error fetching or parsing CSV:', error);
        process.exit(1);
    }
}

generateData();
