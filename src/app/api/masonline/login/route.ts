import { NextResponse } from 'next/server'
import { openLoginPage } from '@/lib/masonline/cartAutomation'

export async function POST() {
  try {
    await openLoginPage()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error abriendo login:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
