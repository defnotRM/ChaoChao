//api สําหรับดึงข้อมูล products รอ database เสดเดี่ยวแก้เพิ่ม

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, description, created_at')
    .order('id', { ascending: true })

  if (error) {
    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    )
  }

  return NextResponse.json(data)
}