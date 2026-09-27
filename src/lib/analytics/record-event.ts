import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export async function recordAppView(appId: string) {
  const supabase = createAdminClient()
  await supabase.from('app_events').insert({ app_id: appId, event_type: 'view' })
}

export async function recordAppDownload(appId: string) {
  const supabase = createAdminClient()
  await supabase.from('app_events').insert({ app_id: appId, event_type: 'download' })
}