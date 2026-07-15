create function public.list_weekly_ranking()
returns table (
  rank bigint,
  stamp_count bigint,
  is_current_user boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_week_start timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  v_week_start := pg_catalog.timezone(
    'Asia/Seoul',
    pg_catalog.date_trunc(
      'week',
      pg_catalog.timezone(
        'Asia/Seoul',
        pg_catalog.transaction_timestamp()
      )
    )
  );

  return query
  with weekly_counts as (
    select
      collected.user_id,
      pg_catalog.count(*) as stamp_count
    from public.collected_stamps as collected
    where collected.collected_at >= v_week_start
      and collected.collected_at < v_week_start + interval '7 days'
    group by collected.user_id
  ), ranked as (
    select
      weekly.user_id,
      weekly.stamp_count,
      pg_catalog.rank() over (
        order by weekly.stamp_count desc
      ) as rank
    from weekly_counts as weekly
  )
  select
    ranked.rank,
    ranked.stamp_count,
    ranked.user_id = v_user_id
  from ranked
  order by ranked.stamp_count desc, ranked.user_id
  limit 3;
end;
$$;

revoke execute on function public.list_weekly_ranking() from public, anon;
grant execute on function public.list_weekly_ranking() to authenticated;
