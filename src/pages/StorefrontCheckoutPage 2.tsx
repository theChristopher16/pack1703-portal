import React, { useState } from 'react';
import { CheckoutForm, CartItem, OrderData } from '../components/Storefront';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

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
    quantity: 1,
    selectedColor: 'Navy'
  }
];

export const StorefrontCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const cartItems = sampleCartItems;
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.0875;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  const handleComplete = async (orderData: OrderData) => {
    // In production, this would submit the order to Firestore
    console.log('Order submitted:', orderData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate order number
    const newOrderNumber = `SFES-${Date.now().toString().slice(-8)}`;
    setOrderNumber(newOrderNumber);
    setIsOrderComplete(true);
  };

  const handleCancel = () => {
    navigate('/cart');
  };

  if (isOrderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-display font-bold text-ink mb-3">
              Order Confirmed!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your order. We've received your purchase and will process it shortly.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Order Number</p>
              <p className="text-2xl font-bold text-ink font-mono">{orderNumber}</p>
            </div>

            <div className="space-y-3 text-sm text-gray-600 mb-8">
              <p>✓ Confirmation email sent</p>
              <p>✓ Payment processed successfully</p>
              <p>✓ Order being prepared for shipment</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/orders')}
                className="px-6 py-3 bg-forest-600 text-white rounded-lg font-semibold hover:bg-forest-700 transition-colors"
              >
                View Order Status
              </button>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-ink mb-3">
            Checkout
          </h1>
          <p className="text-lg text-forest-600">
            Complete your purchase securely
          </p>
        </div>

        {/* Checkout Form */}
        <CheckoutForm
          cartItems={cartItems}
          total={total}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

