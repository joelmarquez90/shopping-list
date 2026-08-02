import { NextRequest, NextResponse } from 'next/server'
import { searchCandidates } from '@/lib/meli/search'
import { MeliSearchProduct } from '@/types/meli'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const products: MeliSearchProduct[] = body.products

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de productos' },
        { status: 400 }
      )
    }

    for (const product of products) {
      if (!product.id || !product.name || !product.quantity || product.quantity < 1) {
        return NextResponse.json(
          { error: `Producto invalido: ${product.name || 'sin nombre'}` },
          { status: 400 }
        )
      }
    }

    const items = await searchCandidates(products)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error en meli/search:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
