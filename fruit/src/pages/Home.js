import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Home.css';
import { ArrowRight, Star, Truck, ShieldCheck, Clock, ChevronRight, ChevronLeft, Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import fruitShelf from '../assets/fruit_shelf.png';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { firestoreDb } from './firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

const NextArrow = (props) => {
    const { onClick } = props;
    return (
        <div className="slider-arrow next-arrow" onClick={onClick}>
            <ChevronRight size={24} />
        </div>
    );
};

const PrevArrow = (props) => {
    const { onClick } = props;
    return (
        <div className="slider-arrow prev-arrow" onClick={onClick}>
            <ChevronLeft size={24} />
        </div>
    );
};


const iconMap = { Truck, ShieldCheck, Clock, Star, Heart, ShoppingCart };

const Home = () => {
    const { products } = useProducts();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const featuredProducts = (products || []).slice(0, 4); // Show top 4 fruits

    const [homeContent, setHomeContent] = useState({
        features: [
            { icon: 'Truck', title: 'Global Export', desc: 'Delivering fresh fruits worldwide' },
            { icon: 'ShieldCheck', title: 'Premium Quality', desc: '100% Organic & Handpicked' },
            { icon: 'Clock', title: 'Ultra Fast', desc: 'Freshness preserved in transit' }
        ],
        featured_section: {
            title: 'Featured Freshness',
            subtitle: 'Our Selection'
        },
        about_section: {
            title: 'From Local Orchards to Global Markets',
            subtitle: 'Why Choose Us',
            desc: 'With over two decades of experience, EarthVibes Exports has been a pioneer in bridging the gap between quality-conscious farmers and global consumers. We believe in preserving the natural sweetness and nutritional value of every fruit.',
            highlights: [
                { num: '25+', label: 'Countries Exported' },
                { num: '500+', label: 'Trusted Farmers' },
                { num: '100%', label: 'Satisfaction Rate' }
            ],
            image: '',
            exp_years: '20+ Years',
            exp_label: 'of Excellence'
        }
    });

    const [sliderData, setSliderData] = useState([
        {
            id: 1,
            badge: "100% Organic",
            title: "Fresh Fruits,\n Delivered Direct to You.",
            desc: "Experience the finest selection of exotic and seasonal fruits, handpicked for quality and freshness. Taste the difference today.",
            image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: 2,
            badge: "Fresh Arrival",
            title: "Farm Fresh Berries\n Now In Stock",
            desc: "Sweet and juicy strawberries, blueberries, and raspberries. Perfect for your morning smoothies or healthy snacking.",
            image: "https://images.unsplash.com/photo-1464965911861-746a04b4cda0?auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: 3,
            badge: "Bestseller",
            title: "Premium Mangoes\n Straight from Orchards",
            desc: "Taste the King of Fruits. We deliver the best grade Alphonso and Kesar mangoes globally.",
            image: "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1974&auto=format&fit=crop"
        },
        {
            id: 4,
            badge: "Healthy Choice",
            title: "Fresh Apples\n & Pears",
            desc: "Crunchy, sweet, and packed with nutrients. Get the best quality apples and natural fruits delivered fresh.",
            image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?q=80&w=1974&auto=format&fit=crop"
        }
    ]);

    useEffect(() => {
        const unsub = onSnapshot(collection(firestoreDb, 'banners'), (snapshot) => {
            const bannerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (bannerList.length > 0) {
                setSliderData(bannerList.sort((a, b) => a.id - b.id));
            }
        });

        const unsubContent = onSnapshot(doc(firestoreDb, 'settings', 'home'), (snapshot) => {
            if (snapshot.exists()) {
                setHomeContent(snapshot.data());
            }
        });

        return () => {
            unsub();
            unsubContent();
        };
    }, []);

    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 800,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        fade: true,
        pauseOnHover: false
    };

    return (
        <div className="home-container">
            <Navbar />

            {/* Hero Slider Section */}
            <section className="hero-slider">
                <Slider {...sliderSettings}>
                    {sliderData.map((slide) => (
                        <div key={slide.id} className="slide-item">
                            <div className="slide-image-wrapper">
                                <img src={slide.image} alt={slide.title} className="slide-image" />
                                <div className="slide-overlay"></div>
                            </div>
                            <div className="slide-content">
                                <span className="slide-badge">{slide.badge}</span>
                                <h1 className="slide-title">{slide.title}</h1>
                                <p className="slide-desc">{slide.desc}</p>
                                <div className="slide-actions">
                                    <Link to={slide.btn1_link || '/product'} className="primary-btn">
                                        {slide.btn1_text || 'Explore Fruits'} <ArrowRight size={20} />
                                    </Link>
                                    <Link to={slide.btn2_link || '/contact'} className="secondary-btn">
                                        {slide.btn2_text || 'Contact Us'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider>
            </section>

            {/* Features Bar */}
            <section className="features-bar">
                {homeContent.features.map((item, index) => {
                    const Icon = iconMap[item.icon] || Truck;
                    return (
                        <div className="feature-item" key={index}>
                            <Icon className="feat-icon" />
                            <div className="feat-text">
                                <h4>{item.title}</h4>
                                <p>{item.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Featured Section */}
            <section className="featured-fruits">
                <div className="section-header">
                    <div>
                        <span className="subtitle">{homeContent?.featured_section?.subtitle}</span>
                        <h2>{homeContent?.featured_section?.title}</h2>
                    </div>
                    <Link to="/product" className="view-all">
                        View All Products <ChevronRight size={18} />
                    </Link>
                </div>

                <div className="fruit-grid">
                    {featuredProducts.slice(0, 3).map((fruit) => (
                        <div key={fruit.id} className="fruit-card-wrapper" style={{ position: 'relative' }}>
                            <Link to={`/product/${fruit.id}`} className="fruit-card">
                                <div className="card-image">
                                    <img src={fruit.image} alt={fruit.name} />
                                    {fruit.badge && <span className="card-badge">{fruit.badge}</span>}
                                </div>
                                <div className="card-info">
                                    <span className="category">{fruit.category}</span>
                                    <h3>{fruit.name}</h3>
                                        <div className="card-footer">
                                            <span className="price">{fruit.price}</span>
                                            <div className="rating">
                                                <Star size={14} fill="#ffb800" color="#ffb800" />
                                                <span>{fruit.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            <div className="card-actions-overlay">
                                <button
                                    className={`wishlist-icon-btn ${isInWishlist(fruit.id) ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleWishlist(fruit);
                                    }}
                                >
                                    <Heart size={20} fill={isInWishlist(fruit.id) ? "#ef4444" : "none"} stroke={isInWishlist(fruit.id) ? "#ef4444" : "#666"} />
                                </button>
                                <button
                                    className="add-to-cart-icon-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addToCart(fruit, 1);
                                    }}
                                >
                                    <ShoppingCart size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* About Section */}
            <section className="about-preview">
                <div className="about-content">
                    <span className="subtitle">{homeContent?.about_section?.subtitle}</span>
                    <h2>{homeContent?.about_section?.title}</h2>
                    <p>
                        {homeContent?.about_section?.desc}
                    </p>
                    <div className="about-highlights">
                        {homeContent?.about_section?.highlights?.map((high, idx) => (
                            <div className="high-item" key={idx}>
                                <div className="high-num">{high.num}</div>
                                <div className="high-label">{high.label}</div>
                            </div>
                        ))}
                    </div>
                    <Link to="/about" className="primary-btn">Read Our Story</Link>
                </div>
                <div className="about-visual">
                    <img src={homeContent?.about_section?.image || fruitShelf} alt="Fresh fruits on shelf" className="float-img" />
                    <div className="visual-experience">
                        <h3>{homeContent?.about_section?.exp_years}</h3>
                        <p>{homeContent?.about_section?.exp_label}</p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
