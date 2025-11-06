import React, { useState } from 'react';
import { OrderHistory, Order } from '../components/Storefront';

// Sample orders - in production, this would come from Firestore
const sampleOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'SFES-00123456',
    date: new Date('2025-01-15'),
    status: 'delivered',
    items: [
      {
        id: '1',
        name: 'Wolves Nike Dri-FIT T-Shirt',
        image: '/products/500-2.png',
        quantity: 2,
        price: 24.99
      },
      {
        id: '9',
        name: 'Wolves Nike Beanie',
        image: '/products/Original.png',
        quantity: 1,
        price: 18.99
      }
    ],
    subtotal: 68.97,
    tax: 6.03,
    shipping: 0,
    total: 75.00,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    trackingNumber: '1Z999AA10123456784',
    estimatedDelivery: new Date('2025-01-18')
  },
  {
    id: '2',
    orderNumber: 'SFES-00123457',
    date: new Date('2025-01-28'),
    status: 'shipped',
    items: [
      {
        id: '2',
        name: 'SFE Wolves Hoodie - Navy',
        image: '/products/500-6.png',
        quantity: 1,
        price: 44.99
      },
      {
        id: '3',
        name: 'SFE Wolves Hoodie - Grey',
        image: '/products/500-7.png',
        quantity: 1,
        price: 44.99
      }
    ],
    subtotal: 89.98,
    tax: 7.87,
    shipping: 0,
    total: 97.85,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    trackingNumber: '1Z999AA10123456785',
    estimatedDelivery: new Date('2025-02-02')
  },
  {
    id: '3',
    orderNumber: 'SFES-00123458',
    date: new Date('2025-02-01'),
    status: 'processing',
    items: [
      {
        id: '6',
        name: 'Wolves Polo Shirt - Navy',
        image: '/products/500-13.png',
        quantity: 1,
        price: 32.99
      },
      {
        id: '4',
        name: 'Athletic Sweatpants - Navy',
        image: '/products/500-8.png',
        quantity: 1,
        price: 29.99
      },
      {
        id: '10',
        name: 'Striped Knit Beanie',
        image: '/products/Original-2.png',
        quantity: 1,
        price: 16.99
      }
    ],
    subtotal: 79.97,
    tax: 6.99,
    shipping: 5.99,
    total: 92.95,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    estimatedDelivery: new Date('2025-02-08')
  },
  {
    id: '4',
    orderNumber: 'SFES-00123459',
    date: new Date('2024-12-10'),
    status: 'delivered',
    items: [
      {
        id: '7',
        name: 'Performance Quarter-Zip Pullover',
        image: '/products/500-15.png',
        quantity: 1,
        price: 49.99
      },
      {
        id: '5',
        name: 'Athletic Shorts - Navy',
        image: '/products/500-10.png',
        quantity: 2,
        price: 22.99
      },
      {
        id: '14',
        name: 'Track Pants - Navy',
        image: '/products/500-9.png',
        quantity: 1,
        price: 32.99
      }
    ],
    subtotal: 128.96,
    tax: 11.28,
    shipping: 0,
    total: 140.24,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    trackingNumber: '1Z999AA10123456783',
    estimatedDelivery: new Date('2024-12-15')
  },
  {
    id: '5',
    orderNumber: 'SFES-00123460',
    date: new Date('2025-01-05'),
    status: 'cancelled',
    items: [
      {
        id: '15',
        name: 'Wolves Hoodie - Red',
        image: '/products/500-11.png',
        quantity: 1,
        price: 44.99
      }
    ],
    subtotal: 44.99,
    tax: 3.94,
    shipping: 0,
    total: 48.93,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    }
  }
];

export const StorefrontOrdersPage: React.FC = () => {
  const [orders] = useState<Order[]>(sampleOrders);

  const handleViewOrder = (order: Order) => {
    console.log('View order:', order.orderNumber);
    // In production: navigate to order details page
  };

  const handleDownloadInvoice = (orderId: string) => {
    console.log('Download invoice for order:', orderId);
    // In production: generate and download PDF invoice
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Order History Component */}
        <OrderHistory
          orders={orders}
          onViewOrder={handleViewOrder}
          onDownloadInvoice={handleDownloadInvoice}
        />
      </div>
    </div>
  );
};

