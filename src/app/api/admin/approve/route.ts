import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, status } = body;

    if (!type || !id || !status) {
      return NextResponse.json({ error: 'type, id, and status are required' }, { status: 400 });
    }

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const admin = createAdminClient();

    if (type === 'user') {
      const { error } = await admin
        .from('profiles')
        .update({ status })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await admin.from('notifications').insert({
        user_id: id,
        title: `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: status === 'approved'
          ? 'Your account has been approved! You now have full access to HatodJasaan.'
          : status === 'rejected'
          ? 'Your account application was not approved. Please contact support for details.'
          : 'Your account has been suspended. Please contact support.',
        type: 'approval_update',
        data: { status },
      });

      return NextResponse.json({ success: true, status });
    }

    if (type === 'business') {
      const { data: business, error: fetchErr } = await admin
        .from('businesses')
        .select('owner_id, name')
        .eq('id', id)
        .single();

      if (fetchErr || !business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      const { error } = await admin
        .from('businesses')
        .update({ status })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await admin.from('notifications').insert({
        user_id: business.owner_id,
        title: `Business ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: status === 'approved'
          ? `Your business "${business.name}" has been approved and is now live!`
          : status === 'rejected'
          ? `Your business "${business.name}" application was not approved.`
          : `Your business "${business.name}" has been suspended.`,
        type: 'approval_update',
        data: { business_id: id, status },
      });

      return NextResponse.json({ success: true, status });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
