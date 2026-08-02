import { NextRequest, NextResponse } from 'next/server'
import { addSelectionsToCart } from '@/lib/meli/cartAutomation'
import { MeliSelection } from '@/types/meli'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const selections: MeliSelection[] = body.selections

    if (!Array.isArray(selections) || selections.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de selecciones' },
        { status: 400 }
      )
    }

    for (const selection of selections) {
      if (!selection.productId || !selection.productName || !selection.url || !selection.quantity || selection.quantity < 1) {
        return NextResponse.json(
          { error: `Seleccion invalida: ${selection.productName || 'sin nombre'}` },
          { status: 400 }
        )
      }
    }

    const result = await addSelectionsToCart(selections)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en meli/add-to-cart:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
