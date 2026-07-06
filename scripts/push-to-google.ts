import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import xml2js from 'xml2js';

// Configuration
const KEY_FILE = path.join(process.cwd(), 'scripts', 'screencalc-indexing-481706-551aa52f6727.json');
const STATE_FILE = path.join(process.cwd(), 'scripts', 'indexing-state.json');
const MAX_URLS = 200;

async function pushToGoogle() {
    try {
        // 1. Check if key file exists
        if (!fs.existsSync(KEY_FILE)) {
            console.error(`Error: Key file not found at ${KEY_FILE}`);
            process.exit(1);
        }

        // 1.5 Load existing state
        let state: Record<string, string> = {}; // { url: lastmod_pushed }
        if (fs.existsSync(STATE_FILE)) {
            try {
                state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
            } catch (e) {
                console.warn('Warning: Could not parse state file, starting fresh.');
            }
        }

        let urlsToPush: { url: string; lastmod: string }[] = [];

        // 2. Parse CLI Arguments
        const args = process.argv.slice(2);
        const urlsIndex = args.indexOf('--urls');
        const fileIndex = args.indexOf('--file');

        if (urlsIndex !== -1 && args[urlsIndex + 1]) {
            console.log('Using manual URL list from CLI...');
            urlsToPush = args[urlsIndex + 1].split(',').map(url => ({
                url: url.trim(),
                lastmod: new Date().toISOString()
            }));
        } else if (fileIndex !== -1 && args[fileIndex + 1]) {
            const filePath = path.resolve(process.cwd(), args[fileIndex + 1]);
            if (fs.existsSync(filePath)) {
                console.log(`Reading manual URLs from file: ${filePath}`);
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                urlsToPush = fileContent.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && line.startsWith('http'))
                    .map(url => ({
                        url,
                        lastmod: new Date().toISOString()
                    }));
            } else {
                console.error(`Error: URL file not found at ${filePath}`);
                process.exit(1);
            }
        }

        // 3. Fallback to Sitemap if no manual URLs provided
        if (urlsToPush.length === 0) {
            const SITEMAP_FILES = [
                path.join(process.cwd(), 'dist/sitemap-0.xml'),
                path.join(process.cwd(), 'dist/sitemap-index.xml'),
                path.join(process.cwd(), 'dist/sitemap.xml')
            ];

            const SITEMAP_FILE = SITEMAP_FILES.find(f => fs.existsSync(f));

            if (!SITEMAP_FILE) {
                console.error(`Error: No sitemap file found in 'dist/'. Please run 'npm run build' first.`);
                process.exit(1);
            }

            console.log(`Parsing sitemap: ${SITEMAP_FILE}`);
            const sitemapContent = fs.readFileSync(SITEMAP_FILE, 'utf-8');
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(sitemapContent);
            const rawUrls = result.urlset?.url || [];

            console.log('Filtering and sorting URLs by lastmod...');
            const sortedUrls = rawUrls
                .map((u: any) => ({
                    url: u.loc[0],
                    lastmod: u.lastmod ? u.lastmod[0] : '1970-01-01'
                }))
                // Filter: only push if never pushed or if sitemap date > pushed date
                .filter((u: any) => {
                    const lastPushedLastmod = state[u.url];
                    if (!lastPushedLastmod) return true; // Never pushed
                    return new Date(u.lastmod).getTime() > new Date(lastPushedLastmod).getTime(); // Updated
                })
                .sort((a: any, b: any) => {
                    return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
                });

            console.log(`Initial URLs that need update: ${sortedUrls.length}`);
            urlsToPush = sortedUrls.slice(0, MAX_URLS);
        }

        console.log(`Total URLs selected for indexing: ${urlsToPush.length}`);

        if (urlsToPush.length === 0) {
            console.log('No URLs found to push.');
            return;
        }

        // 4. Authenticate and Push URLs
        console.log('Authenticating with Google Indexing API...');
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        const indexing = google.indexing({
            version: 'v3',
            auth: auth
        });

        console.log(`Starting push of ${urlsToPush.length} URLs...`);

        for (const entry of urlsToPush) {
            try {
                await indexing.urlNotifications.publish({
                    requestBody: {
                        url: entry.url,
                        type: 'URL_UPDATED',
                    },
                });
                console.log(`[SUCCESS] ${entry.lastmod} - ${entry.url}`);

                // Update state after success
                state[entry.url] = entry.lastmod;
                fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

            } catch (err: any) {
                const status = err.response?.status || err.code;
                const errorMsg = err.response?.data?.error?.message || err.message;

                console.error(`[ERROR] (${status}) Failed to push ${entry.url}:`, errorMsg);

                // If we hit quota limit, stop early
                if (status === 429) {
                    console.error('Quota limit reached. Stopping.');
                    break;
                }

                if (status === 403 || status === 401) {
                    console.error('Authentication or permission error. Please check your credentials and API activation.');
                    break;
                }
            }
        }

        console.log('Indexing push process completed.');

    } catch (error) {
        console.error('An unexpected error occurred:', error);
        process.exit(1);
    }
}

pushToGoogle();
