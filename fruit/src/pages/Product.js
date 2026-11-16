import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './Product.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShoppingCart, Star, Plus, Minus, X, ChevronDown, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

import { useProducts } from '../context/ProductContext';
import { auth } from './firebase';

const Product = () => {
    const { id: paramId } = useParams();
    const { products, setProducts } = useProducts();
    const location = useLocation();
    const navigate = useNavigate();
    const searchQuery = location.state?.searchQuery || '';
    const filterFromState = location.state?.filter || 'All';
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [activeFilter, setActiveFilter] = useState(filterFromState);
    const [sortOrder, setSortOrder] = useState('Featured');
    const [quantities, setQuantities] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState('1 KG');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [initialLoadId, setInitialLoadId] = useState(null);

    // Initial load from URL param
    useEffect(() => {
        if (paramId && paramId !== initialLoadId && (products || []).length > 0) {
            const found = products.find(p => String(p.id) === String(paramId));
            if (found) {
                setSelectedProduct(found);
                setInitialLoadId(paramId);
            }
        }
    }, [paramId, products, initialLoadId, setSelectedProduct]);

    // Update selectedProduct live price if it changes in context, without reopening closed modals
    useEffect(() => {
        if (selectedProduct && (products || []).length > 0) {
            const found = products.find(p => String(p.id) === String(selectedProduct.id));
            if (found && (found.price !== selectedProduct.price || found.stock !== selectedProduct.stock)) {
                setSelectedProduct(found);
            }
        }
    }, [products, selectedProduct, setSelectedProduct]);

    useEffect(() => {
        if (location.state?.filter) {
            setActiveFilter(location.state.filter);
        } else if (location.state?.searchQuery) {
            setActiveFilter('All');
        }
    }, [location.state, setActiveFilter]);

    // Removed random price interval to ensure data stability and real-time sync performance.


    const filteredProducts = searchQuery
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : activeFilter === 'All'
            ? products
            : products.filter(p => p.category === activeFilter);

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortOrder === 'Price: Low to High') {
            const priceA = parseFloat(String(a.price || '0').replace(/[^\d.]/g, '')) || 0;
            const priceB = parseFloat(String(b.price || '0').replace(/[^\d.]/g, '')) || 0;
            return priceA - priceB;
        } else if (sortOrder === 'Price: High to Low') {
            const priceA = parseFloat(String(a.price || '0').replace(/[^\d.]/g, '')) || 0;
            const priceB = parseFloat(String(b.price || '0').replace(/[^\d.]/g, '')) || 0;
            return priceB - priceA;
        } else if (sortOrder === 'A to Z') {
            return a.name.localeCompare(b.name);
        } else if (sortOrder === 'Z to A') {
            return b.name.localeCompare(a.name);
        }
        return 0; // Featured
    });

    const updateQuantity = (id, delta) => {
        setQuantities(prev => ({
            ...prev,
            [id]: Math.max(1, (prev[id] || 1) + delta)
        }));
    };

    const handleAddToCart = (product) => {
        let uiQty = quantities[product.id] || 1;
        let finalQty = uiQty;

        // Determine if we should multiply the quantity based on the selected size from the modal
        let applicableSize = '1 KG';
        if (selectedProduct && selectedProduct.id === product.id) {
            applicableSize = selectedSize;
            
            // Extract the leading number from the size (e.g. "5" from "5 KG", "3" from "3 Dozen")
            // Exceptions: /250g base unit has a different multiplier logic, 
            // but for standard kg/dz we extract the number.
            const sizeMultiplierMatches = applicableSize.match(/^(\d+)/);
            if (sizeMultiplierMatches && !String(product.price).includes('/250g')) {
                const multiplier = parseInt(sizeMultiplierMatches[1], 10);
                finalQty = uiQty * multiplier; // e.g., 2 qty of "5 KG" = 10 total kg
            }
        } else {
             applicableSize = (product.unit || '1 KG');
        }

        const cartItem = {
            ...product,
            quantity: finalQty, // The actual total units pushed to cart logic
            displayPrice: selectedProduct && selectedProduct.id === product.id 
                ? getModalPrice(product, selectedSize) 
                : product.price,
            selectedSize: applicableSize
        };
        
        // You only pass the required calculated finalQty to addToCart since CartContext handles it based on unit
        addToCart(cartItem, finalQty);
    };

    // Parse unit from price string and return label + options
    const getUnitOptions = (price) => {
        const priceStr = String(price || '');
        if (priceStr.includes('/kg')) {
            return { label: 'QUANTITY (KG)', options: ['1 KG', '2 KG', '5 KG'] };
        } else if (priceStr.includes('/dz')) {
            return { label: 'QUANTITY (DOZEN)', options: ['1 Dozen', '2 Dozen', '3 Dozen'] };
        } else if (priceStr.includes('/pack')) {
            return { label: 'QUANTITY (PACK)', options: ['1 Pack', '2 Pack', '3 Pack'] };
        } else if (priceStr.includes('/box')) {
            return { label: 'QUANTITY (BOX)', options: ['1 Box', '2 Box', '3 Box'] };
        } else if (priceStr.includes('/250g')) {
            return { label: 'QUANTITY (WEIGHT)', options: ['250g', '500g', '1 KG'] };
        } else if (priceStr.includes('/pc')) {
            return { label: 'QUANTITY (PIECES)', options: ['1 Piece', '3 Pieces', '5 Pieces'] };
        } else {
            return { label: 'QUANTITY', options: ['1 Unit', '2 Units', '3 Units'] };
        }
    };

    // Get multiplier based on selected size option
    const getSizeMultiplier = (sizeOption, priceStr) => {
        if (!sizeOption) return 1;
        // For /250g base: 250g=1x, 500g=2x, 1 KG=4x
        if (String(priceStr).includes('/250g')) {
            if (sizeOption === '250g') return 1;
            if (sizeOption === '500g') return 2;
            if (sizeOption === '1 KG') return 4;
        }
        // Extract leading number from size string (e.g. "2 KG" → 2, "3 Dozen" → 3)
        const match = sizeOption.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 1;
    };

    // Calculate modal display price based on selected size
    const getModalPrice = (product, sizeOption) => {
        const priceStr = String(product.price || '0');
        const basePrice = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;
        const multiplier = getSizeMultiplier(sizeOption, priceStr);
        return (basePrice * multiplier).toLocaleString('en-IN');
    };


    return (
        <div className="product-page">
            <Navbar />
            <div className="product-header">
                <h1>
                    {searchQuery ? `Search Results for "${searchQuery}"` :
                        activeFilter === 'All' ? 'Our Premium Fruit Collection' :
                            activeFilter === 'Seasonal' ? 'Fresh Seasonal Arrivals' :
                                activeFilter === 'Mangoes' ? 'The King of Fruits: Exotic Mangoes' :
                                    activeFilter === 'Berries' ? 'Handpicked Organic Berries' :
                                        activeFilter === 'Imported' ? 'Premium Global Imports' : activeFilter}
                </h1>
                <p>
                    {activeFilter === 'All' && "Taste the finest selection of farm-fresh fruits, delivered direct to your home."}
                    {activeFilter === 'Seasonal' && "Enjoy the best flavors of the season with our hand-selected harvest."}
                    {activeFilter === 'Mangoes' && "Experience the sweetness of premium Alphonso, Kesar and more varieties."}
                    {activeFilter === 'Berries' && "Sweet, juicy and packed with nutrients. Our berries are nature's candy."}
                    {activeFilter === 'Imported' && "Exotic treasures from around the world, handled with care for maximum freshness."}
                    {!['All', 'Seasonal', 'Mangoes', 'Berries', 'Imported'].includes(activeFilter) && "Freshness delivered to your doorstep"}
                </p>
                <p className="click-hint">Click on any fruit to see detailed information & benefits</p>
            </div>

            <div className="product-container full-width">
                <main className="product-catalog">
                    <div className="catalog-header">
                        <div className="catalog-actions">
                            <div className="sort-container">
                                <span className="sort-label">Sort By:</span>
                                <div className="sort-wrapper">
                                    <select
                                        className="sort-select"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                    >
                                        <option value="Featured">Featured</option>
                                        <option value="Price: Low to High">Price: Low to High</option>
                                        <option value="Price: High to Low">Price: High to Low</option>
                                        <option value="A to Z">A to Z</option>
                                        <option value="Z to A">Z to A</option>
                                    </select>
                                    <ChevronDown size={18} className="sort-icon" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid">
                        {sortedProducts.length > 0 ? sortedProducts.map(product => (
                            <div className="product-card" key={product.id} onClick={() => setSelectedProduct(product)}>
                                {product.badge && <span className={`product-badge ${product.badge.toLowerCase()}`}>{product.badge}</span>}
                                <button
                                    className={`wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWishlist(product);
                                    }}
                                >
                                    <Heart size={20} fill={isInWishlist(product.id) ? "#ef4444" : "none"} stroke={isInWishlist(product.id) ? "#ef4444" : "currentColor"} />
                                </button>
                                <div className="product-img-container">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80'; }}
                                    />
                                </div>
                                <div className="product-info">
                                    <p className="product-category">{product.category}</p>
                                    <h3 className="product-name">{product.name}</h3>
                                    <div className="product-rating">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} className={i < product.rating ? 'star-filled' : 'star-empty'} />
                                        ))}
                                    </div>
                                    <div className="product-pricing">
                                        <div className="price-main">
                                            <span className="current-price">{product.price}</span>
                                            {product.oldPrice && <span className="old-price">{product.oldPrice}</span>}
                                        </div>
                                    </div>

                                    <p style={{
                                        fontSize: '0.78rem', fontWeight: '600', margin: '0 0 8px',
                                        color: (product.stock || 0) > 0 ? '#16a34a' : '#dc2626'
                                    }}>
                                        {(product.stock || 0) > 0
                                            ? `Stock: ${product.stock} ${product.unit || String(product.price).split('/')[1] || ''}`
                                            : 'Out of Stock'}
                                    </p>

                                    <div className="cart-action-row" onClick={(e) => e.stopPropagation()}>
                                        <div className="quantity-selector">
                                            <button 
                                                className="qty-btn" 
                                                onClick={() => updateQuantity(product.id, -1)}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="qty-value">{quantities[product.id] || 1}</span>
                                            <button 
                                                className="qty-btn" 
                                                onClick={() => updateQuantity(product.id, 1)}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button
                                            className="add-to-cart-btn"
                                            onClick={() => handleAddToCart(product)}
                                            disabled={(product.stock || 0) === 0}
                                            style={(product.stock || 0) === 0 ? { opacity: 0.45, cursor: 'not-allowed', background: '#ccc' } : {}}
                                        >
                                            <ShoppingCart size={16} /> {(product.stock || 0) === 0 ? 'Out of Stock' : 'Add'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="no-products-msg" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666' }}>
                                No fruits found in this category.
                            </div>
                        )}
                    </div>

                    {/* Product Detail Modal */}
                    {selectedProduct && (
                        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                            <div className="modal-content info-modal" onClick={(e) => e.stopPropagation()}>
                                <button className="modal-close" onClick={() => {
                                    setSelectedProduct(null);
                                    setActiveImageIndex(0);
                                }}><X size={24} /></button>

                                <div className="modal-body-custom">
                                    <div className="m-image-container">
                                        <div className="m-main-image">
                                            <img
                                                src={selectedProduct.images && selectedProduct.images.length > 0
                                                    ? selectedProduct.images[activeImageIndex]
                                                    : selectedProduct.image}
                                                alt={selectedProduct.name}
                                            />
                                        </div>
                                        {selectedProduct.images && selectedProduct.images.length > 1 && (
                                            <div className="m-thumbnails" style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                                                {selectedProduct.images.map((img, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`m-thumbnail ${activeImageIndex === idx ? 'active' : ''}`}
                                                        onClick={() => setActiveImageIndex(idx)}
                                                        style={{
                                                            width: '60px',
                                                            height: '60px',
                                                            borderRadius: '6px',
                                                            overflow: 'hidden',
                                                            cursor: 'pointer',
                                                            border: activeImageIndex === idx ? '2px solid #10b981' : '1px solid #eee',
                                                            opacity: activeImageIndex === idx ? 1 : 0.7
                                                        }}
                                                    >
                                                        <img src={img} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="m-content-container">
                                        <h2 className="m-title">{selectedProduct.name}</h2>
                                        <div className="m-reviews">
                                            <div className="rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffb800' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={16} fill={i < (selectedProduct.rating || 5) ? "#ffb800" : "none"} stroke="#ffb800" />
                                                ))}
                                                <span style={{ color: '#444', fontWeight: 'bold', marginLeft: '6px' }}>{selectedProduct.rating || 5}.0</span>
                                                <span className="no-review" style={{ marginLeft: '10px' }}>(24 Reviews)</span>
                                            </div>
                                            <button className="write-review">Write Review</button>
                                        </div>

                                        <div className="m-price-display">
                                            <span className="m-price-main">Rs. {getModalPrice(selectedProduct, selectedSize)}</span>
                                        </div>

                                        <div className="m-meta-info">
                                            <div className="meta-row">
                                                <span className="meta-label">Vendor :</span>
                                                <span className="meta-value">{selectedProduct.vendor || 'Spotless Fruits'}</span>
                                            </div>
                                            <div className="meta-row">
                                                <span className="meta-label">Product Type :</span>
                                                <span className="meta-value">Fruit</span>
                                            </div>
                                        </div>

                                        <button
                                            className="m-wishlist-link-simple"
                                            onClick={() => toggleWishlist(selectedProduct)}
                                        >
                                            <Heart size={18} fill={isInWishlist(selectedProduct.id) ? "#ef4444" : "none"} stroke={isInWishlist(selectedProduct.id) ? "#ef4444" : "#666"} />
                                            Add To Wishlist
                                        </button>

                                        {(() => {
                                            const unitInfo = getUnitOptions(selectedProduct.price);
                                            return (
                                                <div className="m-selection-group">
                                                    <label>{unitInfo.label}</label>
                                                    <div className="size-options">
                                                        {unitInfo.options.map((opt) => (
                                                            <button
                                                                key={opt}
                                                                className={`size-btn ${selectedSize === opt ? 'active' : ''}`}
                                                                onClick={() => setSelectedSize(opt)}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="m-selection-group">
                                            <label>Units</label>
                                            <div className="m-cart-controls">
                                                <div className="m-qty-box">
                                                    <button onClick={() => updateQuantity(selectedProduct.id, -1)}><Minus size={16} /></button>
                                                    <input type="text" value={quantities[selectedProduct.id] || 1} readOnly />
                                                    <button onClick={() => updateQuantity(selectedProduct.id, 1)}><Plus size={16} /></button>
                                                </div>
                                                <button
                                                    className="m-add-cart-btn"
                                                    disabled={(selectedProduct.stock || 0) === 0}
                                                    style={(selectedProduct.stock || 0) === 0 ? { opacity: 0.45, cursor: 'not-allowed', background: '#aaa' } : {}}
                                                    onClick={() => {
                                                        if ((selectedProduct.stock || 0) === 0) return;
                                                        handleAddToCart(selectedProduct);
                                                        setSelectedProduct(null);
                                                    }}
                                                >
                                                    {(selectedProduct.stock || 0) === 0 ? 'Out of Stock' : 'Add To Cart'}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            className="m-buy-now-btn"
                                            disabled={(selectedProduct.stock || 0) === 0}
                                            style={(selectedProduct.stock || 0) === 0 ? { opacity: 0.45, cursor: 'not-allowed', background: '#aaa' } : {}}
                                            onClick={() => {
                                                if ((selectedProduct.stock || 0) === 0) return;
                                                
                                                let uiQty = quantities[selectedProduct.id] || 1;
                                                let finalQty = uiQty;
                                                const sizeMultiplierMatches = selectedSize.match(/^(\d+)/);
                                                if (sizeMultiplierMatches && !String(selectedProduct.price).includes('/250g')) {
                                                    const multiplier = parseInt(sizeMultiplierMatches[1], 10);
                                                    finalQty = uiQty * multiplier;
                                                }

                                                const buyNowItem = {
                                                    ...selectedProduct,
                                                    quantity: finalQty,
                                                    selectedSize: selectedSize,
                                                    displayPrice: getModalPrice(selectedProduct, selectedSize)
                                                };
                                                const isDemoUser = localStorage.getItem('demo_user') === 'true';
                                                const isLoggedIn = auth.currentUser || isDemoUser;
                                                if (isLoggedIn) {
                                                    navigate('/checkout', { state: { buyNowItem } });
                                                } else {
                                                    navigate('/login', { state: { buyNowItem } });
                                                }
                                            }}
                                        >
                                            {(selectedProduct.stock || 0) === 0 ? 'Currently Unavailable' : 'Buy It Now'}
                                        </button>

                                        <div className="m-secure-checkout">
                                            <p>SECURE CHECKOUT WITH</p>
                                            <div className="payment-icons">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="MasterCard" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo.svg" alt="GPay" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Product;
