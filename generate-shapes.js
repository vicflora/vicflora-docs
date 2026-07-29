import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Parser } from 'n3';
import jsonld from 'jsonld';

const SOURCE_DIR = path.resolve('source/_rdf');
const OUTPUT_DIR = path.resolve('source/assets/images/shapes');

const engineArgIndex = process.argv.indexOf('--engine');
const LAYOUT_ENGINE = (engineArgIndex !== -1 && process.argv[engineArgIndex + 1]) 
    ? process.argv[engineArgIndex + 1].toLowerCase() 
    : 'dot';

const useSplines = LAYOUT_ENGINE === 'dot' ? 'true' : 'false';
const isSpringLayout = ['neato', 'fdp', 'sfdp'].includes(LAYOUT_ENGINE);

const DOT_CONFIG = `
    ${isSpringLayout ? '' : 'rankdir=LR;'}
    splines=${useSplines};
    overlap=false;       
    maxiter=500;         
    nodesep=0.5;
    ranksep=0.8;
    node [fontname="Arial,Helvetica", fontsize=10, style="filled,rounded"];
    edge [fontname="Arial,Helvetica", fontsize=9, color="#546E7A", fontcolor="#37474F", arrowsize=0.7];
`;

/**
 * Master mapping dictionary linking your preferred, customized visual labels
 * directly to their official, fully qualified GBIF base vocabulary IRIs.
 */
const CONTROLLED_VOCABULARIES = {
    'TaxonRank':                   'http://rs.gbif.org/vocabulary/gbif/rank/',
    'NomenclaturalCode':           'http://rs.gbif.org/vocabulary/gbif/nomenclatural_code/',
    'NomenclaturalStatus':         'http://rs.gbif.org/vocabulary/gbif/nomenclatural_status/',
    'TypeOfType':                  'http://rs.gbif.org/vocabulary/gbif/type_status/',
    'EPSG':                        'https://epsg.io/',
    'OA':                          'http://www.w3.org/ns/oa#'
};

/**
 * Clean presentation-friendly color themes grouped by core metadata classes.
 */
const COLOR_PALETTE = {
    'TaxonName':             { fill: '#E8F5E9', stroke: '#2E7D32' }, // Soft Green
    'TaxonConcept':          { fill: '#E3F2FD', stroke: '#1565C0' }, // Soft Blue
    'BibliographicResource': { fill: '#E0F2F1', stroke: '#00695C' }, // Soft Teal

    'DefaultResource':       { fill: '#F5F5F5', stroke: '#424242' }  
};

function chunkText(str, maxChars = 45) {
    const words = str.split(' ');
    let lines = [];
    let currentLine = '';
    for (let word of words) {
        if ((currentLine + word).length > maxChars) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    }
    if (currentLine) lines.push(currentLine.trim());
    return lines.join('\\n');
}

