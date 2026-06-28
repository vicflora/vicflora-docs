---
extends: _layouts.vicflora
title: "Layer 8: Extension"
order: 11
---

## Layer 8a: Pathway key

<x-svg-viewer path="/assets/images/erd/layer-8a-pathway-key.svg" status="draft"/>

## Layer 8b: Trait

<x-svg-viewer path="/assets/images/erd/layer-8b-trait-1.svg" status="draft"/>

In this model, a **Trait Dataset** is a single matrix key, **Traits** are the
columns, **Items** the rows and **Facts** are the cells. **Traits**, **Items**
and **Facts** do not have to belong to a **Trait Dataset**. Optionally, a
**Trait** can be decomposed into a **Structure**, e.g., 'leaf', and
**Character**, e.g., 'two-dimensional shape'. This way, we can build trait
ontologies in the system, and through the **Trait Mappings** and **Trait State
Mappings**, which are in another diagram, we can hook up **Traits**—and thereby
**Facts**—from different datasets to these ontologies.

**Trait** data types can be `NUMERIC`, `CATEGORICAL` and `ORDINAL`. `NUMERIC`
**Traits** must have a `unit`; `CATEGORICAL` and `ORDINAL` **Traits** must have
at least two **Trait States**. When multiple states are present, they will be
recorded as individual states ('or') for `CATEGORICAL` traits and as a range
('to') for `ORDINAL` traits. The `state_ids` field of the **Facts** table is a
JSON field and allows for modifiers, e.g., 'rarely' or 'when dry', besides the
states' IDs. This has no effect on the keys, but is important if we want to
create natural-language descriptions from the trait data, or want to parse
natural-language descriptions into traits data. We probably do not want to be
religious about the `ORDINAL` vs `CATEGORICAL` notation in the facts, as we want
to be able to say things like 'lamina cells isodiametric to oblong, rarely
elongate to short-linear'.

### Trait rules

<x-svg-viewer path="/assets/images/erd/layer-8b-trait-2-trait-rules.svg" status="draft"/>

### Expression rules

<x-svg-viewer path="/assets/images/erd/layer-8b-trait-3-expression-rules.svg" status="draft"/>

### Trait mappings

<x-svg-viewer path="/assets/images/erd/layer-8b-trait-4-mapping.svg" status="draft"/>

### Map: Entity–Scope

<x-svg-viewer path="/assets/images/erd/map-entity-scope.svg" status="draft"/>

### Map: Entity–Structure

<x-svg-viewer path="/assets/images/erd/map-entity-structure.svg" status="draft"/>

## Layer 8c: Phylogeny

<x-svg-viewer path="/assets/images/erd/layer-8c-phylogeny.svg" status="draft"/>

## Layer 8d: Occurrence

<x-svg-viewer path="/assets/images/erd/layer-8d-occurrence.svg" status="draft"/>

### Map: Name match

<x-svg-viewer path="/assets/images/erd/map-name-match.svg" status="draft"/>

### Map: Profile–Occurrence

<x-svg-viewer path="/assets/images/erd/map-profile-occurrence.svg" status="draft"/>

## Layer 8e: Glossary

<x-svg-viewer path="/assets/images/erd/layer-8e-glossary.svg" status="draft"/>

