with new_app as (
  insert into public.apps (name, slug, description, is_published, is_new_update, version, size_label, logo_url)
  values (
    'Catatan Ringkas',
    'catatan-ringkas',
    'Aplikasi pencatat sederhana untuk menyimpan ide, checklist, dan catatan harian Anda. Ringan, cepat, tanpa iklan.',
    true,
    false,
    '1.2.0',
    '18 MB',
    'https://placehold.co/200x200/1a4d3e/f5f0e6?text=CR'
  )
  returning id
),
new_buttons as (
  insert into public.download_buttons (app_id, label, url, sort_order)
  select id, label, url, sort_order
  from new_app,
  (values
    ('Google Drive', 'https://example.com/downloads/catatan-ringkas.zip', 0),
    ('Mirror (Mediafire)', 'https://example.com/downloads/catatan-ringkas-mirror.zip', 1)
  ) as buttons(label, url, sort_order)
  returning id
),
new_screenshots as (
  insert into public.app_screenshots (app_id, image_url, sort_order)
  select id, image_url, sort_order
  from new_app,
  (values
    ('https://placehold.co/375x780/1a4d3e/f5f0e6?text=Screenshot+1', 0),
    ('https://placehold.co/375x780/2d6a4f/f5f0e6?text=Screenshot+2', 1),
    ('https://placehold.co/375x780/40916c/f5f0e6?text=Screenshot+3', 2)
  ) as shots(image_url, sort_order)
  returning id
)
select
  (select id from new_app) as app_id,
  (select count(*) from new_buttons) as buttons_created,
  (select count(*) from new_screenshots) as screenshots_created;