import React from 'react';
import './About.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import fruitShelf from '../assets/fruit_shelf.png';

const About = () => {
    return (
        <div className="page-container">
            <Navbar />
            <div className="about-header">
                <h1>About Us</h1>
                <p>Discover the passion behind EarthVibes Exports</p>
            </div>

            <div className="about-content">
                <div className="about-grid">
                    <div className="about-text">
                        <h2>Our Story</h2>
                        <p>Founded with a simple mission: to bring the freshness of nature right to your doorstep. What started as a small local farmstand has grown into a premium delivery service for the finest fruits available.</p>
                        <p>At EarthVibes Exports, we believe that quality should never be compromised. That's why we partner directly with sustainable farms to ensure that every mango, berry, and apple you receive meets our rigorous standards.</p>

                        <div className="stats-container">
                            <div className="stat-box">
                                <h3 className="stat-number">10k+</h3>
                                <p>Happy Customers</p>
                            </div>
                            <div className="stat-box">
                                <h3 className="stat-number">50+</h3>
                                <p>Fruit Varieties</p>
                            </div>
                            <div className="stat-box">
                                <h3 className="stat-number">100%</h3>
                                <p>Organic Sourced</p>
                            </div>
                        </div>
                    </div>
                    <div className="about-image">
                        <img src={fruitShelf} alt="Fresh fruit shelves" />
                    </div>
                </div>

                <div className="values-section">
                    <h2 className="text-center">Our Core Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <div className="value-icon">🌱</div>
                            <h3>Sustainability</h3>
                            <p>We source our fruits from farms that practice sustainable agriculture, protecting the earth for future generations.</p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon">💎</div>
                            <h3>Premium Quality</h3>
                            <p>Every piece of fruit is hand-inspected before it makes its way into your box. If it's not perfect, we don't ship it.</p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon">🤝</div>
                            <h3>Community First</h3>
                            <p>We believe in supporting local farmers and fair trade practices, ensuring everyone in the supply chain thrives.</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default About;
