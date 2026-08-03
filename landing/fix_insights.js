const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'insights');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace navbar and mobile menu links
    content = content.replace(/href="#home"/g, 'href="../index.html"');
    content = content.replace(/href="#process"/g, 'href="../index.html#process"');
    content = content.replace(/href="#estimator"/g, 'href="../index.html#estimator"');
    content = content.replace(/href="#all-services"/g, 'href="../index.html#all-services"');
    content = content.replace(/href="#contact"/g, 'href="../index.html#contact"');
    
    // Replace "insights/index.html" link to point to current directory index
    content = content.replace(/href="insights\/index\.html"/g, 'href="index.html"');

    // Replace JS routing and crumbs
    // Note: If `#blog/` hashes exist, they stay the same because they are handled by route() in JS.
    // However, the home link in the crumb needs to be fixed.
    content = content.replace(/href=\\"#home\\"/g, 'href=\\"../index.html\\"');
    // Wait, in JS template literals it is usually just href="#home", not escaped quotes, unless it is a string.
    
    // Re-check replacing for JS template literals
    // The previous replace(/href="#home"/g) will also catch the ones in JS template literals.
    // That's perfect!

    // Fix the broken blog link in insights/index.html
    // <a href="itr-filing-blog-seo-ready" -> <a href="itr-filing-blog-seo-ready.html"
    content = content.replace(/href="itr-filing-blog-seo-ready"/g, 'href="itr-filing-blog-seo-ready.html"');

    // For any other blog links:
    content = content.replace(/href="the-importance-of-gst-compliance"/g, 'href="the-importance-of-gst-compliance.html"');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
});
