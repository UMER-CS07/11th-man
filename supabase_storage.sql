-- Create a strictly PRIVATE bucket for user uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cricket-assets', 'cricket-assets', false);

-- Storage RLS Policy 1: Authenticated users can upload files
CREATE POLICY "Users can upload media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'cricket-assets');

-- Storage RLS Policy 2: Authenticated users can view/download media
CREATE POLICY "Users can view media" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'cricket-assets');
