import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEARCH_SRC = path.join(__dirname, 'data', 'quran', 'search');

function quranSearchAssets() {
    return {
        name: 'quran-search-assets',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url?.split('?')[0] || '';
                const prefix = '/data/quran/search/';
                if (!url.startsWith(prefix)) return next();

                const rel = decodeURIComponent(url.slice(prefix.length));
                if (!rel || rel.includes('..')) return next();

                const filePath = path.join(SEARCH_SRC, rel);
                if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return next();

                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                fs.createReadStream(filePath).pipe(res);
            });
        },
        closeBundle() {
            const dest = path.join(__dirname, 'www', 'data', 'quran', 'search');
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.cpSync(SEARCH_SRC, dest, { recursive: true });

            const assetsDir = path.join(__dirname, 'www', 'assets');
            const orphanSearchChunks =
                /^(?:ar-ayah|translit-tr|meal-(?:tr|en|id|ms|fr|bn|ur))-[A-Za-z0-9_-]+\.js$/;
            if (fs.existsSync(assetsDir)) {
                for (const name of fs.readdirSync(assetsDir)) {
                    if (orphanSearchChunks.test(name)) {
                        fs.unlinkSync(path.join(assetsDir, name));
                    }
                }
            }
        }
    };
}

export default defineConfig({
    base: './',
    publicDir: 'public',
    plugins: [quranSearchAssets()],
    build: {
        outDir: 'www',
        emptyOutDir: true,
        chunkSizeWarningLimit: 2500
    }
});
