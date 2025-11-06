import React, { useState } from 'react';
import { ProductCatalog, Product } from '../components/Storefront';
import { useNavigate } from 'react-router-dom';

// St. Francis Episcopal School Spirit Store Products
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Wolves Nike Dri-FIT T-Shirt',
    description: 'Premium Nike Dri-FIT performance t-shirt in navy blue. Moisture-wicking fabric keeps you cool and dry.',
    price: 24.99,
    compareAtPrice: 29.99,
    images: ['/products/500-2.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 47,
    rating: 4.8,
    reviewCount: 32,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult 2XL'],
    colors: ['Navy'],
    tags: ['shirt', 't-shirt', 'nike', 'dri-fit', 'wolves']
  },
  {
    id: '2',
    name: 'SFE Wolves Hoodie - Navy',
    description: 'Comfortable pullover hoodie with kangaroo pocket. Features SFE Wolves branding.',
    price: 44.99,
    compareAtPrice: 54.99,
    images: ['/products/500-6.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 28,
    rating: 4.9,
    reviewCount: 56,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult 2XL'],
    colors: ['Navy'],
    tags: ['hoodie', 'apparel', 'spirit wear', 'wolves']
  },
  {
    id: '3',
    name: 'SFE Wolves Hoodie - Grey',
    description: 'Classic heather grey hoodie with SFE Wolves logo. Perfect for school spirit days.',
    price: 44.99,
    images: ['/products/500-7.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 34,
    rating: 4.7,
    reviewCount: 41,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult 2XL'],
    colors: ['Grey'],
    tags: ['hoodie', 'apparel', 'spirit wear']
  },
  {
    id: '4',
    name: 'Athletic Sweatpants - Navy',
    description: 'Comfortable navy sweatpants with elastic waistband and cuffs. Perfect for PE or casual wear.',
    price: 29.99,
    images: ['/products/500-8.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 52,
    rating: 4.5,
    reviewCount: 28,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    colors: ['Navy'],
    tags: ['pants', 'sweatpants', 'athletic']
  },
  {
    id: '5',
    name: 'Athletic Shorts - Navy',
    description: 'Lightweight athletic shorts with elastic waistband and drawstring. Great for sports and activities.',
    price: 22.99,
    images: ['/products/500-10.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 63,
    rating: 4.6,
    reviewCount: 37,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    colors: ['Navy'],
    tags: ['shorts', 'athletic', 'sports']
  },
  {
    id: '6',
    name: 'Wolves Polo Shirt - Navy',
    description: 'Classic pique polo shirt with textured fabric. Professional look for school events.',
    price: 32.99,
    images: ['/products/500-13.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 41,
    rating: 4.8,
    reviewCount: 45,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult 2XL'],
    colors: ['Navy'],
    tags: ['polo', 'shirt', 'dress code']
  },
  {
    id: '7',
    name: 'Performance Quarter-Zip Pullover',
    description: 'Athletic quarter-zip with stand-up collar and thumbholes. Perfect for layering.',
    price: 49.99,
    compareAtPrice: 59.99,
    images: ['/products/500-15.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 19,
    rating: 4.9,
    reviewCount: 52,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult 2XL'],
    colors: ['Navy'],
    tags: ['quarter-zip', 'pullover', 'athletic', 'performance']
  },
  {
    id: '8',
    name: 'Wolves Spirit T-Shirt - Heather Navy',
    description: 'Soft heathered navy t-shirt with Wolves branding. Comfortable everyday wear.',
    price: 19.99,
    images: ['/products/500-4.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 67,
    rating: 4.6,
    reviewCount: 89,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    colors: ['Heather Navy'],
    tags: ['t-shirt', 'spirit wear', 'wolves']
  },
  {
    id: '9',
    name: 'Wolves Nike Beanie',
    description: 'Nike knit beanie in navy with white swoosh logo. Stay warm in style.',
    price: 18.99,
    images: ['/products/Original.png'],
    category: 'Accessories',
    inStock: true,
    stockCount: 42,
    rating: 4.7,
    reviewCount: 31,
    colors: ['Navy'],
    tags: ['beanie', 'hat', 'nike', 'winter']
  },
  {
    id: '10',
    name: 'Striped Knit Beanie',
    description: 'Classic ribbed knit beanie with navy, white, and grey stripes. One size fits all.',
    price: 16.99,
    images: ['/products/Original-2.png'],
    category: 'Accessories',
    inStock: true,
    stockCount: 38,
    rating: 4.5,
    reviewCount: 24,
    colors: ['Navy/White/Grey'],
    tags: ['beanie', 'hat', 'winter', 'striped']
  },
  {
    id: '11',
    name: 'Long Sleeve Performance Tee - Navy',
    description: 'Heathered long sleeve athletic shirt. Lightweight and breathable for all-day comfort.',
    price: 27.99,
    images: ['/products/Original-3.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 31,
    rating: 4.6,
    reviewCount: 27,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    colors: ['Heather Navy'],
    tags: ['long sleeve', 't-shirt', 'performance']
  },
  {
    id: '12',
    name: 'Wolves Spirit T-Shirt - Royal Blue',
    description: 'Vibrant royal blue t-shirt with white sleeve stripes. Show your Wolves pride!',
    price: 21.99,
    images: ['/products/500-14.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 44,
    rating: 4.7,
    reviewCount: 36,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    colors: ['Royal Blue'],
    tags: ['t-shirt', 'spirit wear', 'wolves', 'striped']
  },
  {
    id: '13',
    name: 'Athletic Shorts - Grey',
    description: 'Heather grey athletic shorts with comfortable fit. Great for gym or leisure.',
    price: 22.99,
    images: ['/products/500-12.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 29,
    rating: 4.4,
    reviewCount: 19,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    colors: ['Heather Grey'],
    tags: ['shorts', 'athletic', 'sports']
  },
  {
    id: '14',
    name: 'Track Pants - Navy',
    description: 'Lightweight navy track pants with elastic waist. Perfect for sports and outdoor activities.',
    price: 32.99,
    images: ['/products/500-9.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 25,
    rating: 4.5,
    reviewCount: 22,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    colors: ['Navy'],
    tags: ['pants', 'track pants', 'athletic']
  },
  {
    id: '15',
    name: 'Wolves Hoodie - Red',
    description: 'Bold red hoodie with SFE Wolves branding. Stand out at school events!',
    price: 44.99,
    images: ['/products/500-11.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 18,
    rating: 4.8,
    reviewCount: 33,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult 2XL'],
    colors: ['Red'],
    tags: ['hoodie', 'apparel', 'spirit wear', 'red']
  },
  {
    id: '16',
    name: 'Utility Button-Up Shirt - Navy',
    description: 'Versatile navy utility shirt with multiple pockets. Great for outdoor activities.',
    price: 38.99,
    images: ['/products/500.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 22,
    rating: 4.6,
    reviewCount: 16,
    sizes: ['Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult 2XL'],
    colors: ['Navy'],
    tags: ['shirt', 'button-up', 'utility', 'outdoor']
  }
];

export const StorefrontProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Product[]>([]);

  const handleAddToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
    // Show toast notification
    console.log('Added to cart:', product.name);
    // Could integrate with a global cart context here
  };

  const handleViewDetails = (product: Product) => {
    // Navigate to product detail page
    console.log('View details:', product.name);
    // In production: navigate(`/products/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-ink mb-3">
            St. Francis Episcopal School Spirit Store
          </h1>
          <p className="text-lg text-forest-600">
            Show your Wolves pride! Official SFE spirit wear and athletic apparel
          </p>
        </div>

        {/* Product Catalog */}
        <ProductCatalog
          products={sampleProducts}
          onAddToCart={handleAddToCart}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  );
};

