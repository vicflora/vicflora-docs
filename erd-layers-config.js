// Global layer label styles
export const LABEL_FONT_SIZE = 20;
export const LABEL_PADDING = 20;

// Configuration for ERD layer boxes
export const LAYERS = [
  {
    name: 'Semantics',
    color: '#e2f0d9',
    border: '#70ad47',
    entities: ['TaxonConcept', 'TaxonConceptMapping'],
    labelPosition: 'top', // 'top' or 'bottom'
    offsetX: -102,         // Shift box left/right
    offsetY: -30          // Shift box up/down
  },
  {
    name: 'Authority',
    color: '#deebf7',
    border: '#5b9bd5',
    entities: ['Treatment_EXT', 'Reference'],
    labelPosition: 'bottom',
    offsetX: -82,
    offsetY: -30
  },
  {
    name: 'Syntax',
    color: '#fce4d6',
    border: '#ed7d31',
    entities: ['ScientificName_EXT', 'VernacularName_EXT', 'TaxonName', 'NomenclaturalType'],
    labelPosition: 'bottom',
    offsetX: -95,
    offsetY: -30
  },
  {
    name: 'Governance',
    color: '#edd9f2',
    border: '#7030a0',
    entities: ['TaxonTreeNode', 'TaxonTree'],
    labelPosition: 'bottom',
    offsetX: -90,
    offsetY: -30
  },
  {
    name: 'Narrative',
    color: '#e6f4ea',
    border: '#34a853',
    entities: ['Profile', 'ProfileSection'],
    labelPosition: 'bottom',
    offsetX: -80,
    offsetY: -30
  }
];

export const HIGHLIGHTED_ENTITIES = [
  'TaxonConcept',
  'TaxonConceptMapping',
  'TaxonName',
  'NomenclaturalType'
];

export const HIGHLIGHTED_ENTITY_STROKE = '#e74b0f';
export const HIGHLIGHTED_ENTITY_STROKE_WIDTH = '2px';
export const HIGHLIGHTED_ENTITY_GRADIENT_END = '#d06622';