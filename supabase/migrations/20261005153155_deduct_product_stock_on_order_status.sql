alter table public.orders
  add column if not exists stock_deducted_at timestamptz;

create or replace function public.apply_order_stock_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected_products integer;
  updated_products integer;
begin
  if new.status in ('approved', 'processing', 'completed')
     and new.stock_deducted_at is null then
    select count(*)
      into expected_products
      from (
        select item.product_id
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as order_products;

    if expected_products = 0 then
      raise exception 'Cannot adjust stock: this order has no items linked to products.';
    end if;

    perform product.id
      from public.products as product
      join (
        select item.product_id, sum(item.quantity)::integer as quantity
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as quantities on quantities.product_id = product.id
     order by product.id
       for update of product;

    update public.products as product
       set stock = product.stock - quantities.quantity
      from (
        select item.product_id, sum(item.quantity)::integer as quantity
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as quantities
     where product.id = quantities.product_id
       and product.stock >= quantities.quantity;

    get diagnostics updated_products = row_count;
    if updated_products <> expected_products then
      raise exception 'Cannot confirm this order: one or more products do not have enough stock.';
    end if;

    new.stock_deducted_at := now();
  elsif new.status not in ('approved', 'processing', 'completed')
        and old.stock_deducted_at is not null then
    perform product.id
      from public.products as product
      join (
        select item.product_id, sum(item.quantity)::integer as quantity
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as quantities on quantities.product_id = product.id
     order by product.id
       for update of product;

    update public.products as product
       set stock = product.stock + quantities.quantity
      from (
        select item.product_id, sum(item.quantity)::integer as quantity
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as quantities
     where product.id = quantities.product_id;

    new.stock_deducted_at := null;
  end if;

  return new;
end;
$$;

revoke all on function public.apply_order_stock_transition() from public, anon, authenticated;

drop trigger if exists apply_order_stock_transition on public.orders;
create trigger apply_order_stock_transition
  before update of status on public.orders
  for each row
  execute function public.apply_order_stock_transition();
