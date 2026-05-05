-- Create the refund_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS refund_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    rip text NOT NULL,
    status text DEFAULT 'undone' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add comment to the table
COMMENT ON TABLE refund_requests IS 'Table for storing refund requests from users';

-- Enable Row Level Security on the table
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts when re-running)
DROP POLICY IF EXISTS "Allow anonymous read access" ON refund_requests;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON refund_requests;
DROP POLICY IF EXISTS "Allow anonymous update access" ON refund_requests;

-- Create policy to allow anyone to read (SELECT) from the table
CREATE POLICY "Allow anonymous read access" ON refund_requests
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Create policy to allow anyone to insert new records
CREATE POLICY "Allow anonymous insert access" ON refund_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create policy to allow anyone to update records (for marking as done)
CREATE POLICY "Allow anonymous update access" ON refund_requests
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_refund_requests_email ON refund_requests(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at DESC);
