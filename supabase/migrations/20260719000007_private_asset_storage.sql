-- Keep asset files private. The Portal receives short-lived signed URLs only
-- for files belonging to published assets, while administrators can access
-- files through the Storage RLS policy.

update storage.buckets
set public = false
where id = 'design-system-assets';

drop policy if exists "Published assets can be viewed" on storage.objects;

create policy "Published assets can be viewed" on storage.objects for select using (
  bucket_id = 'design-system-assets'
  and (
    public.is_administrator()
    or exists (
      select 1
      from public.assets
      where public.assets.file_path = storage.objects.name
        and public.assets.status = 'published'
    )
  )
);
