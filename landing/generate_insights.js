const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// The main landing view marker
const mainViewMarker = '<!-- ===== MAIN LANDING VIEW ===== -->';
const footerMarker = '<footer>';

const mainViewIndex = indexHtml.indexOf(mainViewMarker);
const footerIndex = indexHtml.lastIndexOf(footerMarker);

if (mainViewIndex === -1 || footerIndex === -1) {
    console.error('Could not find markers in index.html');
    process.exit(1);
}

// Ensure asset paths work correctly when accessed from /insights/
let headerPart = indexHtml.substring(0, mainViewIndex);
// Replace asset paths: logo.png -> ../logo.png
headerPart = headerPart.replace(/src="logo\.png"/g, 'src="../logo.png"');
// Fix canonical URL
headerPart = headerPart.replace(/<link rel="canonical" href="https:\/\/innovise\.in\/" \/>/g, '<link rel="canonical" href="https://innovise.in/insights/" />');
// Fix Title
headerPart = headerPart.replace(/<title>.*?<\/title>/, '<title>Insights | Innovise Consultant</title>');

// Generate Insights Index Page
const insightsIndexContent = `
        <!-- HERO FOR INSIGHTS -->
        <section class="hero" style="padding: 120px 0 60px; min-height: 40vh; text-align: center; background: linear-gradient(180deg, var(--pearl) 0%, var(--white) 100%);">
            <div class="hero-mesh"></div>
            <div class="container">
                <div class="hero-inner" style="max-width: 800px; margin: 0 auto;">
                    <div class="reveal">

                        <h1 style="font-size: clamp(32px, 5vw, 56px); line-height: 1.1;">Innovise <span class="hl">Insights</span></h1>
                        <p class="hero-sub" style="font-size: 18px; color: var(--dim); margin-top: 16px;">Expert guides, tax updates, and compliance strategies to help your business grow.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ARTICLES GRID -->
        <section style="padding: 60px 0 100px;">
            <div class="container">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 32px;">
                    <!-- Article Card -->
                    <a href="the-importance-of-gst-compliance.html" style="background: var(--white); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; transition: all 0.2s; display: flex; flex-direction: column; text-decoration: none; color: inherit;">
                        <div style="height: 200px; background: var(--pearl2); display: flex; align-items: center; justify-content: center;">
                             <i class="fas fa-file-invoice-dollar" style="font-size: 48px; color: var(--sky);"></i>
                        </div>
                        <div style="padding: 24px;">
                            <div style="color: var(--dim); font-size: 13px; margin-bottom: 8px; display: flex; gap: 12px; align-items: center;">
                                <span><i class="far fa-calendar-alt"></i> Oct 15, 2023</span>
                                <span><i class="fas fa-tag"></i> Taxation</span>
                            </div>
                            <h3 style="font-size: 20px; margin-bottom: 12px; color: var(--ink);">The Importance of Timely GST Compliance</h3>
                            <p style="font-size: 15px; color: var(--dim); margin-bottom: 24px;">Avoid heavy penalties and ensure smooth business operations with our comprehensive GST guide.</p>
                            <span style="color: var(--fire); font-weight: 600; font-size: 14px; font-family: var(--hf);">Read Article <i class="fas fa-arrow-right"></i></span>
                        </div>
                    </a>
                </div>
            </div>
        </section>
`;

let footerPart = indexHtml.substring(footerIndex);

const finalIndex = headerPart + '\\n<div id="mainView">\\n' + insightsIndexContent + '\\n</div>\\n' + footerPart;
fs.writeFileSync(path.join(__dirname, 'insights', 'index.html'), finalIndex);

