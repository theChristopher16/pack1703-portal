import React, { useState } from 'react';
import { ProductCatalog, Product } from '../components/Storefront';
import { useNavigate } from 'react-router-dom';

// Sample products - in production, this would come from Firestore
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Pack 1703 Spirit T-Shirt',
    description: 'Premium cotton t-shirt featuring the Pack 1703 logo. Comfortable and durable for all activities.',
    price: 24.99,
    compareAtPrice: 29.99,
    images: ['/products/tshirt-blue.jpg', '/products/tshirt-green.jpg'],
    category: 'Apparel',
    inStock: true,
    stockCount: 47,
    rating: 4.5,
    reviewCount: 23,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    colors: ['Navy', 'Forest Green', 'Gray'],
    tags: ['shirt', 'apparel', 'spirit wear']
  },
  {
    id: '2',
    name: 'Cub Scout Neckerchief',
    description: 'Official Cub Scout neckerchief with Pack 1703 custom embroidery.',
    price: 12.99,
    images: ['/products/neckerchief.jpg'],
    category: 'Uniform',
    inStock: true,
    stockCount: 89,
    rating: 5,
    reviewCount: 45,
    tags: ['uniform', 'neckerchief', 'official']
  },
  {
    id: '3',
    name: 'Water Bottle - Stainless Steel',
    description: '32oz stainless steel water bottle with Pack 1703 engraving. Keeps drinks cold for 24 hours.',
    price: 34.99,
    compareAtPrice: 44.99,
    images: ['/products/bottle-blue.jpg', '/products/bottle-black.jpg'],
    category: 'Accessories',
    inStock: true,
    stockCount: 23,
    rating: 4.8,
    reviewCount: 67,
    colors: ['Blue', 'Black', 'Silver'],
    tags: ['water bottle', 'drinkware', 'camping']
  },
  {
    id: '4',
    name: 'Pack 1703 Baseball Cap',
    description: 'Adjustable baseball cap with embroidered Pack 1703 logo.',
    price: 19.99,
    images: ['/products/cap.jpg'],
    category: 'Apparel',
    inStock: true,
    stockCount: 34,
    rating: 4.3,
    reviewCount: 12,
    colors: ['Navy', 'Khaki'],
    tags: ['hat', 'cap', 'apparel']
  },
  {
    id: '5',
    name: 'Camping Mess Kit',
    description: 'Durable aluminum mess kit perfect for camping trips. Includes plate, bowl, cup, and utensils.',
    price: 29.99,
    images: ['/products/mess-kit.jpg'],
    category: 'Camping Gear',
    inStock: true,
    stockCount: 15,
    rating: 4.6,
    reviewCount: 34,
    tags: ['camping', 'gear', 'mess kit']
  },
  {
    id: '6',
    name: 'Pack 1703 Hoodie',
    description: 'Warm and cozy hoodie with Pack 1703 screen print. Perfect for cool weather activities.',
    price: 44.99,
    compareAtPrice: 54.99,
    images: ['/products/hoodie-gray.jpg', '/products/hoodie-navy.jpg'],
    category: 'Apparel',
    inStock: true,
    stockCount: 28,
    rating: 4.9,
    reviewCount: 56,
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    colors: ['Gray', 'Navy', 'Forest Green'],
    tags: ['hoodie', 'apparel', 'spirit wear']
  },
  {
    id: '7',
    name: 'First Aid Kit',
    description: 'Comprehensive 100-piece first aid kit for outdoor adventures.',
    price: 39.99,
    images: ['/products/first-aid.jpg'],
    category: 'Safety',
    inStock: true,
    stockCount: 8,
    rating: 4.7,
    reviewCount: 29,
    tags: ['safety', 'first aid', 'camping']
  },
  {
    id: '8',
    name: 'Scout Handbook',
    description: 'Official Cub Scout handbook for the current program year.',
    price: 14.99,
    images: ['/products/handbook.jpg'],
    category: 'Books',
    inStock: true,
    stockCount: 67,
    rating: 5,
    reviewCount: 89,
    tags: ['book', 'handbook', 'required']
  },
  {
    id: '9',
    name: 'Flashlight - LED Rechargeable',
    description: 'Powerful LED flashlight with USB rechargeable battery. 500 lumen output.',
    price: 27.99,
    images: ['/products/flashlight.jpg'],
    category: 'Camping Gear',
    inStock: true,
    stockCount: 42,
    rating: 4.4,
    reviewCount: 21,
    tags: ['flashlight', 'gear', 'camping']
  },
  {
    id: '10',
    name: 'Pack 1703 Backpack',
    description: 'Durable 30L backpack with Pack 1703 logo. Multiple compartments and padded straps.',
    price: 59.99,
    compareAtPrice: 74.99,
    images: ['/products/backpack.jpg'],
    category: 'Accessories',
    inStock: true,
    stockCount: 19,
    rating: 4.8,
    reviewCount: 43,
    colors: ['Navy', 'Black', 'Olive'],
    tags: ['backpack', 'bag', 'gear']
  },
  {
    id: '11',
    name: 'Rank Patch Set',
    description: 'Complete set of Cub Scout rank patches from Bobcat to Arrow of Light.',
    price: 24.99,
    images: ['/products/patches.jpg'],
    category: 'Uniform',
    inStock: false,
    rating: 4.9,
    reviewCount: 78,
    tags: ['patches', 'uniform', 'ranks']
  },
  {
    id: '12',
    name: 'Compass - Orienteering',
    description: 'Professional orienteering compass with magnifying glass and lanyard.',
    price: 18.99,
    images: ['/products/compass.jpg'],
    category: 'Camping Gear',
    inStock: true,
    stockCount: 31,
    rating: 4.5,
    reviewCount: 15,
    tags: ['compass', 'navigation', 'camping']
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
            Products
          </h1>
          <p className="text-lg text-forest-600">
            Shop official Pack 1703 spirit wear, camping gear, and scouting supplies
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

