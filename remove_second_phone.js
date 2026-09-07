const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (f === '.next' || f === 'node_modules' || f === '.git' || f === '.vercel') return;
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const exts = ['.html', '.tsx', '.ts', '.js', '.md', '.sql', '.txt'];

walkDir(__dirname, (filePath) => {
    if (exts.includes(path.extname(filePath))) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content
            // Remove ''
            .replace(/\s*·\s*\+91\s*91409\s*29246/g, '')
            // Remove ''
            .replace(/\s*·\s*<a[^>]*tel:\+?919140929246[^>]*>.*?<\/a>/g, '')
            // Remove standalone link without dot
            .replace(/<a[^>]*tel:\+?919140929246[^>]*>.*?<\/a>\s*/g, '')
            // Remove ''
            .replace(/,\s*PHONE2\s*=\s*"[^"]*91409[^"]*"/g, '')
            .replace(/PHONE2\s*=\s*"[^"]*91409[^"]*",\s*/g, '')
            // Remove the whole alternate line block
            .replace(/<a href="tel:\+919140929246".*?\$\{PHONE2\}.*?<\/a>/g, '');
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated ' + filePath);
        }
    }
});
