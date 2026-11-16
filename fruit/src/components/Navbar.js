import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, Trash2, Heart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import './Navbar.css';
import { auth, firestoreDb } from '../pages/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const Navbar = () => {
    const { cartItems, totalItems, totalPrice, removeFromCart } = useCart();
    const { totalWishlistItems } = useWishlist();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(location.pathname === '/');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [navContent, setNavContent] = useState({
        logo_title: 'EarthVibes',
        logo_subtitle: 'EXPORTS',
        logo_icon: '🧺',
        links: [
            { label: 'Home', path: '/' },
            { label: 'About', path: '/about' },
            { label: 'Product', path: '/product' },
            { label: 'Contact', path: '/contact' }
        ]
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            const isDemo = localStorage.getItem('demo_user') === 'true';
            if (user || isDemo) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });

        const unsubNav = onSnapshot(doc(firestoreDb, 'settings', 'home'), (snapshot) => {
            if (snapshot.exists() && snapshot.data().navbar) {
                const data = snapshot.data().navbar;
                setNavContent(prev => ({ 
                    ...prev, 
                    ...data,
                    // Ensure links always exist even if Firestore data is old/missing links
                    links: data.links || prev.links 
                }));
            }
        });

        return () => {
            unsubscribe();
            unsubNav();
        };
    }, []);

    useEffect(() => {
        setIsCategoryOpen(false);
        setIsMobileMenuOpen(false);
        setIsCartOpen(false);
    }, [location.pathname]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleCategories = () => {
        setIsCategoryOpen(!isCategoryOpen);
    };

    const toggleCart = () => {
        setIsCartOpen(!isCartOpen);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate('/product', { state: { searchQuery: searchTerm } });
            setSearchTerm('');
        }
    };

    const categories = [
        { name: 'All Fruits', link: '/product', state: { filter: 'All' } },
        { name: 'Seasonal Fruits', link: '/product', state: { filter: 'Seasonal' }, badges: [{ text: 'Sale', type: 'green' }] },
        { name: 'Exotic Mangoes', link: '/product', state: { filter: 'Mangoes' } },
        { name: 'Fresh Berries', link: '/product', state: { filter: 'Berries' } },
        { name: 'Imported Fruits', link: '/product', state: { filter: 'Imported' } }
    ];

    return (
        <header className="navbar-wrapper">
            {/* Top Bar */}
            <div className="top-bar">
                <div className="top-bar-container">
                    {/* Logo - Left */}
                    <Link to="/admin" className="brand-logo" style={{ textDecoration: 'none', color: 'inherit' }} title="Admin Login">
                        {navContent.logo_img ? (
                            <img src={navContent.logo_img} alt="Logo" style={{ height: '45px', width: 'auto', objectFit: 'contain' }} />
                        ) : (
                            <span className="logo-icon">{navContent.logo_icon || '🧺'}</span>
                        )}
                        <div className="brand-text">
                            <h2>{navContent.logo_title || 'EarthVibes'}</h2>
                            <p>{navContent.logo_subtitle || 'EXPORTS'}</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links - Center */}
                    <ul className={`nav-links-container nav-links-center ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                        {(navContent.links || []).map((link, idx) => (
                            <li key={idx}>
                                <NavLink to={link.path} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end={link.path === '/'}>
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    <div className="header-right-group" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div className="top-actions">
                            <Link to="/wishlist" className="wishlist-nav-link">
                                <div className="wishlist-icon-wrapper">
                                    <Heart size={20} />
                                    {totalWishlistItems > 0 && <span className="wishlist-count">{totalWishlistItems}</span>}
                                </div>
                            </Link>
                            <div className="cart-wrapper" style={{ position: 'relative' }}>
                                <button className="cart-btn" onClick={toggleCart} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    <div className="cart-icon-wrapper">
                                        <ShoppingCart size={20} className="cart-icon" />
                                    </div>
                                    <span>{totalItems} Item{totalItems !== 1 ? 's' : ''}</span>
                                </button>

                                {/* Cart Dropdown */}
                                {isCartOpen && (
                                    <div className="cart-dropdown">
                                        <div className="cart-dropdown-header">
                                            <h4>Shopping Cart</h4>
                                            <button onClick={toggleCart} className="close-cart-btn"><X size={18} /></button>
                                        </div>
                                        <div className="cart-items-list">
                                            {cartItems.length === 0 ? (
                                                <p className="empty-cart-msg">Your cart is empty.</p>
                                            ) : (
                                                cartItems.map((item) => {
                                                    const priceStr = String(item.price || '0');
                                                    const numericPrice = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;
                                                    const itemTotal = numericPrice * item.quantity;
                                                    return (
                                                        <div className="cart-d-item" key={item.id}>
                                                            <img src={item.image} alt={item.name} className="cart-d-img" />
                                                            <div className="cart-d-info">
                                                                <h5>{item.name}</h5>
                                                                <p className="cart-d-qty">{item.quantity} × {item.price}</p>
                                                            </div>
                                                            <div className="cart-d-price-meta">
                                                                <span className="cart-d-item-total">₹{itemTotal.toLocaleString('en-IN')}</span>
                                                                <button className="cart-d-remove" onClick={() => removeFromCart(item.id)}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                        {cartItems.length > 0 && (
                                            <div className="cart-dropdown-footer">
                                                <div className="cart-d-total">
                                                    <span>Total:</span>
                                                    <span className="cart-d-total-price">₹{totalPrice.toLocaleString('en-IN')}</span>
                                                </div>
                                                <button
                                                    className="checkout-btn"
                                                    onClick={() => {
                                                        toggleCart();
                                                        if (isLoggedIn) {
                                                            navigate('/checkout');
                                                        } else {
                                                            navigate('/login');
                                                        }
                                                    }}
                                                >Proceed to Checkout</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Login/Logout */}
                        <div className="user-action">
                            {isLoggedIn ? (
                                <Link to="/profile" className="nav-icon-btn profile" title="My Profile">
                                    <User size={20} />
                                </Link>
                            ) : (
                                <Link to="/login" className="nav-icon-btn login" title="Sign In">
                                    <User size={20} />
                                </Link>
                            )}
                        </div>

                        {/* Mobile toggle - Grouped with actions */}
                        <div className="mobile-toggle" onClick={toggleMobileMenu}>
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar / Navigation */}
            {location.pathname === '/product' && (
                <div className="main-nav">
                    <div className="main-nav-container">
                        {/* Categories Dropdown Container */}
                        <div className="categories-menu-container">
                            <button className="categories-btn" onClick={toggleCategories}>
                                {isCategoryOpen ? <X size={20} /> : <Menu size={20} />}
                                <span>CATEGORIES</span>
                            </button>

                            {isCategoryOpen && (
                                <div className="categories-dropdown">
                                    <ul>
                                        {categories.map((cat, index) => {
                                            const isActive = location.state?.filter === cat.state?.filter;
                                            return (
                                                <li key={index}>
                                                    <NavLink
                                                        to={cat.link}
                                                        state={cat.state || {}}
                                                        className={isActive ? 'active-category' : ''}
                                                    >
                                                        {cat.name}
                                                        {cat.badges && (
                                                            <span className="badge-container">
                                                                {cat.badges.map((b, i) => (
                                                                    <span key={i} className={`mini-badge badge-${b.type}`}>{b.text}</span>
                                                                ))}
                                                            </span>
                                                        )}
                                                    </NavLink>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Search Bar */}
                        <form className="search-container" onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Search Our Catalog"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="submit" className="search-btn">
                                <Search size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
