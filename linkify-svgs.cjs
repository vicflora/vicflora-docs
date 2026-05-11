const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configurations
const MAP_PATH = path.join(__dirname, 'resource-map.json');
const VOCAB_MAP_PATH = path.join(__dirname, 'vocab-map.json'); // New Map
const SVG_DIR = path.join(__dirname, 'source/assets/images/erd');

if (!fs.existsSync(MAP_PATH) || !fs.existsSync(VOCAB_MAP_PATH)) {
    console.error("❌ Error: resource-map.json or vocab-map.json not found in root.");
    process.exit(1);
}

const resourceMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
const vocabMap = JSON.parse(fs.readFileSync(VOCAB_MAP_PATH, 'utf8'));
const files = fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg'));

console.log(`🔍 Found ${files.length} SVGs. Starting linkification...`);

files.forEach(file => {
    const filePath = path.join(SVG_DIR, file);
    const svgContent = fs.readFileSync(filePath, 'utf8');
    
    const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
    const document = dom.window.document;

    // --- 1. Entity/Table Links ---
    const nodes = document.querySelectorAll('g.node.default');
    let count = 0;

    nodes.forEach(node => {
        const pTag = node.querySelector('foreignObject p');
        if (!pTag) return;

        const entityName = pTag.textContent.trim();
        const url = resourceMap[entityName];

        if (url) {
            const labelGroup = node.querySelector('g.label');
            if (labelGroup && labelGroup.parentNode.tagName.toLowerCase() !== 'a') {
                const a = document.createElementNS('http://www.w3.org/2000/svg', 'a');
                a.setAttribute('href', url);
                a.setAttribute('target', '_top'); 
                labelGroup.parentNode.insertBefore(a, labelGroup);
                a.appendChild(labelGroup);
                
                pTag.setAttribute('style', 'color: #e74b0f; font-weight: bold;');
                count++;
            }
        }
    });

    // --- 2. Enum/Vocabulary Links ---
    const typeGroups = document.querySelectorAll('g.label.attribute-type');

    typeGroups.forEach(typeGroup => {
        const typeP = typeGroup.querySelector('p');
        
        if (typeP && typeP.textContent.trim() === 'enum') {
            // Navigate directly to the next sibling in the DOM
            let nameGroup = typeGroup.nextElementSibling;

            // Ensure we actually found the attribute-name group
            if (nameGroup && nameGroup.classList.contains('attribute-name')) {
                const nameP = nameGroup.querySelector('p');
                
                if (nameP) {
                    const fieldName = nameP.textContent.trim();
                    const url = vocabMap[fieldName];

                    if (url && nameGroup.parentNode.tagName.toLowerCase() !== 'a') {
                        const a = document.createElementNS('http://www.w3.org/2000/svg', 'a');
                        a.setAttribute('href', url);
                        a.setAttribute('target', '_top');
                        
                        // Wrap the nameGroup in the link
                        nameGroup.parentNode.insertBefore(a, nameGroup);
                        a.appendChild(nameGroup);

                        // Apply the style directly to the p tag
                        nameP.setAttribute('style', 'color: #e74b0f; font-weight: bold; text-decoration: underline;');
                        count++;
                    }
                }
            }
        }
    });

    if (count > 0) {
        fs.writeFileSync(filePath, dom.serialize());
        console.log(`✅ ${file}: Linked ${count} items.`);
    }
});

console.log('🚀 All done! You can now run the Jigsaw build.');