const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configurations
const MAP_PATH = path.join(__dirname, 'resource-map.json');
const SVG_DIR = path.join(__dirname, 'source/assets/images/erd');

if (!fs.existsSync(MAP_PATH)) {
    console.error("❌ Error: resource-map.json not found in root.");
    process.exit(1);
}

const resourceMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
const files = fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg'));

console.log(`🔍 Found ${files.length} SVGs. Starting linkification...`);

files.forEach(file => {
    const filePath = path.join(SVG_DIR, file);
    const svgContent = fs.readFileSync(filePath, 'utf8');
    
    const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
    const document = dom.window.document;

    const nodes = document.querySelectorAll('g.node.default');
    let count = 0;

    nodes.forEach(node => {
        const pTag = node.querySelector('foreignObject p');
        if (!pTag) return;

        const entityName = pTag.textContent.trim();
        const url = resourceMap[entityName];

        // The URL from the map already contains the baseUrl if one was provided
        if (url) {
            const labelGroup = node.querySelector('g.label');
            if (labelGroup) {
                if (labelGroup.parentNode.tagName.toLowerCase() !== 'a') {
                    const a = document.createElementNS('http://www.w3.org/2000/svg', 'a');
                    
                    // Simple direct assignment
                    a.setAttribute('href', url);
                    a.setAttribute('target', '_top'); 
                    
                    labelGroup.parentNode.insertBefore(a, labelGroup);
                    a.appendChild(labelGroup);
                }
                
                pTag.setAttribute('style', 'color: #e74b0f; font-weight: bold;');
                count++;
            }
        }
    });

    if (count > 0) {
        fs.writeFileSync(filePath, dom.serialize());
        console.log(`✅ ${file}: Linked ${count} entities.`);
    }
});

console.log('🚀 All done! You can now run the Jigsaw build.');