```sql
-- View: mapper.taxon_concept_occurrence_map

-- DROP MATERIALIZED VIEW IF EXISTS mapper.taxon_concept_occurrence_map;

CREATE MATERIALIZED VIEW IF NOT EXISTS mapper.taxon_concept_occurrence_map
TABLESPACE pg_default
AS
 WITH occurrence_pivot AS (
         SELECT t_1.taxon_concept_id,
            t_1.taxon_tree_id,
            o_1.id AS occurrence_id
           FROM mapper.taxa t_1
             JOIN mapper.name_match_map nmm ON t_1.scientific_name_id = nmm.taxon_name_id
             JOIN mapper.occurrences o_1 ON nmm.parsed_name_id = o_1.parsed_name_id
        UNION
         SELECT t_1.species_id AS taxon_concept_id,
            t_1.taxon_tree_id,
            o_1.id AS occurrence_id
           FROM mapper.taxa t_1
             JOIN mapper.taxa ts ON t_1.species_id = ts.taxon_concept_id AND t_1.taxon_tree_id = ts.taxon_tree_id
             JOIN mapper.name_match_map nmm ON t_1.scientific_name_id = nmm.taxon_name_id
             JOIN mapper.occurrences o_1 ON nmm.parsed_name_id = o_1.parsed_name_id
          WHERE t_1.species_id IS NOT NULL
        )
 SELECT row_number() OVER ()::integer AS id,
    pivot.taxon_concept_id,
    pivot.taxon_tree_id,
    pivot.occurrence_id,
    COALESCE(aocc.asserted_value, t.occurrence_status, 'present'::character varying) AS occurrence_status,
    COALESCE(
        CASE
            WHEN adeg.asserted_value IS NOT NULL THEN 'introduced'::character varying
            ELSE aest.asserted_value
        END,
        CASE
            WHEN o.establishment_means::text = ANY (ARRAY['cultivated'::character varying, 'naturalised'::character varying]::text[]) THEN 'introduced'::character varying
            ELSE o.establishment_means
        END, t.establishment_means::text::character varying, 'native'::character varying) AS establishment_means,
    COALESCE(adeg.asserted_value,
        CASE
            WHEN o.establishment_means::text = 'cultivated'::text THEN 'cultivated'::character varying
            WHEN o.establishment_means::text = 'naturalised'::text THEN 'naturalised'::character varying
            WHEN o.degree_of_establishment::text = ''::text AND o.establishment_means::text = 'uncertain'::text THEN 'uncertain'::character varying
            WHEN o.degree_of_establishment::text = ''::text AND o.establishment_means::text = 'introduced'::text THEN 'naturalised'::character varying
            WHEN o.degree_of_establishment::text = 'established'::text THEN 'naturalised'::character varying
            WHEN o.establishment_means::text = 'native'::text THEN 'native'::character varying
            ELSE o.degree_of_establishment
        END, t.degree_of_establishment, 'native'::character varying) AS degree_of_establishment
   FROM occurrence_pivot pivot
     JOIN mapper.occurrences o ON pivot.occurrence_id = o.id
     JOIN mapper.taxa t ON pivot.taxon_concept_id = t.taxon_concept_id AND pivot.taxon_tree_id = t.taxon_tree_id
     LEFT JOIN assertions aocc ON o.id = aocc.occurrence_id AND aocc.term::text = 'occurrenceStatus'::text
     LEFT JOIN assertions aest ON o.id = aest.occurrence_id AND aest.term::text = 'establishmentMeans'::text
     LEFT JOIN assertions adeg ON o.id = adeg.occurrence_id AND adeg.term::text = 'degreeOfEstablishment'::text
WITH DATA;

ALTER TABLE IF EXISTS mapper.taxon_concept_occurrence_map
    OWNER TO vicflora;


CREATE UNIQUE INDEX taxon_occurrence_composite_unique_idx
    ON mapper.taxon_concept_occurrence_map USING btree
    (taxon_concept_id, occurrence_id)
    TABLESPACE pg_default;
CREATE INDEX taxon_occurrence_id_idx
    ON mapper.taxon_concept_occurrence_map USING btree
    (id)
    TABLESPACE pg_default;
CREATE INDEX taxon_occurrence_taxon_idx
    ON mapper.taxon_concept_occurrence_map USING btree
    (taxon_concept_id)
    TABLESPACE pg_default;
```