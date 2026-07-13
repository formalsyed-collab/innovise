const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// The main landing view marker
const mainViewMarker = '<!-- ===== MAIN LANDING VIEW ===== -->';
const footerMarker = '<footer>';

const mainViewIndex = indexHtml.indexOf(mainViewMarker);
const footerIndex = indexHtml.lastIndexOf(footerMarker);

let headerPart = indexHtml.substring(0, mainViewIndex);
headerPart = headerPart.replace(/src="logo\.png"/g, 'src="../logo.png"');
headerPart = headerPart.replace(/<link rel="canonical" href="https:\/\/innovise\.in\/" \/>/g, '<link rel="canonical" href="https://innovise.in/insights/itr-filing-blog-seo-ready.html" />');

let footerPart = indexHtml.substring(footerIndex);

// Read the raw blog post
const blogPath = path.join(__dirname, 'insights', 'itr-filing-blog-seo-ready.html');
const rawHtml = fs.readFileSync(blogPath, 'utf8');

// Extract title, metas, and scripts
const headContentMatches = rawHtml.match(/<title>.*?<\/script>/s);
let extraHead = '';
if (headContentMatches) {
    extraHead = headContentMatches[0];
}

// Extract article body
const articleMatch = rawHtml.match(/<article class="blog-post">(.*?)<\/article>/s);
let articleBody = '';
if (articleMatch) {
    articleBody = articleMatch[1];
}

// Build the proper article HTML
const properArticleContent = `
        <!-- ARTICLE HEADER -->
        <section style="padding: 120px 0 60px; background: var(--pearl);">
            <div class="container">
                <div style="max-width: 800px; margin: 0 auto;">
                    <a href="index.html" style="color: var(--dim); font-size: 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px;"><i class="fas fa-arrow-left"></i> Back to Insights</a>
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <span style="background: rgba(14, 165, 233, 0.1); color: var(--sky); padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700;">Taxation & Compliance</span>
                    </div>
                    <h1 style="font-size: clamp(28px, 4vw, 48px); line-height: 1.2; margin-bottom: 24px;">ITR Filing Guide for Startup Founders (AY 2026-27)</h1>
                    <div style="display: flex; align-items: center; gap: 16px; color: var(--dim); font-size: 14px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--ink); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold;">IC</div>
                            <div>
                                <div style="font-weight: 600; color: var(--ink);">Innovise Consultant</div>
                                <div>Jul 13, 2026 &middot; 6 min read</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ARTICLE BODY -->
        <section style="padding: 60px 0 100px;">
            <div class="container">
                <div style="max-width: 800px; margin: 0 auto; font-size: 17px; line-height: 1.8; color: var(--body-text);">
                    <div class="blog-content">
                        <img src="itr-cover.jpg" alt="ITR filing for first-time founders" style="width: 100%; border-radius: var(--r-xl); margin-bottom: 32px; box-shadow: var(--s2); display: block;">
                    ${articleBody}
                    </div>

                    <div style="margin-top: 60px; padding: 40px; background: var(--ink); border-radius: var(--r-xl); color: #fff; text-align: center;">
                        <h3 style="font-size: 24px; margin-bottom: 16px; color: #fff;">Need Professional Assistance?</h3>
                        <p style="color: var(--line2); margin-bottom: 32px;">Book a free 30-minute consultation with our CA team to discuss your ITR filing.</p>
                        <a href="../index.html#contact" class="btn btn-fire">Book Consultation</a>
                    </div>
                </div>
            </div>
        </section>
`;

// Replace title in headerPart
let updatedHeader = headerPart.replace(/<title>.*?<\/title>/, extraHead);

const finalHtml = updatedHeader + '\\n<div id="mainView">\\n' + properArticleContent + '\\n</div>\\n' + footerPart;
fs.writeFileSync(blogPath, finalHtml);

console.log('Fixed ITR blog post!');
