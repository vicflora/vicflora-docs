```sql
-- View: mapper.taxon_concept_map_overlay_map

-- DROP MATERIALIZED VIEW IF EXISTS mapper.taxon_concept_map_overlay_map;

CREATE MATERIALIZED VIEW IF NOT EXISTS mapper.taxon_concept_map_overlay_map
TABLESPACE pg_default
AS
 SELECT row_number() OVER ()::integer AS id,
    tco.taxon_concept_id,
    tco.taxon_tree_id,
    mo.layer,
    mo.id AS map_overlay_id,
    mo.area_name,
    (array_agg(tco.occurrence_status ORDER BY (
        CASE tco.occurrence_status
            WHEN 'endemic'::text THEN 1
            WHEN 'present'::text THEN 2
            WHEN 'extinct'::text THEN 3
            WHEN 'doubtful'::text THEN 4
            ELSE 5
        END)))[1] AS occurrence_status,
    (array_agg(tco.establishment_means ORDER BY (
        CASE tco.establishment_means
            WHEN 'native'::text THEN 1
            WHEN 'naturalised'::text THEN 2
            WHEN 'introduced'::text THEN 3
            WHEN 'cultivated'::text THEN 4
            ELSE 5
        END)))[1] AS establishment_means,
    (array_agg(tco.degree_of_establishment ORDER BY (
        CASE tco.degree_of_establishment
            WHEN 'native'::text THEN 1
            WHEN 'invasive'::text THEN 2
            WHEN 'established'::text THEN 3
            WHEN 'reproducing'::text THEN 4
            WHEN 'casual'::text THEN 5
            ELSE 6
        END)))[1] AS degree_of_establishment
   FROM mapper.taxon_concept_occurrence_map tco
     JOIN mapper.occurrences o ON tco.occurrence_id = o.id
     JOIN mapper.map_overlays mo ON mo.layer::text = 'bioregion'::text AND o.bioregion::text = mo.area_name::text OR mo.layer::text = 'lga'::text AND o.lga2023::text = mo.area_name::text OR mo.layer::text = 'park_res'::text AND o.park_res::text = mo.area_name::text
  GROUP BY tco.taxon_concept_id, tco.taxon_tree_id, mo.layer, mo.id, mo.area_name
WITH DATA;

ALTER TABLE IF EXISTS mapper.taxon_concept_map_overlay_map
    OWNER TO vicflora;


CREATE INDEX tc_map_overlay_layer_idx
    ON mapper.taxon_concept_map_overlay_map USING btree
    (layer COLLATE pg_catalog."default")
    TABLESPACE pg_default;
CREATE INDEX tc_map_overlay_taxon_idx
    ON mapper.taxon_concept_map_overlay_map USING btree
    (taxon_concept_id)
    TABLESPACE pg_default;
CREATE INDEX tc_map_overlay_tree_idx
    ON mapper.taxon_concept_map_overlay_map USING btree
    (taxon_tree_id)
    TABLESPACE pg_default;
CREATE UNIQUE INDEX tc_map_overlay_unique_idx
    ON mapper.taxon_concept_map_overlay_map USING btree
    (taxon_concept_id, map_overlay_id)
    TABLESPACE pg_default;
```