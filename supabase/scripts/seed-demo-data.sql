-- Demo data for ONE account, for manual testing. Run in the Supabase SQL Editor.
--
-- This is NOT a migration and must never become one. The app deliberately ships
-- with no seed rows: INITIAL_LEADS, INITIAL_TASKS, MOCK_CONTACTS and friends
-- were deleted in Phase 0 because they rendered invented people as production
-- data, and a new account starting empty is the correct first-run experience.
-- This script exists so a developer can exercise the dashboard, pipeline and
-- reports without hand-typing thirty rows — it targets one email and touches
-- nothing else.
--
-- Idempotent: every row has a fixed 5eed… id and is deleted before reinsert, so
-- running it twice leaves the same twelve leads rather than twenty-four. Rows
-- YOU created by hand have random ids and are never touched.
--
-- Status and interest values are the exact vocabularies CRMPage filters on
-- (src/pages/CRMPage.jsx:1014, :688). A typo here does not error — it produces
-- a lead that silently drops out of every funnel count.

do $$
declare
  target_email constant text := 'info@adtodeal.com';
  v_user uuid;
  v_org  uuid;
begin
  select id into v_user from auth.users where email = target_email;
  if v_user is null then
    raise exception 'No account for %. Register it first.', target_email;
  end if;

  select org_id into v_org
  from public.org_members
  where user_id = v_user and role = 'owner'
  limit 1;

  if v_org is null then
    raise exception 'No owner organization for %.', target_email;
  end if;

  -- Children first: tasks reference leads.
  delete from public.tasks             where id::text like '5eed2%';
  delete from public.leads             where id::text like '5eed1%';
  delete from public.campaign_requests where id::text like '5eed3%';

  insert into public.leads (
    id, org_id, owner_id, name, name_ar, phone, email, source, source_ar,
    service, service_ar, budget, expected_value, status, status_ar,
    interest_level, interest_level_ar, last_contact, next_follow_up, notes, notes_ar
  ) values
  ('5eed1001-0000-4000-8000-000000000001', v_org, v_user,
   'Ahmed El-Shennawy', 'أحمد الشناوي', '+201001234567', 'a.shennawy@example.com',
   'Facebook Ads', 'إعلانات فيسبوك', 'Apartment - New Cairo', 'شقة - القاهرة الجديدة',
   4500000, 4500000, 'Close to Deal', 'قريب من الإغلاق', 'High', 'مرتفع',
   current_date - 2, current_date + 1,
   'Visited the model unit twice. Waiting on the payment plan.',
   'زار الوحدة النموذجية مرتين. في انتظار خطة السداد.'),

  ('5eed1001-0000-4000-8000-000000000002', v_org, v_user,
   'Mona Abdelrahman', 'منى عبد الرحمن', '+201112345678', 'mona.a@example.com',
   'Instagram', 'إنستجرام', 'Villa - Sheikh Zayed', 'فيلا - الشيخ زايد',
   12000000, 12000000, 'Interested', 'مهتم', 'High', 'مرتفع',
   current_date - 1, current_date + 3,
   'Asked for a corner unit with a garden.',
   'طلبت وحدة ركنية بحديقة.'),

  ('5eed1001-0000-4000-8000-000000000003', v_org, v_user,
   'Khaled El-Feki', 'خالد الفقي', '+201223456789', 'k.elfeki@example.com',
   'Referral', 'ترشيح عميل', 'Duplex - Fifth Settlement', 'دوبلكس - التجمع الخامس',
   7800000, 7800000, 'Needs Follow-up', 'يحتاج متابعة', 'Medium', 'متوسط',
   current_date - 6, current_date - 1,
   'Comparing us against two other developers.',
   'يقارن بيننا وبين مطوّرَين آخرين.'),

  ('5eed1001-0000-4000-8000-000000000004', v_org, v_user,
   'Sara Mansour', 'سارة منصور', '+201034567890', 'sara.m@example.com',
   'Website', 'الموقع الإلكتروني', 'Chalet - North Coast', 'شاليه - الساحل الشمالي',
   3200000, 3200000, 'Won', 'تم الإغلاق', 'High', 'مرتفع',
   current_date - 9, null,
   'Contract signed, 20% down payment received.',
   'تم توقيع العقد واستلام مقدم 20%.'),

  ('5eed1001-0000-4000-8000-000000000005', v_org, v_user,
   'Amr El-Deeb', 'عمرو الديب', '+201145678901', 'amr.deeb@example.com',
   'WhatsApp', 'واتساب', 'Retail Unit - Madinaty', 'محل تجاري - مدينتي',
   5600000, 5600000, 'Contacted', 'تم التواصل', 'Medium', 'متوسط',
   current_date - 3, current_date + 2,
   'Wants footfall figures before viewing.',
   'يريد أرقام الكثافة قبل المعاينة.'),

  ('5eed1001-0000-4000-8000-000000000006', v_org, v_user,
   'Heba Selim', 'هبة سليم', '+201256789012', 'heba.selim@example.com',
   'Property Finder', 'بروبرتي فايندر', 'Apartment - Maadi', 'شقة - المعادي',
   2900000, 2900000, 'New', 'جديد', 'Medium', 'متوسط',
   null, current_date,
   'Inbound enquiry, not yet called.',
   'استفسار وارد، لم يتم الاتصال بعد.'),

  ('5eed1001-0000-4000-8000-000000000007', v_org, v_user,
   'Tarek Zahran', 'طارق زهران', '+201067890123', 't.zahran@example.com',
   'Facebook Ads', 'إعلانات فيسبوك', 'Office - New Capital', 'مكتب إداري - العاصمة الإدارية',
   9400000, 9400000, 'Postponed', 'مؤجل', 'Medium', 'متوسط',
   current_date - 14, current_date + 21,
   'Postponed to next quarter, budget not approved yet.',
   'مؤجل للربع القادم، الميزانية لم تُعتمد.'),

  ('5eed1001-0000-4000-8000-000000000008', v_org, v_user,
   'Nourhan Fouad', 'نورهان فؤاد', '+201178901234', 'n.fouad@example.com',
   'Instagram', 'إنستجرام', 'Apartment - Zamalek', 'شقة - الزمالك',
   6100000, 6100000, 'No Response', 'لا يوجد رد', 'Low', 'منخفض',
   current_date - 11, current_date + 4,
   'Three calls, no answer. Try WhatsApp.',
   'ثلاث محاولات اتصال بلا رد. جرّب واتساب.'),

  ('5eed1001-0000-4000-8000-000000000009', v_org, v_user,
   'Mahmoud El-Ashry', 'محمود العشري', '+201289012345', 'm.ashry@example.com',
   'Referral', 'ترشيح عميل', 'Villa - Palm Hills', 'فيلا - بالم هيلز',
   15500000, 15500000, 'Close to Deal', 'قريب من الإغلاق', 'High', 'مرتفع',
   current_date, current_date + 2,
   'Negotiating a 10% discount on cash payment.',
   'يتفاوض على خصم 10% للدفع الكاش.'),

  ('5eed1001-0000-4000-8000-00000000000a', v_org, v_user,
   'Reem El-Kady', 'ريم القاضي', '+201090123456', 'reem.k@example.com',
   'Walk-in', 'زيارة مباشرة', 'Apartment - Nasr City', 'شقة - مدينة نصر',
   2400000, 2400000, 'Lost', 'خسارة', 'Low', 'منخفض',
   current_date - 20, null,
   'Bought from a competitor closer to her workplace.',
   'اشترت من منافس أقرب لمقر عملها.'),

  ('5eed1001-0000-4000-8000-00000000000b', v_org, v_user,
   'Yasser Badawy', 'ياسر بدوي', '+201301234567', 'y.badawy@example.com',
   'Website', 'الموقع الإلكتروني', 'Land - Sokhna', 'أرض - العين السخنة',
   8200000, 8200000, 'Interested', 'مهتم', 'High', 'مرتفع',
   current_date - 4, current_date + 5,
   'Requested the full masterplan PDF.',
   'طلب ملف المخطط العام كاملاً.'),

  ('5eed1001-0000-4000-8000-00000000000c', v_org, v_user,
   'Dina Hegazy', 'دينا حجازي', '+201412345678', 'dina.h@example.com',
   'WhatsApp', 'واتساب', 'Apartment - Rehab', 'شقة - الرحاب',
   3700000, 3700000, 'Not Interested', 'غير مهتم', 'Low', 'منخفض',
   current_date - 8, null,
   'Looking to rent, not buy.',
   'تبحث عن إيجار وليس شراء.');

  insert into public.tasks (
    id, org_id, owner_id, lead_id, title, title_ar, notes, type, priority,
    status, completed, due_date, completed_at
  ) values
  ('5eed2001-0000-4000-8000-000000000001', v_org, v_user, '5eed1001-0000-4000-8000-000000000001',
   'Send the payment plan to Ahmed', 'إرسال خطة السداد لأحمد',
   'He asked for the 8-year option.', 'call', 'High', 'todo', false, current_date + 1, null),

  ('5eed2001-0000-4000-8000-000000000002', v_org, v_user, '5eed1001-0000-4000-8000-000000000002',
   'Book a garden villa viewing for Mona', 'حجز معاينة فيلا بحديقة لمنى',
   'Prefers a weekend morning.', 'meeting', 'High', 'todo', false, current_date + 3, null),

  ('5eed2001-0000-4000-8000-000000000003', v_org, v_user, '5eed1001-0000-4000-8000-000000000003',
   'Follow up with Khaled on the comparison', 'متابعة خالد بخصوص المقارنة',
   'Overdue — he is evaluating two competitors.', 'call', 'High', 'todo', false, current_date - 1, null),

  ('5eed2001-0000-4000-8000-000000000004', v_org, v_user, '5eed1001-0000-4000-8000-000000000005',
   'Send footfall report to Amr', 'إرسال تقرير الكثافة لعمرو',
   null, 'whatsapp', 'Medium', 'todo', false, current_date + 2, null),

  ('5eed2001-0000-4000-8000-000000000005', v_org, v_user, '5eed1001-0000-4000-8000-000000000006',
   'First call to Heba', 'أول اتصال بهبة',
   'Inbound from Property Finder.', 'call', 'High', 'todo', false, current_date, null),

  ('5eed2001-0000-4000-8000-000000000006', v_org, v_user, '5eed1001-0000-4000-8000-000000000008',
   'Try WhatsApp with Nourhan', 'محاولة واتساب مع نورهان',
   'Calls are not landing.', 'whatsapp', 'Medium', 'todo', false, current_date + 4, null),

  ('5eed2001-0000-4000-8000-000000000007', v_org, v_user, '5eed1001-0000-4000-8000-000000000009',
   'Get discount approval for Mahmoud', 'اعتماد خصم محمود',
   'Needs sales manager sign-off.', 'internal', 'High', 'todo', false, current_date + 2, null),

  ('5eed2001-0000-4000-8000-000000000008', v_org, v_user, '5eed1001-0000-4000-8000-00000000000b',
   'Email the masterplan to Yasser', 'إرسال المخطط العام لياسر',
   null, 'email', 'Medium', 'todo', false, current_date + 5, null),

  ('5eed2001-0000-4000-8000-000000000009', v_org, v_user, '5eed1001-0000-4000-8000-000000000004',
   'Collect signed contract from Sara', 'استلام العقد الموقّع من سارة',
   'Done — filed with legal.', 'internal', 'High', 'done', true, current_date - 9, now() - interval '9 days'),

  ('5eed2001-0000-4000-8000-00000000000a', v_org, v_user, '5eed1001-0000-4000-8000-000000000007',
   'Diarise Tarek for next quarter', 'تدوين موعد طارق للربع القادم',
   'Done.', 'internal', 'Low', 'done', true, current_date - 13, now() - interval '13 days');

  insert into public.campaign_requests (
    id, org_id, owner_id, platform, goal, budget, city, age, interests,
    duration, language, offer_details, notes, status, status_ar, request_date
  ) values
  ('5eed3001-0000-4000-8000-000000000001', v_org, v_user,
   'Facebook', 'Lead Generation', 25000, 'Cairo', '30-45',
   'Real estate, investment, family housing', 14, 'ar',
   'Launch offer on New Cairo apartments — 10% down, 8-year plan.',
   'Focus on the Fifth Settlement catchment.',
   'Pending Review', 'قيد المراجعة والتدقيق', current_date - 1),

  ('5eed3001-0000-4000-8000-000000000002', v_org, v_user,
   'Instagram', 'Brand Awareness', 18000, 'Alexandria', '25-40',
   'Coastal property, holiday homes', 10, 'ar',
   'North Coast chalets, summer delivery.',
   null,
   'Active & Delivering', 'نشطة وتجلب عملاء', current_date - 7),

  ('5eed3001-0000-4000-8000-000000000003', v_org, v_user,
   'TikTok', 'Lead Generation', 12000, 'Giza', '22-35',
   'First home, affordable housing', 7, 'ar',
   'Starter apartments in October City.',
   'Short-form video, vertical creative only.',
   'Pending Review', 'قيد المراجعة والتدقيق', current_date),

  ('5eed3001-0000-4000-8000-000000000004', v_org, v_user,
   'Google', 'Lead Generation', 40000, 'New Capital', '35-55',
   'Commercial, offices, investment', 30, 'ar',
   'Administrative offices in the New Capital business district.',
   null,
   'Completed', 'مكتملة', current_date - 30);

  raise notice 'Seeded 12 leads, 10 tasks and 4 campaign requests for org %.', v_org;
end $$;

select
  (select count(*) from public.leads             where id::text like '5eed1%') as leads,
  (select count(*) from public.tasks             where id::text like '5eed2%') as tasks,
  (select count(*) from public.campaign_requests where id::text like '5eed3%') as campaigns;
