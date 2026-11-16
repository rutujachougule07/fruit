import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Star, Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Product.css'; // Reuse product card styles

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    return (
        <div className="wishlist-page">
            <Navbar />

            <div className="product-header" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
                <h1>My Saved Favorites</h1>
                <p>Manage your handpicked selection of fresh fruits</p>
            </div>

            <div className="product-container full-width">
                <main className="product-catalog" style={{ padding: '40px 5%' }}>
                    {wishlistItems.length === 0 ? (
                        <div className="empty-wishlist" style={{ textAlign: 'center', padding: '60px 0' }}>
                            <Heart size={80} color="#ddd" strokeWidth={1} style={{ marginBottom: '20px' }} />
                            <h2>Your wishlist is empty</h2>
                            <p style={{ color: '#666', marginBottom: '30px' }}>Save your favorite fruits to find them easily later!</p>
                            <Link to="/product" className="checkout-btn" style={{ padding: '12px 30px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <ArrowLeft size={18} /> Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="grid">
                            {wishlistItems.map(product => (
                                <div className="product-card" key={product.id}>
                                    <button
                                        className="wishlist-btn active"
                                        onClick={() => removeFromWishlist(product.id)}
                                    >
                                        <Heart size={20} fill="#ef4444" stroke="#ef4444" />
                                    </button>
                                    <div className="product-img-container">
                                        <img src={product.image} alt={product.name} />
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
                                            <div className="live-tag">
                                                <span className="live-dot pulse"></span>
                                                <span className="live-text">Live Rate</span>
                                            </div>
                                        </div>
                                        <div className="cart-action-row">
                                            <button
                                                className="add-to-cart-btn"
                                                onClick={() => {
                                                    addToCart(product, 1);
                                                }}
                                                style={{ width: '100%' }}
                                            >
                                                <ShoppingCart size={16} /> Move to Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Wishlist;
