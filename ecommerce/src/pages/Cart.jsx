import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaTimes, FaTrash, FaShoppingCart, FaChevronRight, FaChevronDown,
    FaChevronUp, FaMobileAlt, FaCreditCard, FaUniversity, FaCheck,
    FaExclamationTriangle, FaInfoCircle, FaTruck, FaUser,
    FaSignInAlt, FaUserPlus, FaEye, FaEyeSlash, FaLock, FaShieldAlt
} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Utility function to safely format prices
const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toFixed(2);
};

// Utility function to safely calculate item total
const calculateItemTotal = (price, quantity) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    const numQuantity = Number(quantity);
    if (isNaN(numPrice) || isNaN(numQuantity)) return 0;
    return numPrice * numQuantity;
};

// Error Notification Component
const ErrorNotification = ({ message, onClose }) => (
    <div className="fixed top-4 right-4 z-50 max-w-md w-[90vw]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg animate-fadeIn">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <FaExclamationTriangle className="text-red-600 text-lg" />
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-red-800 font-medium text-xs">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 text-red-400 hover:text-red-600 transition-colors duration-200"
                >
                    <FaTimes className="text-xs" />
                </button>
            </div>
        </div>
    </div>
);

// Loading Skeleton Component
const LoadingSkeleton = () => (
    <div className="animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-3">
                        <div className="flex gap-2">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1">
                                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                                <div className="h-2 bg-gray-200 rounded w-20 mb-1"></div>
                                <div className="h-2 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-8 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Modal Component
const Modal = ({ isOpen, onClose, children, className = "" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            ></div>
            <div className={`relative bg-white rounded-lg shadow-xl transform transition-all duration-300 scale-100 w-[90vw] max-w-sm ${className}`}>
                {children}
            </div>
        </div>
    );
};

// Payment Loading Component
const PaymentLoading = ({ stage, paymentMethod }) => {
    const stages = {
        initiating: "Initiating payment...",
        processing: "Processing payment...",
        verifying: "Verifying transaction...",
        completing: "Completing order..."
    };

    return (
        <div className="text-center p-4">
            <div className="relative mb-3">
                <div className="w-12 h-12 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                    <div className="flex space-x-1">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-1 h-1 rounded-full bg-gradient-to-r from-secondary to-primary"
                                style={{
                                    animation: `wave 1.4s ease-in-out infinite`,
                                    animationDelay: `${i * 0.15}s`
                                }}
                            ></div>
                        ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {paymentMethod === 'momo' && <FaMobileAlt className="text-lg text-secondary" />}
                        {paymentMethod === 'card' && <FaCreditCard className="text-lg text-secondary" />}
                        {paymentMethod === 'bank' && <FaUniversity className="text-lg text-secondary" />}
                    </div>
                </div>
            </div>
            <h3 className="text-sm font-semibold text-secondary mb-1">{stages[stage] || "Processing payment..."}</h3>
            <p className="text-gray-600 text-xs">Please wait while we process your payment securely.</p>
        </div>
    );
};

// Success Component
const PaymentSuccess = ({ onClose, orderNumber, isGuest }) => (
    <div className="text-center p-4">
        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow">
            <FaCheck className="text-xl text-green-600" />
        </div>
        <h3 className="text-base font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-2">
            🎉 Order Successful!
        </h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
            <p className="text-green-800 font-medium mb-1 text-xs">Your product order has been confirmed!</p>
            <p className="text-green-700 text-[10px]">
                ✓ Payment received<br />
                ✓ Order confirmed<br />
                {!isGuest && "✓ Receipt sent to your email"}
            </p>
            {orderNumber && (
                <p className="text-green-800 font-bold text-xs mt-1">
                    Order #: {orderNumber}
                </p>
            )}
        </div>

        {isGuest ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                <p className="text-yellow-800 text-xs">
                    <strong>Guest Order:</strong> Save your order number to track your order.
                    Consider creating an account to track orders easily.
                </p>
            </div>
        ) : (
            <p className="text-gray-600 mb-3 text-xs">
                A payment receipt and order confirmation has been sent to your email address.
            </p>
        )}

        <div className="flex gap-2">
            <button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-secondary to-primary text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity duration-300 font-medium text-xs"
            >
                Continue Shopping
            </button>
            {isGuest && (
                <Link
                    to="/user/register"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity duration-300 font-medium text-xs flex items-center justify-center"
                >
                    <FaUserPlus className="mr-1" />
                    Create Account
                </Link>
            )}
        </div>
    </div>
);

