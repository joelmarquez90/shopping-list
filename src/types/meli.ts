/**
 * Types for the Mercado Libre cart flow.
 *
 * Unlike MasOnline, products have no stored Mercado Libre URL, so the flow is
 * search by name -> user confirms a candidate -> add the confirmed items.
 */

/** A single search result offered to the user for confirmation */
export interface MeliCandidate {
  /** Product page URL */
  url: string

  /** Listing title as shown on Mercado Libre */
  title: string

  /** Formatted price, e.g. "$7.699" */
  price: string

  /** Seller or brand, when the listing exposes one */
  seller?: string

  /** Thumbnail URL */
  imageUrl?: string
}

/** Input for a search: the shopping-list product we need to find */
export interface MeliSearchProduct {
  id: string
  name: string
  quantity: number
}

/** Candidates found for one product */
export interface MeliSearchItem {
  productId: string
  productName: string
  quantity: number
  candidates: MeliCandidate[]

  /** Set when this product could not be searched or had no results */
  error?: string
}

/** A candidate the user confirmed, ready to be added to the cart */
export interface MeliSelection {
  productId: string
  productName: string
  url: string
  quantity: number
}

/** Result of adding the confirmed selections, same shape as the MasOnline cart result */
export interface MeliCartResult {
  success: { id: string; name: string }[]
  failed: { id: string; name: string; error: string }[]
}
