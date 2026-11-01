import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { 
  LAYERS, 
  LABEL_FONT_SIZE, 
  LABEL_PADDING, 
  HIGHLIGHTED_ENTITIES, 
  HIGHLIGHTED_ENTITY_STROKE, 
  HIGHLIGHTED_ENTITY_STROKE_WIDTH,
  HIGHLIGHTED_ENTITY_GRADIENT_END
} from './erd-layers-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_DIR = path.join(__dirname, './source/assets/images/erd');

function processSvgFile(filePath) {
  const svgContent = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
  const document = dom.window.document;
  const svg = document.querySelector('svg');

  if (!svg) {
    console.error(`Invalid SVG file: ${filePath}`);
    return;
  }

  // Remove existing layer boxes group if re-running
  const existingGroup = document.querySelector('#erd-layer-boxes');
  if (existingGroup) existingGroup.remove();

  const layersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  layersGroup.setAttribute('id', 'erd-layer-boxes');

  const padding = 20;
  const nodeElements = Array.from(document.querySelectorAll('g.node'));

  console.log(`[DEBUG] Found ${nodeElements.length} nodes in ${path.basename(filePath)}`);

  let maxLayerX = -Infinity;

  // Apply styling to highlighted entities using config array
  nodeElements.forEach(node => {
    const id = node.getAttribute('id') || '';
    const text = node.textContent || '';
    
    const isHighlighted = HIGHLIGHTED_ENTITIES.some(entity => id.includes(entity) || text.includes(entity));
    
    if (isHighlighted) {
      // 1. Ensure the highlight linear gradient exists in SVG <defs>
      let defs = document.querySelector('svg defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.insertBefore(defs, svg.firstChild);
      }

      const gradientId = 'my-svg-highlight-gradient';
      if (!document.getElementById(gradientId)) {
        const highlightGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        highlightGrad.setAttribute('id', gradientId);
        highlightGrad.setAttribute('gradientUnits', 'objectBoundingBox');
        highlightGrad.setAttribute('x1', '0%');
        highlightGrad.setAttribute('y1', '0%');
        highlightGrad.setAttribute('x2', '100%');
        highlightGrad.setAttribute('y2', '0%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', HIGHLIGHTED_ENTITY_STROKE);
        stop1.setAttribute('stop-opacity', '1');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', HIGHLIGHTED_ENTITY_GRADIENT_END);
        stop2.setAttribute('stop-opacity', '1');

        highlightGrad.appendChild(stop1);
        highlightGrad.appendChild(stop2);
        defs.appendChild(highlightGrad);
      }

      // 2. Thicken the entity border, apply the highlight gradient stroke, and match the drop shadow
      const shapes = node.querySelectorAll('rect, path.entityBox, rect.entityBox');
      shapes.forEach(shape => {
        const existingStyle = shape.getAttribute('style') || '';
        shape.setAttribute(
          'style',
          `${existingStyle}; stroke-width: ${HIGHLIGHTED_ENTITY_STROKE_WIDTH} !important; stroke: url(#${gradientId}) !important; filter: drop-shadow(1px 2px 2px rgba(185,185,185,1)) !important;`
        );
      });


      // 3. Bold and adjust long text labels cleanly inside foreignObjects without breaking alignment
      const foreignObjects = node.querySelectorAll('foreignObject');
      foreignObjects.forEach(fo => {
        const existingFoStyle = fo.getAttribute('style') || '';
        fo.setAttribute('style', `${existingFoStyle}; overflow: visible !important;`);

        const labelText = fo.textContent.trim();
        // Slightly shrink font-size and add letter-spacing for long names so they fit perfectly
        const isLong = labelText.length > 15;
        const customStyle = isLong 
          ? 'letter-spacing: -0.5px !important;' 
          : '';

        const innerElements = fo.querySelectorAll('div, span, p, label');
        innerElements.forEach(el => {
          const existingStyle = el.getAttribute('style') || '';
          el.setAttribute(
            'style',
            `${existingStyle}; font-weight: bold !important; white-space: nowrap !important; ${customStyle}`
          );
        });
      });

      // 4. Make standard SVG text elements bold (if any)
      const texts = node.querySelectorAll('text');
      texts.forEach(t => {
        t.setAttribute('font-weight', 'bold');
        const existingStyle = t.getAttribute('style') || '';
        t.setAttribute('style', `${existingStyle}; font-weight: bold !important;`);
      });
    }
  });

  LAYERS.forEach(layer => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let foundEntities = 0;

    layer.entities.forEach(entityName => {
      const node = nodeElements.find(el => {
        const id = el.getAttribute('id') || '';
        const text = el.textContent || '';
        return id.includes(entityName) || text.includes(entityName);
      });

      if (node) {
        let x = 0, y = 0;
        const transform = node.getAttribute('transform');
        if (transform) {
          const match = transform.match(/translate\(\s*([\d.-]+)[\s,]+([\d.-]+)\s*\)/);
          if (match) {
            x = parseFloat(match[1]);
            y = parseFloat(match[2]);
          }
        }

        const rect = node.querySelector('rect') || node.querySelector('foreignObject');
        let width = 160;
        let height = 60;

        if (rect) {
          const w = parseFloat(rect.getAttribute('width'));
          const h = parseFloat(rect.getAttribute('height'));
          if (!isNaN(w) && w > 0) width = w;
          if (!isNaN(h) && h > 0) height = h;
        }

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
        foundEntities++;
      }
    });

    if (foundEntities > 0) {
      const hasTopLabel = layer.labelPosition === 'top';
      const titleHeight = LABEL_FONT_SIZE + LABEL_PADDING;

      const boxX = minX - padding + (layer.offsetX || 0);
      const boxY = minY - padding - (hasTopLabel ? titleHeight : 0) + (layer.offsetY || 0);
      const boxWidth = (maxX - minX) + (padding * 2);
      const boxHeight = (maxY - minY) + (padding * 2) + titleHeight;

      maxLayerX = Math.max(maxLayerX, boxX + boxWidth);

      // Draw background rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', boxX);
      rect.setAttribute('y', boxY);
      rect.setAttribute('width', boxWidth);
      rect.setAttribute('height', boxHeight);
      rect.setAttribute('fill', layer.color);
      rect.setAttribute('stroke', layer.border);
      rect.setAttribute('stroke-width', '1.5');
      rect.setAttribute('stroke-dasharray', '5,5');
      rect.setAttribute('rx', '6');

      // Draw layer title text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', boxX + (boxWidth / 2));
      
      const labelYPos = hasTopLabel
        ? boxY + (titleHeight / 2) + (LABEL_FONT_SIZE / 3)
        : boxY + boxHeight - (titleHeight / 2) + (LABEL_FONT_SIZE / 3) - (LABEL_PADDING / 4);

      text.setAttribute('y', labelYPos);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', 'Arial, sans-serif');
      text.setAttribute('font-size', `${LABEL_FONT_SIZE}px`);
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#333333');
      text.textContent = layer.name;

      layersGroup.appendChild(rect);
      layersGroup.appendChild(text);
    }
  });

  // Prepend layer boxes group behind nodes
  svg.insertBefore(layersGroup, svg.firstChild);

  // Auto-adjust viewBox and width to fit rightmost content
  const viewBoxAttr = svg.getAttribute('viewBox');
  const canvasPaddingRight = 30;

  if (viewBoxAttr) {
    let [vX, vY, vWidth, vHeight] = viewBoxAttr.split(/[\s,]+/).map(Number);
    const requiredWidth = maxLayerX - vX + canvasPaddingRight;

    if (requiredWidth > vWidth) {
      vWidth = requiredWidth;
      svg.setAttribute('viewBox', `${vX} ${vY} ${vWidth} ${vHeight}`);

      const style = svg.getAttribute('style');
      if (style && style.includes('max-width')) {
        svg.setAttribute('style', style.replace(/max-width:\s*[\d.]+px/, `max-width: ${vWidth}px`));
      }
    }
  }

  fs.writeFileSync(filePath, dom.serialize());
  console.log(`Successfully added layer boxes and highlighted entities to: ${path.basename(filePath)}`);
}

const targetArg = process.argv[2];

if (targetArg) {
  const resolvedPath = path.resolve(targetArg);
  if (fs.existsSync(resolvedPath)) {
    processSvgFile(resolvedPath);
  } else {
    console.error(`File not found: ${targetArg}`);
  }
} else if (fs.existsSync(SVG_DIR)) {
  fs.readdirSync(SVG_DIR)
    .filter(file => file.endsWith('.svg'))
    .forEach(file => processSvgFile(path.join(SVG_DIR, file)));
} else {
  console.error(`SVG directory not found: ${SVG_DIR}`);
}