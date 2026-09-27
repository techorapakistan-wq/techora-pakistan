update public.store_settings
set easypaisa_number = '03234724373',
    easypaisa_name = 'Muhammad Usama',
    jazzcash_number = '03234724373',
    jazzcash_name = 'Muhammad Usama',
    bank_name = 'HBL',
    bank_account = '06147900940851',
    bank_account_name = 'Muhammad Usama',
    updated_at = now()
where id = true;

do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%payment_method%'
  loop
    execute format('alter table public.orders drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('easypaisa', 'jazzcash', 'bank_transfer', 'cod'));
