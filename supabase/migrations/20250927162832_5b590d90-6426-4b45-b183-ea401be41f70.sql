-- Add utility cost fields to the listings table
ALTER TABLE public.listings 
ADD COLUMN electricity_cost_eur integer,
ADD COLUMN gas_cost_eur integer, 
ADD COLUMN water_cost_eur integer,
ADD COLUMN internet_cost_eur integer,
ADD COLUMN electricity_included boolean DEFAULT true,
ADD COLUMN gas_included boolean DEFAULT true,
ADD COLUMN water_included boolean DEFAULT true,
ADD COLUMN internet_included boolean DEFAULT true;