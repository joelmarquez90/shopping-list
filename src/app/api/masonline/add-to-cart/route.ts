import { NextRequest, NextResponse } from 'next/server'
import { addProductsToCart, CartProduct } from '@/lib/masonline/cartAutomation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const products: CartProduct[] = body.products

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de productos' },
        { status: 400 }
      )
    }

    // Validate each product has required fields
    for (const product of products) {
      if (!product.name || !product.url || !product.quantity || product.quantity < 1) {
        return NextResponse.json(
          { error: `Producto invalido: ${product.name || 'sin nombre'}` },
          { status: 400 }
        )
      }
    }

    const result = await addProductsToCart(products)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en add-to-cart:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