// Login Prompt Component
const LoginPrompt = ({ onLogin, onContinueAsGuest, onClose }) => (
    <div className="text-center p-4">
        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow">
            <FaUser className="text-xl text-blue-600" />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-2">Create Account or Continue as Guest</h3>

        <div className="space-y-3 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                <h4 className="font-semibold text-blue-800 text-sm mb-1 flex items-center">
                    <FaShieldAlt className="mr-1" />
                    Benefits of Creating an Account:
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>✓ Track your order status</li>
                    <li>✓ View order history</li>
                    <li>✓ Faster checkout next time</li>
                    <li>✓ Save multiple addresses</li>
                    <li>✓ Earn loyalty points</li>
                </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">Guest Checkout:</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                    <li>✓ Quick checkout without account</li>
                    <li>✓ Save your order number to track</li>
                    <li>✓ You can create account later</li>
                </ul>
            </div>
        </div>

        <div className="space-y-2">
            <button
                onClick={onLogin}
                className="w-full bg-gradient-to-r from-secondary to-primary text-white py-2 rounded-lg hover:opacity-90 transition-opacity duration-300 font-semibold flex items-center justify-center gap-2"
            >
                <FaSignInAlt />
                Login / Create Account
            </button>

            <button
                onClick={onContinueAsGuest}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-300 font-medium flex items-center justify-center gap-2"
            >
                <FaUser />
                Continue as Guest
            </button>

            <button
                onClick={onClose}
                className="w-full text-gray-500 py-2 rounded-lg hover:text-gray-700 transition-colors duration-300 text-sm"
            >
                Continue Shopping
            </button>
        </div>
    </div>
);