function formatDotNode(term, nodeTypeMap) {
    const termValue = term && term.value ? term.value : (term && term.id ? term.id : String(term));
    const id = `"${termValue.replace(/"/g, '\\"')}"`;
    
    if (term && term.termType === 'Literal') {
        const cleanLiteral = termValue.replace(/"/g, '\\"').replace(/\r?\n|\r/g, ' ');
        const wrappedLabel = chunkText(cleanLiteral, 45);
        return { id, isTypeNode: false, definition: `${id} [shape=box, fillcolor="#FFFFFF", color="#B0BEC5", label="${wrappedLabel}"];` };
    }

    const resolvedType = nodeTypeMap.get(id) || 'DefaultResource';
    const theme = COLOR_PALETTE[resolvedType] || COLOR_PALETTE['DefaultResource'];
    
    let label = term && term.termType === 'NamedNode' ? '[' + resolvedType + ']\\n' + termValue : '[' + resolvedType + ']';

    return {
        id,
        isTypeNode: id.toLowerCase().includes('ontology') || id.toLowerCase().includes('schema'),
        definition: `${id} [shape=ellipse, style="filled", fillcolor="${theme.fill}", color="${theme.stroke}", penwidth=1.0, label="${label}"];`
    };
}

function triplesToDot(triples) {
    const nodeDefinitions = new Set();
    const edges = [];
    const nodeTypeMap = new Map();
    
    // 1. First Pass: Map out explicit types declared via rdf:type statements
    for (const triple of triples) {
        const predicateLabel = triple.predicate.value.split(/[#/]/).pop() || triple.predicate.value;
        if (predicateLabel === 'type') {
            const subjectValue = triple.subject.value || triple.subject.id;
            const subjectId = `"${subjectValue.replace(/"/g, '\\"')}"`;
            const typeShortName = triple.object.value.split(/[#/]/).pop() || triple.object.value;
            nodeTypeMap.set(subjectId, typeShortName);
        }
    }

    // 2. Second Pass: Contextual Edge-Guessing Fallback for core untyped external resources
    for (const triple of triples) {
        const predicateLabel = triple.predicate.value.split(/[#/]/).pop() || triple.predicate.value;
        
        if (triple.object.termType === 'NamedNode') {
            const objectValue = triple.object.value || triple.object.id || '';
            
            // Check if this node is an expanded GBIF vocabulary term string
            const isVocab = Object.keys(CONTROLLED_VOCABULARIES).some(className => {
                return objectValue.startsWith(CONTROLLED_VOCABULARIES[className]);
            });

            // CRITICAL CHANGE: Completely skip vocabulary nodes in this map layout routing pass!
            if (isVocab) continue;

            const objectId = `"${triple.object.value.replace(/"/g, '\\"')}"`;
            if (!nodeTypeMap.has(objectId)) {
                if (['taxonName', 'basionym', 'replacedName', 'combinationAuthor'].includes(predicateLabel)) {
                    nodeTypeMap.set(objectId, 'TaxonName');
                } 
                else if (['accordingTo', 'publishedIn'].includes(predicateLabel)) {
                    nodeTypeMap.set(objectId, 'BibliographicResource');
                }
            }
        }
    }
    
    let literalCounter = 0;

    // 3. Third Pass: Relationships builder with isolated box definitions
    for (const triple of triples) {
        const predicateLabel = triple.predicate.value.split(/[#/]/).pop() || triple.predicate.value;
        if (predicateLabel === 'type') continue;

        const subject = formatDotNode(triple.subject, nodeTypeMap);
        let objectId;
        let objectDefinition;

        const objectValue = triple.object.value || triple.object.id || '';
        
        // Match the raw URI text directly against your configuration base keys
        const matchedVocabName = Object.keys(CONTROLLED_VOCABULARIES).find(className => {
            return objectValue.startsWith(CONTROLLED_VOCABULARIES[className]);
        });

        // --- THE VOCABULARY BYPASS LAYER ---
        if (matchedVocabName) {
            // Extract just the shorthand term text (e.g. 'syntype' or 'superfluum')
            const shortTermValue = objectValue.split(/[#/]/).pop() || objectValue;
            const subjectValue = triple.subject.value || triple.subject.id;
            
            // Build a completely isolated unique box key identifier per relationship
            const uniqueVocabKey = `vcb_${subjectValue.replace(/[^a-zA-Z0-9]/g, '')}_${predicateLabel}_${literalCounter++}`;
            objectId = `"${uniqueVocabKey}"`;
            
            const wrappedLabel = chunkText(shortTermValue, 45);
            // Formats as an independent literal box shape using the yellow color theme profile settings
            objectDefinition = `${objectId} [shape=box, style="filled", fillcolor="#FFFDE7", color="#FBC02D", label="${wrappedLabel}"];`;
        } 
        else if (triple.object.termType === 'Literal') {
            const subjectValue = triple.subject.value || triple.subject.id;
            const uniqueLiteralKey = `lit_${subjectValue.replace(/[^a-zA-Z0-9]/g, '')}_${predicateLabel}_${literalCounter++}`;
            objectId = `"${uniqueLiteralKey}"`;
            
            const cleanLiteral = triple.object.value.replace(/"/g, '\\"').replace(/\r?\n|\r/g, ' ');
            const wrappedLabel = chunkText(cleanLiteral, 45);
            objectDefinition = `${objectId} [shape=box, fillcolor="#FFFFFF", color="#B0BEC5", label="${wrappedLabel}"];`;
        } 
        else {
            const object = formatDotNode(triple.object, nodeTypeMap);
            objectId = object.id;
            objectDefinition = object.definition;
            if (object.isTypeNode) continue;
        }

        if (subject.isTypeNode) continue;

        nodeDefinitions.add(subject.definition);
        nodeDefinitions.add(objectDefinition);
        edges.push(`${subject.id} -> ${objectId} [label="${predicateLabel}"];`);
    }

    return ['digraph Taxonomic_Data_Graph {', DOT_CONFIG, '    // Taxonomy Nodes', ...Array.from(nodeDefinitions).map(line => `    ${line}`), '\n    // Relationships', ...edges.map(line => `    ${line}`), '}'].join('\n');
}

(async () => {
    try {
        const files = fs.readdirSync(SOURCE_DIR).filter(file => file.endsWith('.ttl') || file.endsWith('.jsonld'));
        if (files.length === 0) process.exit(0);

        const localContextPath = path.join(SOURCE_DIR, 'context.jsonld');
        let localContextObj = null;
        if (fs.existsSync(localContextPath)) {
            localContextObj = JSON.parse(fs.readFileSync(localContextPath, 'utf8'));
        }

        console.log(`🚀 Processing unified RDF datasets via engine: \x1b[36m${LAYOUT_ENGINE.toUpperCase()}\x1b[0m`);
        const dataFiles = files.filter(f => f !== 'context.jsonld');

        for (const file of dataFiles) {
            const inputFilePath = path.join(SOURCE_DIR, file);
            const ext = path.extname(file);
            
            const typeTag = ext === '.ttl' ? '-ttl-shape' : '-jsonld-shape';
            const suffix = LAYOUT_ENGINE === 'dot' ? typeTag : `${typeTag}-${LAYOUT_ENGINE}`;
            const outputFileName = file.replace(ext, `${suffix}.svg`);
            const outputFilePath = path.join(OUTPUT_DIR, outputFileName);

            try {
                const rawData = fs.readFileSync(inputFilePath, 'utf8');
                let triples = [];

                if (ext === '.ttl') {
                    const parser = new Parser();
                    triples = parser.parse(rawData);
                } 
                else if (ext === '.jsonld') {
                    const jsonParsed = JSON.parse(rawData);
                    if (localContextObj) {
                        if (jsonParsed['@context'] && typeof jsonParsed['@context'] === 'string' && jsonParsed['@context'].includes('tdwg/tcs2')) {
                            jsonParsed['@context'] = localContextObj['@context'];
                        } else if (Array.isArray(jsonParsed['@context'])) {
                            jsonParsed['@context'] = jsonParsed['@context'].map(ctx => {
                                if (typeof ctx === 'string' && ctx.includes('tdwg/tcs2')) return localContextObj['@context'];
                                return ctx;
                            });
                        }
                    }
                    const rdfQuads = await jsonld.toRDF(jsonParsed);
                    triples = rdfQuads.map(quad => ({ subject: quad.subject, predicate: quad.predicate, object: quad.object }));
                }

                const dotString = triplesToDot(triples);
                const svgBuffer = execSync(`${LAYOUT_ENGINE} -Tsvg`, { input: dotString, maxBuffer: 1024 * 1024 * 50 });
                let fluidSvg = svgBuffer.toString().replace(/width="[^"]+"/, 'width="100%"').replace(/height="[^"]+"/, 'height="100%"');

                fs.writeFileSync(outputFilePath, fluidSvg);
                console.log(`  \x1b[32m%s\x1b[0m`, `🔹 Shape Vector Generated: ${outputFileName}`);
            } catch (fileErr) {
                console.error(`  \x1b[31m%s\x1b[0m`, `❌ Skipped "${file}": ${fileErr.message.trim()}`);
            }
        }
        console.log('\n\x1b[32m%s\x1b[0m', '🏁 Unified presentation asset sweep complete!');
    } catch (err) {
        console.error(err);
    }
})();
