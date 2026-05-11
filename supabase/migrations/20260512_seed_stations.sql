-- Seed data for EV Charging Stations
-- Run this AFTER the main migration (20260512_init_all_tables.sql)

-- Clear existing data (optional - comment out if you want to keep existing data)
DELETE FROM public.stations WHERE id LIKE 'stn-%';

-- Insert seed stations
INSERT INTO public.stations (
  id, name, address, city, lat, lng, operator, charger_type, connector_types,
  total_slots, available_slots, price_per_kwh, status, reliability_score,
  last_verified, distance_km, amenities, wait_minutes, peak_hours, power_kw, active
) VALUES
('stn-del-001', 'ChargeGrid Connaught Place', 'Block N, Connaught Place, New Delhi', 'Delhi', 28.6315, 77.2167, 'ChargeGrid', 'Fast DC', ARRAY['CCS2', 'CHAdeMO'], 8, 3, 18, 'open', 96, '12 min ago', 2.8, ARRAY['Cafe', 'CCTV', '24x7', 'Washroom'], 8, '6 PM - 10 PM', 60, TRUE),
('stn-del-002', 'VoltWay Saket Select City', 'A-3 District Centre, Saket, New Delhi', 'Delhi', 28.5288, 77.2195, 'VoltWay', 'DC', ARRAY['CCS2', 'Type 2'], 6, 0, 21, 'busy', 88, '24 min ago', 9.4, ARRAY['Mall', 'Security', 'Parking'], 34, '4 PM - 9 PM', 50, TRUE),
('stn-gur-001', 'Ather Point Cyber Hub', 'Cyber Hub, DLF Cyber City, Gurugram', 'Gurugram', 28.4957, 77.0897, 'Ather Grid', 'AC', ARRAY['Type 2', 'Bharat AC001'], 10, 7, 13, 'open', 92, '7 min ago', 18.2, ARRAY['Food court', 'Covered', 'WiFi'], 0, '1 PM - 5 PM', 22, TRUE),
('stn-noi-001', 'Tata Power Sector 18', 'Near Atta Market, Sector 18, Noida', 'Noida', 28.5706, 77.3261, 'Tata Power EZ Charge', 'Fast DC', ARRAY['CCS2'], 5, 1, 19, 'open', 81, '1 hr ago', 12.1, ARRAY['Market', 'CCTV', 'Parking'], 16, '5 PM - 11 PM', 45, TRUE),
('stn-fbd-001', 'E-Fill Neelam Chowk', 'Neelam Bata Road, Faridabad', 'Faridabad', 28.3919, 77.3122, 'E-Fill Electric', 'AC', ARRAY['Type 2'], 4, 0, 12, 'maintenance', 64, '2 days ago', 27.6, ARRAY['Parking'], 0, 'Closed for service', 11, FALSE),
('stn-del-003', 'BluSmart Vasant Kunj Depot', 'Nelson Mandela Marg, Vasant Kunj, New Delhi', 'Delhi', 28.5245, 77.1587, 'BluSmart Charge', 'Fast DC', ARRAY['CCS2', 'GB/T'], 16, 9, 17, 'open', 98, '4 min ago', 13.8, ARRAY['Fleet bay', '24x7', 'CCTV', 'Lounge'], 0, '10 AM - 2 PM', 120, TRUE),
('stn-del-004', 'Statiq India Gate Hub', 'C-Hexagon, India Gate, New Delhi', 'Delhi', 28.6129, 77.2295, 'Statiq', 'DC', ARRAY['CCS2', 'Type 2'], 7, 4, 20, 'open', 90, '18 min ago', 4.2, ARRAY['Tourist zone', 'CCTV', 'Food kiosk'], 6, '7 PM - 11 PM', 60, TRUE),
('stn-gzb-001', 'Jio-bp Indirapuram Mall', 'Ahinsa Khand, Indirapuram, Ghaziabad', 'Ghaziabad', 28.6368, 77.3697, 'Jio-bp Pulse', 'Fast DC', ARRAY['CCS2'], 12, 5, 22, 'open', 94, '9 min ago', 19.7, ARRAY['Mall', 'Cafe', 'Washroom', 'Covered'], 11, '3 PM - 9 PM', 90, TRUE),
('stn-gur-002', 'Shell Recharge Golf Course Road', 'Sector 54, Golf Course Road, Gurugram', 'Gurugram', 28.4487, 77.0999, 'Shell Recharge', 'Fast DC', ARRAY['CCS2', 'CHAdeMO', 'Type 2'], 6, 2, 24, 'open', 91, '32 min ago', 22.4, ARRAY['Fuel station', 'Cafe', 'Air', 'CCTV'], 20, '8 AM - 11 AM', 150, TRUE),
('stn-noi-002', 'EESL Botanical Garden Metro', 'Botanical Garden Metro Parking, Noida', 'Noida', 28.5642, 77.3342, 'EESL', 'AC', ARRAY['Bharat AC001', 'Type 2'], 9, 6, 11, 'open', 83, '45 min ago', 13.6, ARRAY['Metro', 'Parking', 'Security'], 0, '9 AM - 12 PM', 15, TRUE),
('stn-del-005', 'BSES Rajouri Garden Plaza', 'Najafgarh Road, Rajouri Garden, New Delhi', 'Delhi', 28.6422, 77.1164, 'BSES EV', 'DC', ARRAY['CCS2'], 5, 0, 16, 'busy', 79, '2 hr ago', 11.8, ARRAY['Market', 'Parking'], 42, '6 PM - 10 PM', 30, TRUE);

-- Insert chargers for some stations
INSERT INTO public.chargers (station_id, type, connector, status, power_kw) 
SELECT id, 'Fast DC', 'CCS2', 'available', 60 FROM public.stations WHERE id = 'stn-del-001' LIMIT 3;

INSERT INTO public.chargers (station_id, type, connector, status, power_kw) 
SELECT id, 'AC', 'Type 2', 'available', 22 FROM public.stations WHERE id = 'stn-gur-001' LIMIT 3;

-- Optional: Add a test user profile (if you want to manually insert one)
-- INSERT INTO public.profiles (id, name, email, vehicle_model, preferred_connector, coins, vehicle_range_km)
-- VALUES (gen_random_uuid(), 'Test User', 'test@example.com', 'Tata Nexon EV', 'CCS2', 250, 220);
