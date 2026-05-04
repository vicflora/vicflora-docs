```sql
-- View: mapper.taxon_concept_phenology_map

-- DROP MATERIALIZED VIEW IF EXISTS mapper.taxon_concept_phenology_map;

CREATE MATERIALIZED VIEW IF NOT EXISTS mapper.taxon_concept_phenology_map
TABLESPACE pg_default
AS
 WITH monthly_extractions AS (
         SELECT t.taxon_concept_id,
            t.scientific_name,
            SUBSTRING(o.event_date FROM 6 FOR 2) AS month_str,
            o.buds,
            o.flowers,
            o.fruit
           FROM mapper.taxa t
             JOIN mapper.taxon_concept_occurrence_map tco ON t.taxon_concept_id = tco.taxon_concept_id
             JOIN mapper.occurrences o ON tco.occurrence_id = o.id
          WHERE o.event_date::text ~ '^\d{4}-\d{2}'::text
        )
 SELECT row_number() OVER (ORDER BY taxon_concept_id, month_str)::integer AS id,
    taxon_concept_id,
    month_str::integer AS month_numerical,
    to_char(to_date(month_str, 'MM'::text)::timestamp with time zone, 'Month'::text) AS month,
    count(*) AS total,
    count(buds) FILTER (WHERE buds IS NOT NULL) AS buds,
    count(flowers) FILTER (WHERE flowers IS NOT NULL) AS flowers,
    count(fruit) FILTER (WHERE fruit IS NOT NULL) AS fruit
   FROM monthly_extractions
  GROUP BY taxon_concept_id, scientific_name, month_str
  ORDER BY scientific_name, (month_str::integer)
WITH DATA;

ALTER TABLE IF EXISTS mapper.taxon_concept_phenology_map
    OWNER TO vicflora;


CREATE INDEX phenology_id_idx
    ON mapper.taxon_concept_phenology_map USING btree
    (id)
    TABLESPACE pg_default;
CREATE UNIQUE INDEX phenology_taxon_month_unique_idx
    ON mapper.taxon_concept_phenology_map USING btree
    (taxon_concept_id, month_numerical)
    TABLESPACE pg_default;
```