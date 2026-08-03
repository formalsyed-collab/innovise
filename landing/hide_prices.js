const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'index.html');
let content = fs.readFileSync(file, 'utf8');

// Replace <div class="sc-price">From <strong>...</strong></div>
// with <div class="sc-price" style="display: none;">From <strong>...</strong></div>
content = content.replace(/<div class="sc-price">From <strong>.*?<\/strong><\/div>/g, (match) => {
    return match.replace('<div class="sc-price">', '<div class="sc-price" style="display: none;">');
});

fs.writeFileSync(file, content, 'utf8');
console.log('Prices hidden on home page.');