// Generate Sample Article
const sampleArticleContent = `
        <!-- ARTICLE HEADER -->
        <section style="padding: 120px 0 60px; background: var(--pearl);">
            <div class="container">
                <div style="max-width: 800px; margin: 0 auto;">
                    <a href="index.html" style="color: var(--dim); font-size: 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px;"><i class="fas fa-arrow-left"></i> Back to Insights</a>
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <span style="background: rgba(14, 165, 233, 0.1); color: var(--sky); padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700;">Taxation</span>
                    </div>
                    <h1 style="font-size: clamp(28px, 4vw, 48px); line-height: 1.2; margin-bottom: 24px;">The Importance of Timely GST Compliance</h1>
                    <div style="display: flex; align-items: center; gap: 16px; color: var(--dim); font-size: 14px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--ink); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold;">IC</div>
                            <div>
                                <div style="font-weight: 600; color: var(--ink);">Innovise Consultant</div>
                                <div>Oct 15, 2023 &middot; 5 min read</div>
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
                    <p style="margin-bottom: 24px;">Goods and Services Tax (GST) is a comprehensive, multi-stage, destination-based tax that is levied on every value addition. For businesses in India, staying compliant with GST is not just a legal obligation, but a critical factor in maintaining healthy cash flows and avoiding heavy penalties.</p>
                    
                    <h2 style="font-size: 28px; margin: 48px 0 24px; color: var(--ink);">Why is GST Compliance Important?</h2>
                    <p style="margin-bottom: 24px;">Timely filing of GST returns ensures that your business can claim Input Tax Credit (ITC) without any hurdles. Delayed filings often lead to late fees, interest on the outstanding tax amount, and in severe cases, cancellation of your GST registration.</p>
                    
                    <ul style="margin-bottom: 24px; padding-left: 24px;">
                        <li style="margin-bottom: 12px;"><strong>Avoid Penalties:</strong> Late fees can accumulate quickly, draining your profits.</li>
                        <li style="margin-bottom: 12px;"><strong>Build Trust:</strong> Vendors and clients prefer working with compliant businesses.</li>
                        <li style="margin-bottom: 12px;"><strong>Seamless ITC Claims:</strong> Your suppliers and buyers can only claim ITC if your returns are filed accurately.</li>
                    </ul>

                    <h2 style="font-size: 28px; margin: 48px 0 24px; color: var(--ink);">How Innovise Can Help</h2>
                    <p style="margin-bottom: 24px;">Managing GST compliance can be complex, especially with frequent updates to the tax laws. At Innovise Consultant, our team of expert Chartered Accountants and Company Secretaries handle everything from registration to monthly return filings, ensuring your business stays 100% compliant.</p>

                    <div style="margin-top: 60px; padding: 40px; background: var(--ink); border-radius: var(--r-xl); color: #fff; text-align: center;">
                        <h3 style="font-size: 24px; margin-bottom: 16px; color: #fff;">Need Help With Your GST?</h3>
                        <p style="color: var(--line2); margin-bottom: 32px;">Book a free 30-minute consultation with our experts today.</p>
                        <a href="../index.html#contact" class="btn btn-fire">Book Consultation</a>
                    </div>
                </div>
            </div>
        </section>
`;

let sampleHeader = headerPart.replace('<title>Insights | Innovise Consultant</title>', '<title>The Importance of Timely GST Compliance | Innovise Insights</title>');
const finalSample = sampleHeader + '\\n<div id="mainView">\\n' + sampleArticleContent + '\\n</div>\\n' + footerPart;
fs.writeFileSync(path.join(__dirname, 'insights', 'the-importance-of-gst-compliance.html'), finalSample);

// Generate Template
const templateContent = `
        <!-- ARTICLE HEADER -->
        <section style="padding: 120px 0 60px; background: var(--pearl);">
            <div class="container">
                <div style="max-width: 800px; margin: 0 auto;">
                    <a href="index.html" style="color: var(--dim); font-size: 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px;"><i class="fas fa-arrow-left"></i> Back to Insights</a>
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <span style="background: rgba(14, 165, 233, 0.1); color: var(--sky); padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700;">Category</span>
                    </div>
                    <h1 style="font-size: clamp(28px, 4vw, 48px); line-height: 1.2; margin-bottom: 24px;">Your Article Title Here</h1>
                    <div style="display: flex; align-items: center; gap: 16px; color: var(--dim); font-size: 14px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--ink); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold;">IC</div>
                            <div>
                                <div style="font-weight: 600; color: var(--ink);">Innovise Consultant</div>
                                <div>Date &middot; X min read</div>
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
                    <p style="margin-bottom: 24px;">Your article content goes here...</p>

                    <div style="margin-top: 60px; padding: 40px; background: var(--ink); border-radius: var(--r-xl); color: #fff; text-align: center;">
                        <h3 style="font-size: 24px; margin-bottom: 16px; color: #fff;">Need Professional Assistance?</h3>
                        <p style="color: var(--line2); margin-bottom: 32px;">Book a free 30-minute consultation with our experts today.</p>
                        <a href="../index.html#contact" class="btn btn-fire">Book Consultation</a>
                    </div>
                </div>
            </div>
        </section>
`;

let templateHeader = headerPart.replace('<title>Insights | Innovise Consultant</title>', '<title>Article Title | Innovise Insights</title>');
const finalTemplate = templateHeader + '\\n<div id="mainView">\\n' + templateContent + '\\n</div>\\n' + footerPart;
fs.writeFileSync(path.join(__dirname, 'insights', 'article-template.html'), finalTemplate);

console.log('Successfully generated Insights HTML files.');
