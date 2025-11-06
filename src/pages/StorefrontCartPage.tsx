import React, { useState } from 'react';
import { ShoppingCart, CartItem } from '../components/Storefront';
import { useNavigate } from 'react-router-dom';

// Sample cart items - in production, this would come from context/state management
const sampleCartItems: CartItem[] = [
  {
    id: '1',
    name: 'Wolves Nike Dri-FIT T-Shirt',
    description: 'Premium Nike Dri-FIT performance t-shirt in navy blue.',
    price: 24.99,
    images: ['/products/500-2.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 47,
    quantity: 2,
    selectedSize: 'Youth M',
    selectedColor: 'Navy'
  },
  {
    id: '2',
    name: 'SFE Wolves Hoodie - Navy',
    description: 'Comfortable pullover hoodie with kangaroo pocket.',
    price: 44.99,
    images: ['/products/500-6.png'],
    category: 'Apparel',
    inStock: true,
    stockCount: 28,
    quantity: 1,
    selectedSize: 'Adult M',
    selectedColor: 'Navy'
  },
  {
    id: '9',
    name: 'Wolves Nike Beanie',
    description: 'Nike knit beanie in navy with white swoosh logo.',
    price: 18.99,
    images: ['/products/Original.png'],
    category: 'Accessories',
    inStock: true,
    stockCount: 42,
    quantity: 1,
    selectedColor: 'Navy'
  }
];

export const StorefrontCartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(sampleCartItems);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCartItems([]);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-ink mb-3">
            Shopping Cart
          </h1>
          <p className="text-lg text-forest-600">
            Review your items and proceed to checkout
          </p>
        </div>

        {/* Shopping Cart Component */}
        <ShoppingCart
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
};

