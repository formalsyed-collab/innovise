const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'insights');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace <a href="#" class="nav-brand"> with <a href="../index.html" class="nav-brand">
    content = content.replace(/<a href="#" class="nav-brand">/g, '<a href="../index.html" class="nav-brand">');
    
    // Replace <div class="blog-crumb"><a href="#home">Home</a> with ../index.html
    // This is already done for some but just in case for new matches
    
    // Replace href="insights/index.html" in main landing/index.html if needed?
    // Wait, let's fix it in landing/index.html just in case.

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed nav-brand in', file);
});

// Also fix landing/index.html if it has wrong insights link
const indexHtmlPath = path.join(__dirname, 'index.html');
let mainContent = fs.readFileSync(indexHtmlPath, 'utf8');
if (mainContent.includes('href="insights/index.html"')) {
    // it's correct for landing/index.html to point to insights/index.html
}

fs.writeFileSync(indexHtmlPath, mainContent, 'utf8');

