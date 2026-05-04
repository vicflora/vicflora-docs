```sql
-- View: public.search_mv

-- DROP MATERIALIZED VIEW IF EXISTS public.search_mv;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.search_mv
TABLESPACE pg_default
AS
 WITH RECURSIVE classification AS (
         SELECT ttn.taxon_concept_id,
            ttn.parent_id,
            ttn.taxon_tree_id,
            tn_1.name_string,
            r.label AS taxon_rank,
            ttdi.rank_order,
            jsonb_build_object(lower(r.label::text), tn_1.name_string) AS lineage,
            ttn.start_date,
            ttn.end_date
           FROM taxon_tree_nodes ttn
             JOIN taxon_concepts tc_1 ON ttn.taxon_concept_id = tc_1.id
             JOIN taxon_names tn_1 ON tc_1.taxon_name_id = tn_1.id
             JOIN taxon_tree_def_items ttdi ON ttn.taxon_tree_def_item_id = ttdi.id
             JOIN controlled_terms r ON ttdi.rank_id = r.id
             LEFT JOIN taxon_tree_revisions ttr ON ttn.taxon_concept_id = ttr.from_node_id
          WHERE ttn.parent_id IS NULL
        UNION ALL
         SELECT ttn.taxon_concept_id,
            ttn.parent_id,
            ttn.taxon_tree_id,
            tn_1.name_string,
            r.label AS taxon_rank,
            ttdi.rank_order,
            cl_1.lineage || jsonb_build_object(lower(r.label::text), tn_1.name_string),
            ttn.start_date,
            ttn.end_date
           FROM taxon_tree_nodes ttn
             JOIN taxon_concepts tc_1 ON ttn.taxon_concept_id = tc_1.id
             JOIN taxon_names tn_1 ON tc_1.taxon_name_id = tn_1.id
             JOIN taxon_tree_def_items ttdi ON ttn.taxon_tree_def_item_id = ttdi.id
             JOIN controlled_terms r ON ttdi.rank_id = r.id
             LEFT JOIN taxon_tree_revisions ttr ON ttn.taxon_concept_id = ttr.from_node_id
             JOIN classification cl_1 ON ttn.parent_id = cl_1.taxon_concept_id
        )
 SELECT tc.guid AS id,
    tc.guid AS taxon_concept_id,
    tn.guid AS taxon_name_id,
    tn.name_string AS scientific_name,
        CASE
            WHEN cl.rank_order >= 220 THEN split_part(cl.lineage ->> 'species'::text, ' '::text, 2)
            ELSE NULL::text
        END AS specific_epithet,
        CASE
            WHEN cl.rank_order > 220 THEN regexp_replace(tn.name_string::text, '^.* '::text, ''::text)
            ELSE NULL::text
        END AS infraspecific_epithet,
        CASE
            WHEN cl.end_date IS NOT NULL AND cl.end_date <= CURRENT_DATE THEN 'historical'::text
            ELSE 'current'::text
        END AS status,
    cl.lineage ->> 'kingdom'::text AS kingdom,
    cl.lineage ->> 'phylum'::text AS phylum,
    cl.lineage ->> 'class'::text AS class,
    cl.lineage ->> 'order'::text AS "order",
    cl.lineage ->> 'family'::text AS family,
    cl.lineage ->> 'genus'::text AS genus,
    cl.lineage ->> 'species'::text AS species,
    cl.taxon_rank AS rank,
    ( SELECT jsonb_agg(jsonb_build_object('mapping_relation', mr.code, 'object_taxon_concept_id', tc_obj.guid, 'object_taxon_name', tn_obj.name_string, 'is_direct_replacement', true)) AS jsonb_agg
           FROM taxon_concept_mappings tcm
             JOIN taxon_concepts tc_obj ON tcm.object_taxon_concept_id = tc_obj.id
             JOIN taxon_names tn_obj ON tc_obj.taxon_name_id = tn_obj.id
             JOIN controlled_terms mr ON tcm.mapping_relation_id = mr.id
             JOIN classification cl_obj ON tc_obj.id = cl_obj.taxon_concept_id
          WHERE tcm.subject_taxon_concept_id = tc.id AND cl.end_date IS NOT NULL AND cl_obj.end_date IS NULL) AS mappings,
    cl.start_date,
    cl.end_date,
    ref.full_reference_string AS according_to
   FROM taxon_concepts tc
     JOIN taxon_names tn ON tc.taxon_name_id = tn.id
     JOIN "references" ref ON tc.according_to_id = ref.id
     JOIN classification cl ON tc.id = cl.taxon_concept_id
WITH DATA;

ALTER TABLE IF EXISTS public.search_mv
    OWNER TO vicflora;


CREATE INDEX search_mv_family_idx
    ON public.search_mv USING btree
    (family COLLATE pg_catalog."default")
    TABLESPACE pg_default;
CREATE INDEX search_mv_scientific_name_idx
    ON public.search_mv USING btree
    (scientific_name COLLATE pg_catalog."default")
    TABLESPACE pg_default;
CREATE INDEX search_mv_status_idx
    ON public.search_mv USING btree
    (status COLLATE pg_catalog."default")
    TABLESPACE pg_default;
CREATE UNIQUE INDEX search_mv_unique_id_idx
    ON public.search_mv USING btree
    (id)
    TABLESPACE pg_default;
```