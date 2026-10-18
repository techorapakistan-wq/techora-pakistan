-- Publicly expose only aggregate product activity; no visitor IDs or order/customer data.
create or replace view public.product_social_proof
with (security_invoker = false)
as
select
  product.id::text as product_id,
  product.name as product_name,
  coalesce(views.unique_visitors_30d, 0)::bigint as unique_visitors_30d,
  coalesce(sales.units_sold_30d, 0)::bigint as units_sold_30d
from public.products as product
left join (
  select
    product_id,
    count(distinct session_id)::bigint as unique_visitors_30d
  from public.site_analytics
  where event_type = 'product_view'
    and created_at >= now() - interval '30 days'
  group by product_id
) as views on views.product_id = product.id::text
left join (
  select
    item.product_id,
    sum(item.quantity)::bigint as units_sold_30d
  from public.order_items as item
  join public.orders as order_record on order_record.id = item.order_id
  where item.product_id is not null
    and order_record.status in ('approved', 'processing', 'completed')
    and coalesce(order_record.confirmed_at, order_record.created_at) >= now() - interval '30 days'
  group by item.product_id
) as sales on sales.product_id = product.id
where product.is_active = true;

revoke all on public.product_social_proof from public;
grant select on public.product_social_proof to anon, authenticated;
