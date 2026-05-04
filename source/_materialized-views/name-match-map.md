```sql
-- View: mapper.name_match_map

-- DROP MATERIALIZED VIEW IF EXISTS mapper.name_match_map;

CREATE MATERIALIZED VIEW IF NOT EXISTS mapper.name_match_map
TABLESPACE pg_default
AS
 SELECT row_number() OVER ()::integer AS id,
    t.scientific_name_id AS taxon_name_id,
    t.id AS taxon_concept_id,
    pn.id AS parsed_name_id,
        CASE
            WHEN t.scientific_name::text = pn.scientific_name::text THEN 'EXACT'::text
            WHEN t.scientific_name::text = pn.canonical_name_complete::text THEN 'EXACT'::text
            WHEN t.scientific_name::text = pn.canonical_name_with_marker::text THEN 'CANONICAL'::text
            ELSE NULL::text
        END AS match_type
   FROM mapper.taxa t
     JOIN parsed_names pn ON t.scientific_name::text = pn.scientific_name::text OR t.scientific_name::text = pn.canonical_name_complete::text OR t.scientific_name::text = pn.canonical_name_with_marker::text
WITH DATA;

ALTER TABLE IF EXISTS mapper.name_match_map
    OWNER TO vicflora;


CREATE INDEX name_match_concept_idx
    ON mapper.name_match_map USING btree
    (taxon_concept_id)
    TABLESPACE pg_default;
CREATE INDEX name_match_parsed_idx
    ON mapper.name_match_map USING btree
    (parsed_name_id)
    TABLESPACE pg_default;
CREATE INDEX name_match_taxon_name_idx
    ON mapper.name_match_map USING btree
    (taxon_name_id)
    TABLESPACE pg_default;
CREATE UNIQUE INDEX name_match_unique_idx
    ON mapper.name_match_map USING btree
    (taxon_name_id, parsed_name_id)
    TABLESPACE pg_default;
```