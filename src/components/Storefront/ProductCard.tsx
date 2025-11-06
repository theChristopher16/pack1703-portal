import React from 'react';
import { ShoppingCart, Heart, Star, Info } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  inStock: boolean;
  stockCount?: number;
  rating?: number;
  reviewCount?: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onViewDetails 
}) => {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(0);

  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.images[selectedImage] || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {!product.inStock && (
            <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isFavorite 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-gray-700 hover:bg-red-50'
            }`}
            aria-label="Add to favorites"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => onViewDetails(product)}
            className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-blue-50 backdrop-blur-sm transition-colors"
            aria-label="View details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Image Thumbnails */}
        {product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
            {product.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  selectedImage === idx 
                    ? 'bg-white w-6' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs font-medium text-forest-600 uppercase tracking-wider mb-2">
          {product.category}
        </p>

        {/* Name */}
        <h3 className="font-display font-semibold text-lg text-ink mb-2 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating!)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}

        {/* Variants */}
        {(product.sizes || product.colors) && (
          <div className="flex gap-3 mb-3 text-xs text-gray-600">
            {product.sizes && (
              <span>Sizes: {product.sizes.join(', ')}</span>
            )}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1">
                <span>Colors:</span>
                <div className="flex gap-1">
                  {product.colors.slice(0, 3).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                  {product.colors.length > 3 && (
                    <span className="text-gray-500">+{product.colors.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink">
                ${product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-gray-400 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
            {product.stockCount !== undefined && product.stockCount < 10 && product.inStock && (
              <span className="text-xs text-orange-600 font-medium mt-1">
                Only {product.stockCount} left!
              </span>
            )}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              product.inStock
                ? 'bg-forest-600 text-white hover:bg-forest-700 hover:shadow-lg active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

