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
        let newContent = content.replace(/8052566560/g, '8052566560')
                                .replace(/80525 66560/g, '80525 66560')
                                .replace(/80525-66560/g, '80525-66560');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated ' + filePath);
        }
    }
});
