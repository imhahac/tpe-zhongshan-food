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

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        ...options
      });
      if (res.ok) return res;
      console.warn(`Fetch returned HTTP ${res.status}. Retrying (${i + 1}/${retries})...`);
    } catch (err) {
      console.warn(`Fetch attempt ${i + 1} failed: ${err.message}`);
    }
    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, backoff * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch from Google Sheets after ${retries} retries.`);
}

async function generateData() {
    console.log(`Fetching data from Google Sheets...`);
    try {
        const response = await fetchWithRetry(CSV_URL);
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
            try {
                const mappingRes = await fetchWithRetry(MAPPING_CSV_URL, {}, 2, 1000);
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
            } catch (mErr) {
                console.warn(`Failed to fetch mapping CSV (${mErr.message}), keeping existing mappings.`);
            }
        }
        
        fs.writeFileSync(mappingOutputPath, JSON.stringify(mappingObj, null, 4));
        console.log(`Successfully generated ${mappingOutputPath}.`);
            
    } catch (error) {
        console.error('Error fetching or parsing CSV:', error.message);
        if (fs.existsSync(outputPath)) {
            console.warn(`⚠️ Warning: Network request failed, falling back to existing ${outputPath} to prevent build failure.`);
        } else {
            process.exit(1);
        }
    }
}

generateData();
