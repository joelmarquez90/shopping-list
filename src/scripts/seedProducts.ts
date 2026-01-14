/**
 * One-time migration script to seed products from local file to Firestore
 *
 * Uses Firebase Admin SDK to bypass security rules.
 *
 * Setup:
 * 1. Go to Firebase Console > Project Settings > Service Accounts
 * 2. Click "Generate new private key" and save as `serviceAccountKey.json` in project root
 * 3. Run: npm run seed
 *
 * Or via npm script: npm run seed:products
 */

import * as admin from 'firebase-admin'
import * as path from 'path'
import * as fs from 'fs'
import { products } from '../data/products'

// Path to service account key file
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json')

async function seedProducts() {
  console.log('Starting product migration...')

  // Check if service account key exists
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: serviceAccountKey.json not found!')
    console.error('')
    console.error('To generate a service account key:')
    console.error('1. Go to Firebase Console > Project Settings > Service Accounts')
    console.error('2. Click "Generate new private key"')
    console.error('3. Save the file as "serviceAccountKey.json" in the project root')
    console.error('')
    console.error('Note: Add serviceAccountKey.json to .gitignore to keep it secure!')
    process.exit(1)
  }

  // Initialize Firebase Admin
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
  }

  const db = admin.firestore()
  console.log(`Found ${products.length} products to migrate`)

  // Use batch writes for efficiency (max 500 operations per batch)
  const batch = db.batch()
  let count = 0

  for (const product of products) {
    const docRef = db.collection('products').doc(product.id)
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
