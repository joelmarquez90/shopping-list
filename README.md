# Lista de Compras

A modern shopping list web application built with Next.js, designed to replace Google Spreadsheets workflows for monthly grocery shopping.

## Features

- **Product List View**: Display products with name, quantity, and supermarket links
- **"Hay" (Have It) Toggle**: Mark products you already have at home
- **"Comprado" (Purchased) Toggle**: Track products added to your cart
- **Quantity Editor**: Adjust quantities for each product (0-99)
- **Smart Filtering**: Filter by All / Pending / Missing items
- **External Links**: Click product names to open supermarket pages
- **Dark Mode**: Dark theme by default
- **Responsive Design**: Mobile-first, works on all devices

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Runtime**: React 19

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/joelmarquez90/shopping-list.git
cd shopping-list

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with dark mode
│   ├── page.tsx        # Main shopping list page
│   └── globals.css     # Global styles + CSS variables
├── components/
│   ├── FilterBar.tsx   # Filter buttons (Todos/Pendientes/Faltantes)
│   ├── ProductList.tsx # Product list container
│   └── ProductRow.tsx  # Individual product row
├── data/
│   └── products.ts     # Hardcoded product catalog
├── hooks/
│   └── useProductState.ts # State management hook
└── types/
    └── product.ts      # TypeScript interfaces
```

## Usage

1. **Review Products**: Browse the full product list
2. **Mark "Hay"**: Check products you already have (they'll be dimmed)
3. **Set Quantities**: Adjust how many of each item you need
4. **Shop**: Click product names to open supermarket pages
5. **Mark "Comprado"**: Check off items as you add them to cart
6. **Filter**: Use filters to see only pending or missing items

## Filter Logic

| Filter | Shows |
|--------|-------|
| **Todos** | All products |
| **Pendientes** | Products NOT marked as "Hay" |
| **Faltantes** | Products NOT marked as "Hay" AND NOT marked as "Comprado" |

## Data Source

Products are loaded from `baselist.csv` which contains the product catalog extracted from the original Google Spreadsheet. All URLs point to [masonline.com.ar](https://www.masonline.com.ar).

## MVP Limitations

- No authentication
- No data persistence (state resets on page refresh)
- Products are hardcoded
- Single user only

## License

Private project.
