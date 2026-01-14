/**
 * One-time migration script to seed products from local file to Firestore
 *
 * Usage: npx ts-node --project tsconfig.seed.json src/scripts/seedProducts.ts
 *
 * Or via npm script: npm run seed:products
 */

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore'
import { products } from '../data/products'

// Firebase config - uses same env vars as the app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

async function seedProducts() {
  console.log('Starting product migration...')
  console.log(`Found ${products.length} products to migrate`)

  // Initialize Firebase
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  const db = getFirestore(app)

  // Use batch writes for efficiency
  const batch = writeBatch(db)
  let count = 0

  for (const product of products) {
    const docRef = doc(collection(db, 'products'), product.id)
    batch.set(docRef, {
      id: product.id,
      name: product.name,
      url: product.url || null,
      defaultQuantity: product.defaultQuantity,
      defaultHay: product.defaultHay ?? false
    }, { merge: true }) // merge: true for upsert behavior

    count++

    // Log progress every 10 products
    if (count % 10 === 0) {
      console.log(`Prepared ${count}/${products.length} products...`)
    }
  }

  console.log(`Committing batch of ${count} products...`)

  try {
    await batch.commit()
    console.log(`Migration complete: ${count} products seeded successfully!`)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

// Run the migration
seedProducts()
