```sql
-- View: mapper.taxa

-- DROP MATERIALIZED VIEW IF EXISTS mapper.taxa;

CREATE MATERIALIZED VIEW IF NOT EXISTS mapper.taxa
TABLESPACE pg_default
AS
 WITH RECURSIVE classification AS (
         SELECT ttn.taxon_concept_id,
            ttn.parent_id,
            ttn.taxon_tree_id,
            tn_1.name_string,
            r.label AS taxon_rank,
                CASE
                    WHEN lower(r.label::text) = 'species'::text THEN tc_1.guid
                    ELSE NULL::uuid
                END AS species_guid,
                CASE
                    WHEN lower(r.label::text) = 'species'::text THEN tn_1.name_string
                    ELSE NULL::character varying
                END AS species_name,
            ttn.start_date,
            ttn.end_date
           FROM taxon_tree_nodes ttn
             JOIN taxon_tree_def_items ttdi ON ttn.taxon_tree_def_item_id = ttdi.id
             JOIN controlled_terms r ON ttdi.rank_id = r.id
             JOIN taxon_concepts tc_1 ON ttn.taxon_concept_id = tc_1.id
             JOIN taxon_names tn_1 ON tc_1.taxon_name_id = tn_1.id
          WHERE ttn.parent_id IS NULL AND ttn.end_date IS NULL
        UNION ALL
         SELECT ttn.taxon_concept_id,
            ttn.parent_id,
            ttn.taxon_tree_id,
            tn_1.name_string,
            r.label AS taxon_rank,
            COALESCE(cl_1.species_guid,
                CASE
                    WHEN lower(r.label::text) = 'species'::text THEN tc_1.guid
                    ELSE NULL::uuid
                END) AS species_guid,
            COALESCE(cl_1.species_name,
                CASE
                    WHEN lower(r.label::text) = 'species'::text THEN tn_1.name_string
                    ELSE NULL::character varying
                END) AS species_name,
            ttn.start_date,
            ttn.end_date
           FROM taxon_tree_nodes ttn
             JOIN taxon_tree_def_items ttdi ON ttn.taxon_tree_def_item_id = ttdi.id
             JOIN controlled_terms r ON ttdi.rank_id = r.id
             JOIN taxon_concepts tc_1 ON ttn.taxon_concept_id = tc_1.id
             JOIN taxon_names tn_1 ON tc_1.taxon_name_id = tn_1.id
             JOIN classification cl_1 ON ttn.parent_id = cl_1.taxon_concept_id
          WHERE ttn.end_date IS NULL
        )
 SELECT snum.id,
    tt.guid AS taxon_tree_id,
    tc.guid AS taxon_concept_id,
    tn.guid AS scientific_name_id,
    tn.name_string AS scientific_name,
    sne.authorship,
    cl.taxon_rank,
    nur.code AS taxonomic_status,
    tc.guid AS accepted_name_usage_id,
    an.name_string AS accepted_name,
    cl.species_guid AS species_id,
    cl.species_name,
    occ.label AS occurrence_status,
    est.label AS establishment_means,
    deg.label AS degree_of_establishment
   FROM classification cl
     JOIN taxon_concepts tc ON cl.taxon_concept_id = tc.id
     JOIN scientific_name_usages_map snum ON tc.id = snum.taxon_concept_id
     JOIN controlled_terms nur ON snum.name_usage_role_id = nur.id
     JOIN taxon_names tn ON snum.taxon_name_id = tn.id
     JOIN scientific_names_ext sne ON tn.id = sne.id
     JOIN taxon_names an ON tc.taxon_name_id = an.id
     JOIN taxon_trees tt ON cl.taxon_tree_id = tt.id
     JOIN taxon_tree_geographic_scope_map scope ON tt.id = scope.taxon_tree_id
     JOIN area_codes ac ON scope.scope::text = ac.code::text AND scope.gazetteer_id = ac.gazetteer_id
     JOIN profile_area_map pam ON tc.id = pam.profile_id AND ac.id = pam.area_code_id
     LEFT JOIN controlled_terms occ ON pam.occurrence_status_id = occ.id
     LEFT JOIN controlled_terms est ON pam.establishment_means_id = est.id
     LEFT JOIN controlled_terms deg ON pam.degree_of_establishment_id = deg.id
  WHERE cl.end_date IS NULL
WITH DATA;

ALTER TABLE IF EXISTS mapper.taxa
    OWNER TO vicflora;


CREATE INDEX taxa_accepted_id_idx
    ON mapper.taxa USING btree
    (accepted_name_usage_id)
    TABLESPACE pg_default;
CREATE UNIQUE INDEX taxa_id_idx
    ON mapper.taxa USING btree
    (id)
    TABLESPACE pg_default;
CREATE INDEX taxa_sci_name_idx
    ON mapper.taxa USING btree
    (scientific_name COLLATE pg_catalog."default")
    TABLESPACE pg_default;
```