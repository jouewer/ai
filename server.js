const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const PORT = 3000;
const LOG_FILE = path.join(__dirname, 'log.txt');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
};

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/submit') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const formData = querystring.parse(body);
            const timestamp = new Date().toLocaleString();
            const logEntry = `
--------------------------------------------------
Time: ${timestamp}
Name: ${formData.name || ''}
Email: ${formData.email || ''}
Title: ${formData.title || ''}
Message: ${formData.message || ''}
--------------------------------------------------
`;
            fs.appendFile(LOG_FILE, logEntry, (err) => {
                if (err) {
                    console.error('Error writing to log file:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('Server Error: Unable to save data.');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Success');
            });
        });
    } else {
        // Serve static files
        let filePath = '.' + req.url;
        if (filePath === './') {
            filePath = './index.html';
        }
        // Handle query parameters
        filePath = filePath.split('?')[0];

        const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        const absolutePath = path.join(__dirname, normalizedPath);

        if (!absolutePath.startsWith(__dirname)) {
             res.writeHead(403);
             res.end('Forbidden');
             return;
        }

        const extname = String(path.extname(absolutePath)).toLowerCase();
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(absolutePath, (error, content) => {
            if (error) {
                if(error.code == 'ENOENT'){
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                }
                else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                }
            }
            else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
