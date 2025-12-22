import React, { useState } from 'react';
import { Package, ChevronDown, ChevronUp, MapPin, CreditCard, Calendar, Download, Eye } from 'lucide-react';

export interface Order {
  id: string;
  orderNumber: string;
  date: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: {
    id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: Date;
}

interface OrderHistoryProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onDownloadInvoice: (orderId: string) => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dotColor: 'bg-yellow-500'
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500'
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    dotColor: 'bg-purple-500'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-200',
    dotColor: 'bg-green-500'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-500'
  }
};

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  onViewOrder,
  onDownloadInvoice
}) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'all'>('all');

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center max-w-md mx-auto">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-ink mb-2">
            No orders yet
          </h2>
          <p className="text-gray-500 mb-6">
            Start shopping to see your order history here
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 bg-forest-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-forest-700 transition-colors"
          >
            Browse Products
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Order History</h1>
          <p className="text-gray-600 mt-1">{filteredOrders.length} orders found</p>
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          const config = statusConfig[order.status];

          return (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-ink">
                        Order #{order.orderNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${config.dotColor}`} />
                        {config.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                      {order.trackingNumber && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Tracking: {order.trackingNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-ink">${order.total.toFixed(2)}</p>
                    {order.estimatedDelivery && order.status !== 'delivered' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Est. delivery: {formatDate(order.estimatedDelivery)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Preview of Items */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {order.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="w-16 h-16 rounded bg-gray-100 flex-shrink-0"
                    >
                      <img
                        src={item.image || '/placeholder-product.png'}
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-16 h-16 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center text-sm font-medium text-gray-600">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleOrder(order.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        View Details
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onViewOrder(order)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Order
                  </button>

                  <button
                    onClick={() => onDownloadInvoice(order.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Invoice
                  </button>

                  {order.trackingNumber && (
                    <a
                      href={`https://www.fedex.com/fedextrack/?tracknumbers=${order.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 font-medium text-sm transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Track Package
                    </a>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold text-ink mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex gap-3 bg-white rounded-lg p-3">
                            <div className="w-16 h-16 rounded bg-gray-100 flex-shrink-0">
                              <img
                                src={item.image || '/placeholder-product.png'}
                                alt={item.name}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-ink truncate">{item.name}</p>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              <p className="text-sm font-semibold text-ink">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Total Breakdown */}
                      <div className="mt-4 bg-white rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-medium">
                            {order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between">
                          <span className="font-bold text-ink">Total</span>
                          <span className="font-bold text-xl text-ink">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping & Payment Info */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-ink mb-2 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-forest-600" />
                          Shipping Address
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.street}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-ink mb-2 flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-forest-600" />
                          Payment Method
                        </h4>
                        <p className="text-sm text-gray-600">
                          Credit Card ending in ••••
                        </p>
                      </div>

                      {order.estimatedDelivery && (
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-ink mb-2 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-forest-600" />
                            Delivery Information
                          </h4>
                          <p className="text-sm text-gray-600">
                            {order.status === 'delivered' ? 'Delivered on' : 'Estimated delivery'}:
                            <br />
                            <span className="font-medium">{formatDate(order.estimatedDelivery)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">No orders found with this status</p>
        </div>
      )}
    </div>
  );
};

