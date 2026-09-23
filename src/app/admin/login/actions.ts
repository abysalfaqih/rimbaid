'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'

export type LoginState = {
  error?: string
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Email atau password tidak valid.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    // Pesan sengaja digeneralisasi — jangan bocorkan apakah email terdaftar atau tidak
    return { error: 'Email atau password salah.' }
  }

  redirect('/admin/dashboard')
}