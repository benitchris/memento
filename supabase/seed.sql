-- ====================================================================
-- MEMENTO — RWANDA DEMONSTRATION SEED DATA
-- Clearly labelled demonstration data for testing the marketplace
-- ====================================================================

-- 1. DESTINATIONS
INSERT INTO public.destinations (id, name, province, description, image_url, is_popular, display_order)
VALUES
    ('d1111111-1111-1111-1111-111111111101', 'Kigali', 'Kigali City', 'The vibrant, clean capital of Rwanda with rolling hills, art galleries, and thriving dining scene.', 'https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?auto=format&fit=crop&w=1200&q=80', true, 1),
    ('d1111111-1111-1111-1111-111111111102', 'Musanze', 'Northern Province', 'Gateway to Volcanoes National Park, mountain gorillas, and scenic volcanic peaks.', 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80', true, 2),
    ('d1111111-1111-1111-1111-111111111103', 'Rubavu (Gisenyi)', 'Western Province', 'Lakeside resort city along sandy Lake Kivu beaches with water sports and scenic views.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', true, 3),
    ('d1111111-1111-1111-1111-111111111104', 'Karongi (Kibuye)', 'Western Province', 'Tranquil emerald archipelago hills on Lake Kivu, peaceful boat excursions and birdwatching.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', true, 4),
    ('d1111111-1111-1111-1111-111111111105', 'Huye (Butare)', 'Southern Province', 'The cultural and intellectual heart of Rwanda, home to the Ethnographic Museum and historic arboretum.', 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80', false, 5),
    ('d1111111-1111-1111-1111-111111111106', 'Rwamagana', 'Eastern Province', 'Gateway to Lake Muhazi, quiet country escapes, and agro-tourism trails.', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', false, 6),
    ('d1111111-1111-1111-1111-111111111107', 'Nyagatare', 'Eastern Province', 'Open savannah landscapes bordering Akagera National Park wildlife safaris.', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80', false, 7),
    ('d1111111-1111-1111-1111-111111111108', 'Rusizi (Cyangugu)', 'Western Province', 'Southern edge of Lake Kivu bordering Nyungwe Rainforest canopy walks and chimpanzee tracking.', 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80', false, 8),
    ('d1111111-1111-1111-1111-111111111109', 'Nyanza', 'Southern Province', 'Historical seat of the Rwandan Monarchy, featuring the reconstructed King’s Palace and Royal Inyambo cattle.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', false, 9)
ON CONFLICT (name) DO NOTHING;

-- 2. AMENITIES
INSERT INTO public.amenities (id, name, category, icon)
VALUES
    ('a1111111-1111-1111-1111-111111111101', 'High-Speed Wi-Fi', 'essentials', 'Wifi'),
    ('a1111111-1111-1111-1111-111111111102', 'Swimming Pool', 'features', 'Waves'),
    ('a1111111-1111-1111-1111-111111111103', 'Fully Equipped Kitchen', 'essentials', 'Utensils'),
    ('a1111111-1111-1111-1111-111111111104', 'Free Secure Parking', 'features', 'Car'),
    ('a1111111-1111-1111-1111-111111111105', 'Breakfast Included', 'hospitality', 'Coffee'),
    ('a1111111-1111-1111-1111-111111111106', 'Lake / Water View', 'location', 'Sun'),
    ('a1111111-1111-1111-1111-111111111107', 'Air Conditioning', 'essentials', 'Wind'),
    ('a1111111-1111-1111-1111-111111111108', 'Dedicated Workspace', 'essentials', 'Briefcase'),
    ('a1111111-1111-1111-1111-111111111109', 'Generator Backup Power', 'safety', 'Zap'),
    ('a1111111-1111-1111-1111-111111111110', 'Mountain Volcano View', 'location', 'Compass'),
    ('a1111111-1111-1111-1111-111111111111', 'Pet Friendly', 'features', 'Heart'),
    ('a1111111-1111-1111-1111-111111111112', 'Wheelchair Accessible', 'safety', 'ShieldCheck')
ON CONFLICT (name) DO NOTHING;

