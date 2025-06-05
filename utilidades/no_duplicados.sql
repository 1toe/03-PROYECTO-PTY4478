SELECT DISTINCT ON (p.ean) 
    p.*,
    b.name AS brand_name,
    c.name AS category_name,
    c.slug AS category_slug,
    pp.price_current,
    pp.price