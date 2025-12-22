import React, { useState } from 'react';
import { CreditCard, MapPin, User, Mail, Phone, Lock, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { CartItem } from './ShoppingCart';

interface CheckoutFormProps {
  cartItems: CartItem[];
  total: number;
  onComplete: (orderData: OrderData) => void;
  onCancel: () => void;
}

export interface OrderData {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  billingAddress: {
    sameAsShipping: boolean;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  paymentInfo: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  cartItems,
  total,
  onComplete,
  onCancel
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<OrderData>({
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    billingAddress: {
      sameAsShipping: true
    },
    paymentInfo: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (section: keyof OrderData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    // Clear error when user starts typing
    if (errors[`${section}.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${field}`];
        return newErrors;
      });
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      // Validate customer info
      if (!formData.customerInfo.firstName.trim()) {
        newErrors['customerInfo.firstName'] = 'First name is required';
      }
      if (!formData.customerInfo.lastName.trim()) {
        newErrors['customerInfo.lastName'] = 'Last name is required';
      }
      if (!formData.customerInfo.email.trim()) {
        newErrors['customerInfo.email'] = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerInfo.email)) {
        newErrors['customerInfo.email'] = 'Invalid email format';
      }
      if (!formData.customerInfo.phone.trim()) {
        newErrors['customerInfo.phone'] = 'Phone number is required';
      }

      // Validate shipping address
      if (!formData.shippingAddress.street.trim()) {
        newErrors['shippingAddress.street'] = 'Street address is required';
      }
      if (!formData.shippingAddress.city.trim()) {
        newErrors['shippingAddress.city'] = 'City is required';
      }
      if (!formData.shippingAddress.state.trim()) {
        newErrors['shippingAddress.state'] = 'State is required';
      }
      if (!formData.shippingAddress.zipCode.trim()) {
        newErrors['shippingAddress.zipCode'] = 'ZIP code is required';
      }
    }

    if (stepNumber === 2) {
      // Validate payment info
      if (!formData.paymentInfo.cardholderName.trim()) {
        newErrors['paymentInfo.cardholderName'] = 'Cardholder name is required';
      }
      if (!formData.paymentInfo.cardNumber.trim()) {
        newErrors['paymentInfo.cardNumber'] = 'Card number is required';
      } else if (!/^\d{16}$/.test(formData.paymentInfo.cardNumber.replace(/\s/g, ''))) {
        newErrors['paymentInfo.cardNumber'] = 'Invalid card number';
      }
      if (!formData.paymentInfo.expiryDate.trim()) {
        newErrors['paymentInfo.expiryDate'] = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(formData.paymentInfo.expiryDate)) {
        newErrors['paymentInfo.expiryDate'] = 'Invalid format (MM/YY)';
      }
      if (!formData.paymentInfo.cvv.trim()) {
        newErrors['paymentInfo.cvv'] = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(formData.paymentInfo.cvv)) {
        newErrors['paymentInfo.cvv'] = 'Invalid CVV';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) {
        setStep((step + 1) as 1 | 2 | 3);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(step)) {
      onComplete(formData);
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Shipping' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'Review' }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step >= s.num
                    ? 'bg-forest-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.num ? <CheckCircle className="w-6 h-6" /> : s.num}
                </div>
                <span className="text-sm mt-2 font-medium text-gray-600">{s.label}</span>
              </div>
              {idx < 2 && (
                <div className={`flex-1 h-1 mx-4 transition-colors ${
                  step > s.num ? 'bg-forest-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Step 1: Shipping Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-ink mb-6 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-forest-600" />
                    Shipping Information
                  </h2>

                  {/* Customer Info */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg text-ink mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.customerInfo.firstName}
                          onChange={(e) => updateField('customerInfo', 'firstName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                            errors['customerInfo.firstName'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors['customerInfo.firstName'] && (
                          <p className="text-red-500 text-xs mt-1">{errors['customerInfo.firstName']}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={formData.customerInfo.lastName}
                          onChange={(e) => updateField('customerInfo', 'lastName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                            errors['customerInfo.lastName'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors['customerInfo.lastName'] && (
                          <p className="text-red-500 text-xs mt-1">{errors['customerInfo.lastName']}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            value={formData.customerInfo.email}
                            onChange={(e) => updateField('customerInfo', 'email', e.target.value)}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                              errors['customerInfo.email'] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {errors['customerInfo.email'] && (
                          <p className="text-red-500 text-xs mt-1">{errors['customerInfo.email']}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="tel"
                            value={formData.customerInfo.phone}
                            onChange={(e) => updateField('customerInfo', 'phone', e.target.value)}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                              errors['customerInfo.phone'] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {errors['customerInfo.phone'] && (
                          <p className="text-red-500 text-xs mt-1">{errors['customerInfo.phone']}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold text-lg text-ink mb-4">
                      Delivery Address
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.street}
                          onChange={(e) => updateField('shippingAddress', 'street', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                            errors['shippingAddress.street'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors['shippingAddress.street'] && (
                          <p className="text-red-500 text-xs mt-1">{errors['shippingAddress.street']}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            value={formData.shippingAddress.city}
                            onChange={(e) => updateField('shippingAddress', 'city', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                              errors['shippingAddress.city'] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors['shippingAddress.city'] && (
                            <p className="text-red-500 text-xs mt-1">{errors['shippingAddress.city']}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            value={formData.shippingAddress.state}
                            onChange={(e) => updateField('shippingAddress', 'state', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                              errors['shippingAddress.state'] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors['shippingAddress.state'] && (
                            <p className="text-red-500 text-xs mt-1">{errors['shippingAddress.state']}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            value={formData.shippingAddress.zipCode}
                            onChange={(e) => updateField('shippingAddress', 'zipCode', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                              errors['shippingAddress.zipCode'] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors['shippingAddress.zipCode'] && (
                            <p className="text-red-500 text-xs mt-1">{errors['shippingAddress.zipCode']}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-ink mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-forest-600" />
                  Payment Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.paymentInfo.cardholderName}
                        onChange={(e) => updateField('paymentInfo', 'cardholderName', e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                          errors['paymentInfo.cardholderName'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors['paymentInfo.cardholderName'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['paymentInfo.cardholderName']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number *
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formatCardNumber(formData.paymentInfo.cardNumber)}
                        onChange={(e) => updateField('paymentInfo', 'cardNumber', e.target.value.replace(/\s/g, ''))}
                        maxLength={19}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                          errors['paymentInfo.cardNumber'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    {errors['paymentInfo.cardNumber'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['paymentInfo.cardNumber']}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        value={formData.paymentInfo.expiryDate}
                        onChange={(e) => updateField('paymentInfo', 'expiryDate', formatExpiryDate(e.target.value))}
                        maxLength={5}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                          errors['paymentInfo.expiryDate'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="MM/YY"
                      />
                      {errors['paymentInfo.expiryDate'] && (
                        <p className="text-red-500 text-xs mt-1">{errors['paymentInfo.expiryDate']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.paymentInfo.cvv}
                          onChange={(e) => updateField('paymentInfo', 'cvv', e.target.value.replace(/\D/g, ''))}
                          maxLength={4}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-500 ${
                            errors['paymentInfo.cvv'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="123"
                        />
                      </div>
                      {errors['paymentInfo.cvv'] && (
                        <p className="text-red-500 text-xs mt-1">{errors['paymentInfo.cvv']}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Secure Payment</p>
                      <p>Your payment information is encrypted and secure. We never store your full card details.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-ink mb-6 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-forest-600" />
                  Review Your Order
                </h2>

                {/* Customer & Shipping Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-ink mb-2">Contact Information</h3>
                    <p className="text-sm text-gray-600">
                      {formData.customerInfo.firstName} {formData.customerInfo.lastName}<br />
                      {formData.customerInfo.email}<br />
                      {formData.customerInfo.phone}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-ink mb-2">Shipping Address</h3>
                    <p className="text-sm text-gray-600">
                      {formData.shippingAddress.street}<br />
                      {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-ink mb-2">Payment Method</h3>
                    <p className="text-sm text-gray-600">
                      •••• •••• •••• {formData.paymentInfo.cardNumber.slice(-4)}<br />
                      Expires {formData.paymentInfo.expiryDate}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-ink mb-3">Order Items ({cartItems.length})</h3>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium text-ink">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-forest-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-forest-700 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-forest-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-forest-700 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Place Order
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="font-display font-bold text-xl text-ink mb-4">
              Order Summary
            </h3>

            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 rounded bg-gray-100 flex-shrink-0">
                    <img
                      src={item.images[0] || '/placeholder-product.png'}
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold text-ink">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-2xl font-bold text-ink">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