const ProductCart = () => {
    const { cart, removeFromCart, updateQuantity, cartSubtotal, shippingTotal, cartTotal, clearCart, hasOutOfStockItems } = useCart();
    const { user, isAuthenticated, login } = useUser();
    const navigate = useNavigate();

    const [customerName, setCustomerName] = useState(user?.name || '');
    const [customerEmail, setCustomerEmail] = useState(user?.email || '');
    const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [additionalMessage, setAdditionalMessage] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
    const [loading, setLoading] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPaymentLoading, setShowPaymentLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentStage, setPaymentStage] = useState('initiating');
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const [paystackLoaded, setPaystackLoaded] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [continueAsGuest, setContinueAsGuest] = useState(false);
    const [successOrderNumber, setSuccessOrderNumber] = useState('');

    useEffect(() => {
        // Pre-fill user data if logged in
        if (isAuthenticated && user) {
            setCustomerName(user.name || '');
            setCustomerEmail(user.email || '');
            setCustomerPhone(user.phone || '');
        }

        // Prevent zoom on focus for iOS
        const preventZoom = () => {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        };

        preventZoom();

        // Load Paystack script
        const loadPaystackScript = () => {
            return new Promise((resolve, reject) => {
                if (window.PaystackPop) {
                    setPaystackLoaded(true);
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://js.paystack.co/v1/inline.js';
                script.async = true;

                script.onload = () => {
                    setPaystackLoaded(true);
                    resolve();
                };

                script.onerror = () => {
                    reject(new Error('Failed to load Paystack script'));
                };

                document.head.appendChild(script);
            });
        };

        loadPaystackScript().catch(error => {
            console.error('Paystack script loading error:', error);
            showErrorNotification('Payment service is temporarily unavailable. Please try again later.');
        });

        return () => {
            // Reset viewport on unmount
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        };
    }, [isAuthenticated, user]);

    const showErrorNotification = (message) => {
        setErrorMessage(message);
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
    };

    const handleCheckout = async () => {
        if (!customerName.trim()) {
            showErrorNotification('Please enter your full name.');
            return;
        }

        if (customerEmail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(customerEmail)) {
            showErrorNotification('Please enter a valid email address.');
            return;
        }

        if (customerPhone && !/^0\d{9}$/.test(customerPhone)) {
            showErrorNotification('Please enter a valid Ghanaian phone number (e.g., 0241234567).');
            return;
        }

        if (!deliveryDate || deliveryDate < new Date()) {
            showErrorNotification('Please select a valid future delivery date.');
            return;
        }

        if (hasOutOfStockItems) {
            showErrorNotification('Some items in your cart are out of stock. Please remove them before proceeding.');
            return;
        }

        if (!isAuthenticated && !continueAsGuest) {
            setShowLoginPrompt(true);
            return;
        }

        setShowPaymentModal(true);
    };

    const handleLogin = () => {
        setShowLoginPrompt(false);
        navigate('/user/login', {
            state: {
                returnUrl: '/cart',
                prefillData: {
                    name: customerName,
                    email: customerEmail,
                    phone: customerPhone
                }
            }
        });
    };

    const handleContinueAsGuest = () => {
        setContinueAsGuest(true);
        setShowLoginPrompt(false);
        setShowPaymentModal(true);
    };

    const handlePayment = async (method) => {
        if (!paystackLoaded) {
            showErrorNotification('Payment service is still loading. Please wait a moment and try again.');
            return;
        }

        setPaymentMethod(method);
        setShowPaymentModal(false);
        setShowPaymentLoading(true);
        setPaymentStage('initiating');
        setLoading(true);

        try {
            const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

            // Use the grand total (subtotal + shipping) from context
            const finalAmount = cartTotal;

            const orderPayload = {
                customer: {
                    name: customerName.trim(),
                    email: customerEmail.trim() || '',
                    phone: customerPhone.trim() || '',
                    address: JSON.stringify({
                        street: deliveryAddress || '',
                        city: '',
                        region: '',
                        country: 'Ghana',
                        postalCode: ''
                    }),
                    additionalMessage: additionalMessage || ''
                },
                items: cart.map(item => {
                    const productName = item.name || item.title || item.productName || 'Product';
                    return {
                        product: item._id,
                        name: productName,
                        brand: item.brand || '',
                        sku: item.sku || '',
                        price: typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price),
                        quantity: Number(item.quantity),
                        image: JSON.stringify(typeof item.image === 'string'
                            ? { imageUrl: item.image, altText: productName }
                            : item.image || { imageUrl: '', altText: productName }),
                        discount: item.discount || 0,
                        subtotal: calculateItemTotal(item.price, item.quantity),
                        shippingFee: item.shippingFee || 0,
                    };
                }),
                pricing: {
                    subtotal: cartSubtotal,
                    discount: 0,
                    shipping: shippingTotal,
                    tax: 0,
                    total: finalAmount
                },
                shippingAddress: JSON.stringify({
                    fullName: customerName.trim(),
                    phone: customerPhone.trim() || '',
                    street: deliveryAddress || '',
                    city: '',
                    region: '',
                    country: 'Ghana',
                    postalCode: '',
                    isDefault: false
                }),
                deliveryDate: {
                    expected: deliveryDate.toISOString()
                },
                payment: {
                    method: method,
                    status: 'pending'
                },
                notes: {
                    customer: additionalMessage || '',
                    internal: ''
                },
                user: isAuthenticated ? user._id : null
            };

            console.log('Creating order with payload:', orderPayload);

            const orderResponse = await axios.post(`${backendUrl}/api/orders`, orderPayload);

            if (!orderResponse.data.success) {
                throw new Error(orderResponse.data.message || 'Failed to create order');
            }

            const order = orderResponse.data.data;
            const orderId = order._id;
            const orderNumber = order.orderNumber;

            console.log('Order created successfully:', { orderId, orderNumber });

            if (!orderId) throw new Error('Order ID not received from server');

            setPaymentStage('processing');
            setSuccessOrderNumber(orderNumber);

            const paymentPayload = {
                orderId: orderId,
                amount: finalAmount,
                email: customerEmail.trim() || 'customer@ghanachinaplug.com',
                phone: customerPhone.trim() || '',
                method: method,
                callbackUrl: `${window.location.origin}/payment/callback`
            };

            console.log('Initiating payment with payload:', paymentPayload);

            const paymentResponse = await axios.post(
                `${backendUrl}/api/payments/initiate`,
                paymentPayload
            );

            if (!paymentResponse.data.success) {
                throw new Error(paymentResponse.data.message || 'Payment initialization failed');
            }

            const { authorization_url, access_code, reference } = paymentResponse.data.data;

            console.log('Payment initialized:', { reference, access_code });

            if (!reference) {
                throw new Error('Payment reference not received from server');
            }

            setPaymentStage('verifying');

            if (!window.PaystackPop || !window.PaystackPop.setup) {
                throw new Error('Payment service is not available. Please refresh the page and try again.');
            }

            const handler = window.PaystackPop.setup({
                key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
                email: customerEmail.trim() || 'customer@ghanachinaplug.com',
                amount: Math.round(finalAmount * 100), // Convert to pesewas
                currency: 'GHS',
                ref: reference,
                callback: function (response) {
                    (async function () {
                        try {
                            setPaymentStage('completing');
                            console.log('Payment callback received:', response);

                            const verificationResponse = await axios.get(
                                `${backendUrl}/api/payments/verify/${response.reference}`
                            );

                            console.log('Payment verified:', verificationResponse.data);

                            if (verificationResponse.data.success && verificationResponse.data.status === 'success') {
                                setShowPaymentLoading(false);
                                setShowPaymentSuccess(true);
                                clearCart();

                                setCustomerName('');
                                setCustomerEmail('');
                                setCustomerPhone('');
                                setDeliveryAddress('');
                                setAdditionalMessage('');
                                setDeliveryDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
                                setContinueAsGuest(false);
                            } else {
                                throw new Error('Payment verification failed');
                            }

                        } catch (error) {
                            console.error('Verification error:', error);
                            setShowPaymentLoading(false);
                            showErrorNotification(
                                error.response?.data?.message ||
                                'Payment completed but verification failed. Please contact support with reference: ' + response.reference
                            );
                        }
                        setLoading(false);
                    })();
                },
                onClose: function () {
                    console.log('Payment popup closed');
                    setShowPaymentLoading(false);
                    setLoading(false);
                    showErrorNotification('Payment was cancelled. Your order has been saved and you can complete payment later.');
                }
            });

            handler.openIframe();

        } catch (error) {
            console.error('Payment error:', error);
            let errorMsg = 'Payment initialization failed. Please try again.';

            if (error.code === 'ERR_NETWORK') {
                errorMsg = 'Network error. Please check your connection and try again.';
            } else if (error.code === 'ERR_CONNECTION_REFUSED') {
                errorMsg = 'Cannot connect to server. Please ensure the server is running.';
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.message) {
                errorMsg = error.message;
            }

            showErrorNotification(errorMsg);
            setShowPaymentLoading(false);
            setLoading(false);
        }
    };

    const confirmRemove = (itemId) => setShowRemoveConfirm(itemId);
    const cancelRemove = () => setShowRemoveConfirm(null);
    const proceedRemove = (itemId) => {
        removeFromCart(itemId);
        setShowRemoveConfirm(null);
    };

    const handleClearCart = () => setShowClearConfirm(true);
    const proceedClearCart = () => {
        clearCart();
        setShowClearConfirm(false);
    };

    const handlePaymentSuccessClose = () => {
        setShowPaymentSuccess(false);
        window.location.href = '/products';
    };

    if (loading && !showPaymentLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-3 px-2">
                <div className="max-w-6xl mx-auto">
                    <LoadingSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen mt-8 bg-gradient-to-b from-gray-50 to-gray-100 py-3 px-2">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-3 mt-4 pt-12">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-1">
                        Your Shopping Cart
                    </h1>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-secondary to-primary mx-auto rounded-full"></div>
                    <p className="mt-1 text-gray-600 text-xs">
                        {isAuthenticated ? `Welcome back, ${user.name}!` : 'Review your items and proceed to checkout'}
                    </p>

                    {isAuthenticated ? (
                        <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mt-1">
                            <FaCheck className="text-[10px]" />
                            Signed In • Track Your Orders
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs mt-1">
                            <FaInfoCircle className="text-[10px]" />
                            Guest Checkout • Save Order Number to Track
                        </div>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                            <FaShoppingCart className="text-xl text-secondary" />
                        </div>
                        <h2 className="text-base font-bold text-secondary mb-1">Your cart is empty</h2>
                        <p className="text-gray-600 mb-3 text-xs">
                            Discover amazing products in our collection
                        </p>
                        <a
                            href="/products"
                            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-secondary to-primary text-white rounded-lg hover:opacity-90 transition-all duration-300 shadow transform hover:scale-105 text-xs font-medium"
                        >
                            <FaShoppingCart className="mr-1 text-[10px]" />
                            Browse Products
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-2">
                            {/* Cart Summary Header */}
                            <div className="bg-gradient-to-r from-secondary to-primary text-white rounded-lg p-3 shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            <FaShoppingCart className="text-sm" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-sm">{cart.length} {cart.length === 1 ? 'Item' : 'Items'}</h2>
                                            <p className="text-[10px] text-white/80">
                                                {isAuthenticated ? 'Trackable in your account' : 'Save order number to track'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-white/80">Total</p>
                                        <p className="text-base font-bold">GH₵{formatPrice(cartTotal)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Out of Stock Warning */}
                            {hasOutOfStockItems && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                    <div className="flex items-center gap-2">
                                        <FaExclamationTriangle className="text-red-500 text-sm" />
                                        <div>
                                            <p className="text-red-800 font-medium text-xs">Some items are out of stock</p>
                                            <p className="text-red-700 text-[10px]">Please remove out-of-stock items to proceed</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cart Items List */}
                            {cart.map(item => {
                                const itemTotal = calculateItemTotal(item.price, item.quantity);
                                const displayImage = typeof item.image === 'string'
                                    ? item.image
                                    : item.image?.imageUrl || '';
                                const displayName = item.name || item.title || 'Product';
                                const isOutOfStock = item.inStock === false || (item.stockQuantity > 0 && item.quantity > item.stockQuantity);

                                return (
                                    <div key={item._id} className={`bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300 p-2 border ${isOutOfStock ? 'border-red-200 bg-red-50' : 'border-gray-100'} group`}>
                                        <div className="flex gap-2">
                                            {/* Product Image */}
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={displayImage}
                                                    alt={displayName}
                                                    className="w-12 h-12 object-cover rounded-lg border border-gray-200 group-hover:border-secondary transition-colors duration-300 shadow-sm"
                                                />
                                                {isOutOfStock && (
                                                    <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                                                        <span className="bg-red-500 text-white text-[8px] px-1 rounded">Out of Stock</span>
                                                    </div>
                                                )}
                                                {/* Remove Button - Mobile */}
                                                <button
                                                    onClick={() => confirmRemove(item._id)}
                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors lg:hidden"
                                                >
                                                    <FaTimes className="text-[8px]" />
                                                </button>
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-secondary text-xs mb-0.5 line-clamp-2 group-hover:text-primary transition-colors">
                                                        {displayName}
                                                    </h3>
                                                    <div className="flex items-center gap-1 mb-0.5">
                                                        <span className="text-sm font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                                                            GH₵{formatPrice(item.price)}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">per item</span>
                                                    </div>
                                                    {/* Shipping fee indicator per item */}
                                                    <div className="flex items-center gap-1">
                                                        <FaTruck className="text-[8px] text-blue-500" />
                                                        <span className="text-[10px] text-gray-500">
                                                            {item.isFreeShipping || item.shippingFee === 0
                                                                ? <span className="text-green-600 font-medium">Free shipping</span>
                                                                : <span>Shipping: <span className="font-medium text-secondary">GH₵{formatPrice(item.shippingFee)}</span></span>
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity Controls & Total */}
                                                <div className="flex items-center justify-between gap-2 mt-1">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center border border-gray-200 hover:border-secondary rounded-lg overflow-hidden transition-colors duration-300">
                                                        <button
                                                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                            className="px-1.5 py-1 bg-gray-50 hover:bg-secondary hover:text-white text-secondary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:text-secondary text-[10px]"
                                                        >
                                                            <FaChevronDown className="text-[8px]" />
                                                        </button>
                                                        <span className="px-2 py-1 font-bold text-secondary text-xs min-w-[30px] text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                            disabled={isOutOfStock}
                                                            className="px-1.5 py-1 bg-gray-50 hover:bg-secondary hover:text-white text-secondary transition-all duration-300 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <FaChevronUp className="text-[8px]" />
                                                        </button>
                                                    </div>

                                                    {/* Item Total & Remove */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-500">Subtotal</p>
                                                            <p className="text-xs font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                                                                GH₵{formatPrice(itemTotal)}
                                                            </p>
                                                        </div>
                                                        {/* Remove Button - Desktop */}
                                                        <button
                                                            onClick={() => confirmRemove(item._id)}
                                                            className="hidden lg:flex w-6 h-6 items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 rounded transition-all duration-300"
                                                        >
                                                            <FaTrash className="text-[10px]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Clear Cart Button */}
                            <div className="bg-white rounded-lg p-2 border border-gray-100 text-center">
                                <button
                                    onClick={handleClearCart}
                                    className="text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded flex items-center gap-1 mx-auto transition-all duration-300 font-medium text-xs border border-red-500"
                                >
                                    <FaTrash className="text-[10px]" />
                                    Clear Entire Cart
                                </button>
                            </div>
                        </div>

                        {/* Checkout Form */}
                        <div className="bg-white rounded-lg shadow border border-gray-100 p-3 h-fit sticky top-3">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-primary rounded flex items-center justify-center">
                                    <FaTruck className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-secondary">Checkout</h2>
                                    <p className="text-[10px] text-gray-500">
                                        {isAuthenticated ? 'Complete your order' : 'Guest checkout available'}
                                    </p>
                                </div>
                            </div>

                            {/* Authentication Status in Checkout */}
                            {!isAuthenticated && (
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded p-2 mb-2">
                                    <div className="flex items-start gap-1">
                                        <FaInfoCircle className="text-yellow-600 text-xs mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-medium text-yellow-800 mb-0.5">Guest Checkout</p>
                                            <p className="text-[10px] text-yellow-700">
                                                Create an account to track orders and earn rewards. Or continue as guest.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Info Notice */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded p-2 mb-2">
                                <div className="flex items-start gap-1">
                                    <FaInfoCircle className="text-secondary text-xs mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-medium text-secondary mb-0.5">📧 Contact Information</p>
                                        <p className="text-[10px] text-gray-700">
                                            Email ensures you receive receipts. Phone helps with delivery updates.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form className="space-y-2">
                                {/* Full Name */}
                                <div>
                                    <label htmlFor="name" className="block text-xs font-medium text-secondary mb-0.5">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-secondary focus:border-transparent transition-all duration-300 text-sm"
                                        placeholder="Enter your full name"
                                        required
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-xs font-medium text-secondary mb-0.5">
                                        Email Address <span className="text-gray-400 text-[10px]">(Recommended)</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-secondary focus:border-transparent transition-all duration-300 text-sm"
                                        placeholder="your@email.com"
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="phone" className="block text-xs font-medium text-secondary mb-0.5">
                                        Phone Number <span className="text-gray-400 text-[10px]">(Recommended)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-secondary focus:border-transparent transition-all duration-300 text-sm"
                                        placeholder="0241234567"
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>

                                {/* Delivery Address */}
                                <div>
                                    <label htmlFor="address" className="block text-xs font-medium text-secondary mb-0.5">
                                        Delivery Address <span className="text-gray-400 text-[10px]">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="address"
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        rows="2"
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-secondary focus:border-transparent transition-all duration-300 text-sm resize-none"
                                        placeholder="Enter delivery address (if applicable)"
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>

                                {/* Additional Message */}
                                <div>
                                    <label htmlFor="message" className="block text-xs font-medium text-secondary mb-0.5">
                                        Additional Notes <span className="text-gray-400 text-[10px]">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="message"
                                        value={additionalMessage}
                                        onChange={(e) => setAdditionalMessage(e.target.value)}
                                        rows="2"
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-secondary focus:border-transparent transition-all duration-300 text-sm resize-none"
                                        placeholder="Any special instructions or notes..."
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>

                                {/* Delivery Date */}
                                <div>
                                    <label htmlFor="deliveryDate" className="block text-xs font-medium text-secondary mb-0.5">
                                        Preferred Delivery Date <span className="text-red-500">*</span>
                                    </label>
                                    <DatePicker
                                        selected={deliveryDate}
                                        onChange={(date) => setDeliveryDate(date)}
                                        minDate={new Date()}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-secondary focus:border-transparent transition-all duration-300 text-sm"
                                        dateFormat="MMMM d, yyyy"
                                        placeholderText="Select delivery date"
                                    />
                                </div>
                            </form>

                            {/* Order Summary */}
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <h3 className="font-bold text-secondary mb-1 text-xs">Order Summary</h3>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal ({cart.length} items)</span>
                                        <span className="font-medium">GH₵{formatPrice(cartSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center gap-1">
                                            <FaTruck className="text-[10px] text-blue-500" />
                                            Shipping Fee
                                        </span>
                                        {shippingTotal === 0 ? (
                                            <span className="font-medium text-green-600">FREE</span>
                                        ) : (
                                            <span className="font-medium text-secondary">GH₵{formatPrice(shippingTotal)}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200">
                                        <span className="text-secondary">Total Amount</span>
                                        <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                                            GH₵{formatPrice(cartTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={loading || hasOutOfStockItems}
                                className="w-full mt-2 bg-gradient-to-r from-secondary to-primary text-white py-2 rounded font-bold hover:opacity-90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-1 text-xs shadow"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <FaCreditCard className="text-[10px]" />
                                        {isAuthenticated ? 'Proceed to Checkout' : 'Continue to Checkout'}
                                        <FaChevronRight className="text-[10px]" />
                                    </>
                                )}
                            </button>

                            {/* Security Badge */}
                            <div className="mt-1 text-center">
                                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                                    <FaCheck className="text-green-500" />
                                    <span>Secure SSL Encryption • 100% Safe & Secure</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Login Prompt Modal */}
                <Modal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} className="max-w-md">
                    <LoginPrompt
                        onLogin={handleLogin}
                        onContinueAsGuest={handleContinueAsGuest}
                        onClose={() => setShowLoginPrompt(false)}
                    />
                </Modal>

                {/* Payment Method Modal */}
                <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
                    <div className="p-3">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                            <div className="w-8 h-8 bg-gradient-to-br from-secondary to-primary rounded flex items-center justify-center">
                                <FaCreditCard className="text-white text-sm" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-secondary">Choose Payment Method</h2>
                                <p className="text-[10px] text-gray-500">Select your preferred payment option</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-3">
                            {/* Mobile Money Option */}
                            <button
                                onClick={() => handlePayment('momo')}
                                className="w-full p-2 border border-gray-200 hover:border-secondary rounded-lg transition-all duration-300 hover:shadow group text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <FaMobileAlt className="text-white text-sm" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-secondary text-xs">Mobile Money</h3>
                                        <p className="text-[10px] text-gray-600">Pay with MTN, Vodafone, or AirtelTigo</p>
                                    </div>
                                    <FaChevronRight className="text-gray-400 group-hover:text-secondary transition-colors duration-300 text-xs" />
                                </div>
                            </button>

                            {/* Card Payment Option */}
                            <button
                                onClick={() => handlePayment('card')}
                                className="w-full p-2 border border-gray-200 hover:border-secondary rounded-lg transition-all duration-300 hover:shadow group text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <FaCreditCard className="text-white text-sm" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-secondary text-xs">Credit/Debit Card</h3>
                                        <p className="text-[10px] text-gray-600">Visa, Mastercard, or American Express</p>
                                    </div>
                                    <FaChevronRight className="text-gray-400 group-hover:text-secondary transition-colors duration-300 text-xs" />
                                </div>
                            </button>

                            {/* Bank Transfer Option */}
                            <button
                                onClick={() => handlePayment('bank')}
                                className="w-full p-2 border border-gray-200 hover:border-secondary rounded-lg transition-all duration-300 hover:shadow group text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <FaUniversity className="text-white text-sm" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-secondary text-xs">Bank Transfer</h3>
                                        <p className="text-[10px] text-gray-600">Direct bank transfer</p>
                                    </div>
                                    <FaChevronRight className="text-gray-400 group-hover:text-secondary transition-colors duration-300 text-xs" />
                                </div>
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded p-2 text-center">
                            <p className="text-[10px] text-gray-600">
                                💳 All payments are securely processed by Paystack
                            </p>
                        </div>
                    </div>
                </Modal>

                {/* Payment Loading Modal */}
                <Modal isOpen={showPaymentLoading} onClose={() => { }} className="max-w-xs">
                    <PaymentLoading stage={paymentStage} paymentMethod={paymentMethod} />
                </Modal>

                {/* Payment Success Modal */}
                <Modal isOpen={showPaymentSuccess} onClose={handlePaymentSuccessClose} className="max-w-sm">
                    <PaymentSuccess
                        onClose={handlePaymentSuccessClose}
                        orderNumber={successOrderNumber}
                        isGuest={!isAuthenticated}
                    />
                </Modal>

                {/* Remove Item Confirmation Modal */}
                <Modal isOpen={showRemoveConfirm !== null} onClose={cancelRemove} className="max-w-xs">
                    <div className="p-3 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-red-100 rounded-full flex items-center justify-center">
                            <FaExclamationTriangle className="text-lg text-red-600" />
                        </div>
                        <h3 className="text-sm font-bold text-secondary mb-1">Remove Item?</h3>
                        <p className="text-gray-600 mb-3 text-xs">
                            Are you sure you want to remove this item from your cart?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={cancelRemove}
                                className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300 font-medium text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => proceedRemove(showRemoveConfirm)}
                                className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 font-medium text-xs"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Clear Cart Confirmation Modal */}
                <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} className="max-w-xs">
                    <div className="p-3 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-red-100 rounded-full flex items-center justify-center">
                            <FaExclamationTriangle className="text-lg text-red-600" />
                        </div>
                        <h3 className="text-sm font-bold text-secondary mb-1">Clear Entire Cart?</h3>
                        <p className="text-gray-600 mb-3 text-xs">
                            This will remove all items from your shopping cart. This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300 font-medium text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={proceedClearCart}
                                className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 font-medium text-xs"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Error Notification */}
                {showError && (
                    <ErrorNotification
                        message={errorMessage}
                        onClose={() => setShowError(false)}
                    />
                )}
            </div>

            {/* ✅ Fixed: removed jsx prop, using a regular style tag */}
            <style>{`
                @keyframes wave {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-4px); }
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ProductCart;