import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaShoppingCart, FaStar, FaRegStar, FaChevronLeft, FaChevronRight,
    FaBox, FaArrowRight, FaExclamationTriangle, FaSearch, FaTimes, FaTag,
    FaCheckCircle, FaHeart, FaRegHeart, FaTruck
} from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const Products = ({ isHomePage = false }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState({});
    const [imageErrors, setImageErrors] = useState({});
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const imageIntervalRefs = useRef({});
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist } = useWishlist();

    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchProductsAndCategories = async () => {
            try {
                setLoading(true);

                const [productsResponse, categoriesResponse] = await Promise.all([
                    fetch(`${backendUrl}/api/products`).then(res => res.json()),
                    fetch(`${backendUrl}/api/products/categories/all`).then(res => res.json())
                ]);

                let fetchedProducts = [];
                if (productsResponse.success) {
                    fetchedProducts = productsResponse.data.products || [];
                } else {
                    fetchedProducts = productsResponse || [];
                }

                // Sort by index (priority) first, then by creation date
                const sortedProducts = fetchedProducts.sort((a, b) => {
                    if (b.index !== a.index) {
                        return b.index - a.index;
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });

                setProducts(sortedProducts);

                // Show 12 items for home page on large devices, 6 on small devices
                if (isHomePage) {
                    const isLargeDevice = window.innerWidth >= 1024;
                    const homePageCount = isLargeDevice ? 12 : 6;
                    setFilteredProducts(sortedProducts.slice(0, homePageCount));
                } else {
                    setFilteredProducts(sortedProducts);
                }

                if (categoriesResponse.success) {
                    setCategories(categoriesResponse.data || []);
                } else {
                    setCategories(categoriesResponse || []);
                }

                // Initialize image indexes
                const initialIndexes = {};
                sortedProducts.forEach(product => {
                    initialIndexes[product._id] = 0;
                });
                setActiveImageIndex(initialIndexes);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProductsAndCategories();

        // Handle window resize for responsive product count
        const handleResize = () => {
            if (isHomePage && products.length > 0) {
                const isLargeDevice = window.innerWidth >= 1024;
                const homePageCount = isLargeDevice ? 12 : 6;
                setFilteredProducts(products.slice(0, homePageCount));
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            Object.values(imageIntervalRefs.current).forEach(interval => {
                clearInterval(interval);
            });
            window.removeEventListener('resize', handleResize);
        };
    }, [backendUrl, isHomePage]);

    useEffect(() => {
        if (isHomePage) {
            const isLargeDevice = window.innerWidth >= 1024;
            const homePageCount = isLargeDevice ? 12 : 6;
            setFilteredProducts(products.slice(0, homePageCount));
            return;
        }

        let results = products;

        // Search filter
        if (searchTerm) {
            results = results.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (typeof product.category === 'object' ? product.category.name : product.category)?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category filter
        if (selectedCategory !== 'All') {
            results = results.filter(product => {
                const categoryName = typeof product.category === 'object' ? product.category.name : product.category;
                return categoryName === selectedCategory;
            });
        }

        setFilteredProducts(results);
    }, [searchTerm, selectedCategory, products, isHomePage]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImageError = (productId, imageIndex) => {
        setImageErrors(prev => ({
            ...prev,
            [`${productId}-${imageIndex}`]: true
        }));
    };

    const startImageRotation = (productId, images) => {
        if (images.length <= 1) return;

        if (imageIntervalRefs.current[productId]) {
            clearInterval(imageIntervalRefs.current[productId]);
        }

        imageIntervalRefs.current[productId] = setInterval(() => {
            setActiveImageIndex(prev => ({
                ...prev,
                [productId]: (prev[productId] + 1) % images.length
            }));
        }, 3000);
    };

    const stopImageRotation = (productId) => {
        if (imageIntervalRefs.current[productId]) {
            clearInterval(imageIntervalRefs.current[productId]);
        }
    };

    const handlePrevImage = (productId, images, e) => {
        if (e) e.stopPropagation();
        setActiveImageIndex(prev => ({
            ...prev,
            [productId]: (prev[productId] - 1 + images.length) % images.length
        }));
        startImageRotation(productId, images);
    };

    const handleNextImage = (productId, images, e) => {
        if (e) e.stopPropagation();
        setActiveImageIndex(prev => ({
            ...prev,
            [productId]: (prev[productId] + 1) % images.length
        }));
        startImageRotation(productId, images);
    };

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e, productId, images) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e, productId, images) => {
        if (!touchStart || !touchEnd) return;

        const threshold = 50;
        const difference = touchStart - touchEnd;

        if (difference > threshold) {
            handleNextImage(productId, images);
        } else if (difference < -threshold) {
            handlePrevImage(productId, images);
        }

        setTouchStart(null);
        setTouchEnd(null);
    };

    const handleAddToCartClick = (product) => {
        if (!product.inStock) return;
        setSelectedProduct(product);
        setShowModal(true);
    };

    const confirmAddToCart = () => {
        if (!selectedProduct?._id) {
            console.warn('Invalid product: missing _id');
            return;
        }

        if (!selectedProduct.inStock) {
            setShowModal(false);
            return;
        }

        const salePrice = selectedProduct.isOnSale && selectedProduct.discountPercentage > 0
            ? (selectedProduct.price - (selectedProduct.price * selectedProduct.discountPercentage / 100)).toFixed(2)
            : selectedProduct.price;

        // Pass full product including shipping info so CartContext resolves the fee
        const item = {
            _id: selectedProduct._id,
            name: selectedProduct.name,
            title: selectedProduct.name,
            brand: selectedProduct.brand || '',
            sku: selectedProduct.sku || '',
            price: parseFloat(salePrice),
            image: selectedProduct.images?.[0]?.imageUrl || '/placeholder-product.jpg',
            images: selectedProduct.images || [],
            inStock: selectedProduct.inStock,
            stockQuantity: selectedProduct.stockQuantity || 0,
            // Pass shipping so CartContext resolves the fee
            shipping: selectedProduct.shipping || null,
        };

        addToCart(item);
        setShowModal(false);

        const cartButtons = document.querySelectorAll(`[data-product-id="${selectedProduct._id}"]`);
        cartButtons.forEach(button => {
            button.classList.add('animate-ping');
            setTimeout(() => {
                button.classList.remove('animate-ping');
            }, 500);
        });
    };

    const handleToggleWishlist = async (product, e) => {
        e.stopPropagation();
        e.preventDefault();

        try {
            const wasToggled = await toggleWishlist(product);
            const message = wasToggled
                ? `${product.name} added to wishlist!`
                : `${product.name} removed from wishlist!`;
            console.log(message);
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        }
    };

    const handleViewDetails = (productId, e) => {
        e.preventDefault();
        e.stopPropagation();
        scrollToTop();
        navigate(`/products/${productId}`);
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
    };

    const calculateSalePrice = (product) => {
        if (product.isOnSale && product.discountPercentage > 0) {
            return (product.price - (product.price * product.discountPercentage / 100)).toFixed(2);
        }
        return product.price.toFixed(2);
    };

    const renderStars = (count = 5) => {
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
        return Array(5).fill(0).map((_, i) => (
            i < rating ?
                <FaStar key={i} className="text-yellow-400 text-[10px]" /> :
                <FaRegStar key={i} className="text-yellow-400 text-[10px]" />
        ));
    };

    const categoryOptions = ['All', ...categories.map(cat => cat.name)];

    const handleProductClick = (productId) => {
        scrollToTop();
        navigate(`/products/${productId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-secondary mx-auto mb-2"></div>
                    <p className="text-gray-600 text-xs">Loading products...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-lg shadow-lg max-w-md">
                    <p className="font-bold mb-1 text-xs">Error</p>
                    <p className="text-xs">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <section className={`py-3 pt-2 mb-4 px-2 mt-8 sm:px-3 ${isHomePage ? 'bg-white' : 'bg-gray-50'}`}>
            {/* Add to Cart Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-2">
                    <div className="bg-white rounded-md p-3 max-w-md w-full shadow-2xl transform transition-all duration-300 animate-fadeIn">
                        <h3 className="text-sm font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-2">
                            Add to Cart
                        </h3>
                        <div className="flex gap-2 mb-2">
                            {selectedProduct?.images?.[0]?.imageUrl && (
                                <img
                                    src={selectedProduct.images[0].imageUrl}
                                    alt={selectedProduct.name}
                                    className="w-12 h-12 object-cover rounded"
                                />
                            )}
                            <div className="flex-1">
                                <p className="text-gray-700 text-xs font-medium mb-0.5">
                                    {selectedProduct?.name}
                                </p>
                                <p className="text-gray-600 text-[10px] mb-0.5">
                                    by {selectedProduct?.brand}
                                </p>
                                <p className="text-sm font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                                    GH₵ {calculateSalePrice(selectedProduct)}
                                </p>
                                {/* Show shipping cost in modal */}
                                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                    <FaTruck className="text-blue-500 text-[8px]" />
                                    {selectedProduct?.shipping?.isFreeShipping
                                        ? <span className="text-green-600">Free shipping</span>
                                        : selectedProduct?.shipping?.shippingCost > 0
                                            ? <span>Shipping: <span className="font-medium text-secondary">GH₵ {selectedProduct.shipping.shippingCost.toFixed(2)}</span></span>
                                            : <span className="text-green-600">Free shipping</span>
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-1.5">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-2 py-1 border border-secondary text-secondary rounded hover:bg-secondary/10 transition-colors duration-300 text-[10px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAddToCart}
                                className="px-2 py-1 bg-gradient-to-r from-secondary to-primary text-white rounded hover:opacity-90 transition-all duration-300 shadow text-[10px]"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header for home page */}
            {isHomePage && (
                <div className="text-center pt-1 mb-3">
                    <h2 className="text-base lg:text-lg font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                        Featured Products
                    </h2>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-secondary mx-auto mt-0.5 rounded"></div>
                    <p className="mt-1 text-gray-600 text-[10px] max-w-2xl mx-auto">
                        Discover our curated collection
                    </p>
                </div>
            )}

            {/* Header for main page */}
            {!isHomePage && (
                <div className="text-center pt-4 mb-3 mt-12">
                    <h1 className="text-base lg:text-lg mb-1 font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                        Our Products
                    </h1>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-secondary mx-auto mt-0.5 rounded"></div>
                    <p className="mt-1 text-gray-600 text-[10px] max-w-2xl mx-auto">
                        Explore our quality products
                    </p>
                </div>
            )}

            {/* Filters - Only show on main page */}
            {!isHomePage && (
                <div className="max-w-7xl mx-auto mb-3">
                    <div className="bg-white rounded-md shadow p-2 hover:shadow-sm transition-all duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                            {/* Search */}
                            <div className="relative lg:col-span-2">
                                <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                    <FaSearch className="text-gray-400 text-[10px]" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full border border-gray-300 rounded py-1 pl-6 pr-2 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-transparent transition-all duration-300 text-[10px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Category Dropdown */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                    <FaTag className="text-gray-400 text-[10px]" />
                                </div>
                                <select
                                    className="w-full border border-gray-300 rounded py-1 pl-6 pr-4 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-transparent transition-all duration-300 text-[10px] appearance-none bg-white"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {categoryOptions.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-secondary text-[10px] font-medium">
                                {filteredProducts.length} of {products.length} products
                            </span>
                            <button
                                onClick={clearAllFilters}
                                className="text-[10px] text-gray-500 hover:text-secondary flex items-center gap-0.5 transition-colors"
                            >
                                <FaTimes className="text-[8px]" />
                                Clear filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-6">
                        <FaBox className="mx-auto text-xl text-gray-400 mb-1" />
                        <h3 className="text-sm font-bold text-secondary mb-0.5">No products found</h3>
                        <p className="text-gray-600 text-[10px] mb-1.5">Try adjusting your search</p>
                        {!isHomePage && (
                            <button
                                onClick={clearAllFilters}
                                className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-secondary to-primary text-white rounded hover:opacity-90 transition-all duration-300 shadow text-[10px]"
                            >
                                <FaTimes className="mr-0.5 text-[8px]" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`grid ${isHomePage
                        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6'
                        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'} gap-2`}>
                        {filteredProducts.map(product => {
                            const currentImageIndex = activeImageIndex[product._id] || 0;
                            const productImages = product.images || [];

                            if (productImages.length === 0) {
                                productImages.push({ imageUrl: '/placeholder-product.jpg' });
                            }

                            const currentImage = productImages[currentImageIndex];
                            const hasMultipleImages = productImages.length > 1;
                            const categoryName = typeof product.category === 'object' ? product.category.name : product.category;
                            const salePrice = calculateSalePrice(product);
                            const isOutOfStock = !product.inStock;

                            return (
                                <div
                                    key={product._id}
                                    onClick={() => handleProductClick(product._id)}
                                    className="bg-white rounded-md shadow-sm overflow-hidden hover:shadow transition-all duration-300 group relative block cursor-pointer"
                                    onMouseEnter={() => startImageRotation(product._id, productImages)}
                                    onMouseLeave={() => stopImageRotation(product._id)}
                                >
                                    {/* Badges Container */}
                                    <div className="absolute top-0.5 left-0.5 z-10 flex flex-col gap-0.5">
                                        {product.isOnSale && product.discountPercentage > 0 && (
                                            <div className="mb-0.5">
                                                <div className="inline-flex items-center px-1.5 py-0.5 bg-green-50 border border-green-200 rounded-full">
                                                    <FaCheckCircle className="text-green-600 mr-0.5 text-[8px] lg:text-[10px]" />
                                                    <span className="text-green-700 font-medium text-[8px] lg:text-[10px]">
                                                        Save GH₵ {(product.price - parseFloat(salePrice)).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Stock Indicator */}
                                        {product.inStock ? (
                                            <div className="mb-0.5">
                                                {product.stockQuantity <= product.lowStockThreshold ? (
                                                    <div className="inline-flex items-center px-1.5 py-0.5 bg-orange-50 border border-orange-200 rounded-full">
                                                        <FaExclamationTriangle className="text-orange-600 mr-0.5 text-[8px] lg:text-[10px]" />
                                                        <span className="text-orange-700 font-medium text-[8px] lg:text-[10px]">
                                                            Only {product.stockQuantity} left
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center px-1.5 py-0.5 bg-green-50 border border-green-200 rounded-full">
                                                        <FaCheckCircle className="text-green-600 mr-0.5 text-[8px] lg:text-[10px]" />
                                                        <span className="text-green-700 font-medium text-[8px] lg:text-[10px]">
                                                            In Stock
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mb-0.5">
                                                <div className="inline-flex items-center px-1.5 py-0.5 bg-red-50 border border-red-200 rounded-full">
                                                    <FaExclamationTriangle className="text-red-600 mr-0.5 text-[8px] lg:text-[10px]" />
                                                    <span className="text-red-700 font-medium text-[8px] lg:text-[10px]">
                                                        Out of Stock
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Wishlist Button */}
                                    <div className="absolute top-0.5 right-0.5 z-10">
                                        <button
                                            onClick={(e) => handleToggleWishlist(product, e)}
                                            className="bg-white/90 backdrop-blur-sm rounded-full p-1 hover:bg-white transition-all duration-300 shadow-sm transform hover:scale-110"
                                        >
                                            {isInWishlist(product._id) ? (
                                                <FaHeart className="text-red-500 text-[10px] lg:text-[12px]" />
                                            ) : (
                                                <FaRegHeart className="text-gray-600 text-[10px] lg:text-[12px]" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Product Image */}
                                    <div className="relative overflow-hidden aspect-[1/1]">
                                        <div
                                            className="relative h-full w-full"
                                            onTouchStart={handleTouchStart}
                                            onTouchMove={(e) => handleTouchMove(e, product._id, productImages)}
                                            onTouchEnd={(e) => handleTouchEnd(e, product._id, productImages)}
                                        >
                                            {productImages.map((image, idx) => {
                                                const errorKey = `${product._id}-${idx}`;
                                                const hasError = imageErrors[errorKey];

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                                                    >
                                                        {hasError ? (
                                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                                                <div className="text-center text-secondary">
                                                                    <FaBox className="text-sm mb-0.5 mx-auto" />
                                                                    <p className="text-[8px] font-medium">Product Image</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={image.imageUrl}
                                                                alt={image.altText || product.name}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                                onError={() => handleImageError(product._id, idx)}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Navigation arrows */}
                                        {hasMultipleImages && (
                                            <>
                                                <button
                                                    onClick={(e) => handlePrevImage(product._id, productImages, e)}
                                                    className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-0.5 text-secondary hover:bg-secondary hover:text-white transition-all duration-300 shadow-sm z-10"
                                                    aria-label="Previous image"
                                                >
                                                    <FaChevronLeft size={6} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleNextImage(product._id, productImages, e)}
                                                    className="absolute right-0.5 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-0.5 text-secondary hover:bg-secondary hover:text-white transition-all duration-300 shadow-sm z-10"
                                                    aria-label="Next image"
                                                >
                                                    <FaChevronRight size={6} />
                                                </button>
                                            </>
                                        )}

                                        {/* Image indicators */}
                                        {hasMultipleImages && (
                                            <div className="absolute bottom-0.5 left-0 right-0 flex justify-center space-x-0.5 z-10">
                                                {productImages.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setActiveImageIndex(prev => ({
                                                                ...prev,
                                                                [product._id]: idx
                                                            }));
                                                        }}
                                                        className={`w-1 h-1 rounded-full transition-all ${idx === currentImageIndex
                                                            ? 'bg-secondary scale-125'
                                                            : 'bg-white/50'}`}
                                                        aria-label={`Go to image ${idx + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Out of stock overlay */}
                                        {isOutOfStock && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                                    Out of Stock
                                                </div>
                                            </div>
                                        )}

                                        {/* Free Shipping Badge */}
                                        {product.shipping?.isFreeShipping && (
                                            <div className="absolute bottom-0.5 right-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full shadow-sm flex items-center">
                                                <FaTruck className="mr-0.5" size={4} />
                                                Free Ship
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-1.5">
                                        {/* Category Badge */}
                                        {categoryName && (
                                            <span className="inline-block text-[9px] text-secondary bg-secondary/10 px-1 py-0.5 rounded-full mb-0.5">
                                                {categoryName}
                                            </span>
                                        )}

                                        {/* Product Name */}
                                        <h3 className="text-[13px] font-bold text-gray-700 line-clamp-2 min-h-[1.5rem] mb-0.5" title={product.name}>
                                            {product.name}
                                        </h3>

                                        {/* Price Section */}
                                        <div className="mb-0.5">
                                            {product.isOnSale && product.discountPercentage > 0 ? (
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[12px] font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                                                            GH₵ {salePrice}
                                                        </span>
                                                        <span className="text-[9px] text-gray-500 line-through">
                                                            GH₵ {product.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[12px] font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                                                    GH₵ {product.price.toFixed(2)}
                                                </div>
                                            )}
                                            {/* Shipping line on product card */}
                                            <div className="flex items-center gap-0.5 mt-0.5">
                                                <FaTruck className="text-blue-500 text-[8px]" />
                                                {product.shipping?.isFreeShipping ? (
                                                    <span className="text-[9px] text-green-600 font-medium">Free shipping</span>
                                                ) : product.shipping?.shippingCost > 0 ? (
                                                    <span className="text-[9px] text-gray-500">+GH₵{product.shipping.shippingCost.toFixed(2)} ship</span>
                                                ) : (
                                                    <span className="text-[9px] text-green-600 font-medium">Free shipping</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* View Details Button */}
                                        <button
                                            onClick={(e) => handleViewDetails(product._id, e)}
                                            className="text-[9px] text-secondary mb-1 hover:text-primary font-medium flex items-center justify-between w-full group/link"
                                        >
                                            <span>View details</span>
                                            <FaArrowRight className="text-[8px] group-hover/link:translate-x-0.5 transition-transform" />
                                        </button>

                                        {/* Add to Cart Button */}
                                        <button
                                            data-product-id={product._id}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleAddToCartClick(product);
                                            }}
                                            disabled={isOutOfStock}
                                            className={`w-full py-[3px] rounded-lg font-medium flex items-center justify-center space-x-0.5 transition-all duration-300 md:text-[12px] text-[11px] ${isOutOfStock
                                                ? 'bg-red-500 cursor-not-allowed text-white shadow-sm'
                                                : 'bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary text-white shadow-sm hover:shadow transform hover:scale-[1.02] active:scale-95'
                                                }`}
                                        >
                                            <FaShoppingCart className="text-[10px]" />
                                            <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* View All Products Link for Home Page */}
            {isHomePage && filteredProducts.length > 0 && (
                <div className="text-center mt-4 lg:mt-6">
                    <Link
                        to="/products"
                        onClick={scrollToTop}
                        className="inline-flex items-center justify-center px-4 py-2 lg:px-5 lg:py-2.5 bg-gradient-to-r from-secondary to-primary text-white rounded-lg hover:opacity-90 transition-all duration-300 shadow-sm transform hover:scale-105 text-xs lg:text-sm font-medium"
                    >
                        View All Products
                        <FaArrowRight className="ml-1.5 lg:ml-2 text-[10px] lg:text-[12px]" />
                    </Link>
                </div>
            )}
        </section>
    );
};

export default Products;