import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestoreDb } from '../pages/firebase';
import './Footer.css';

const Footer = () => {
    const [footerContent, setFooterContent] = useState({
        desc: 'We provide premium quality, handpicked fresh fruits delivered directly to your doorstep. Experience the taste of nature in its purest form.',
        address: '123 Fruit Market, Pune, MH, India',
        phone: '+91 98765 43210',
        email: 'support@earthvibesexports.com',
        social_fb: '#',
        social_ig: '#',
        social_tw: '#',
        newsletter_title: 'Newsletter',
        newsletter_desc: 'Subscribe to get updates on new arrivals.'
    });

    const [navContent, setNavContent] = useState({
        logo_title: 'EarthVibes',
        logo_subtitle: 'Exports',
        logo_icon: '🧺',
        links: [
            { label: 'Home', path: '/' },
            { label: 'About', path: '/about' },
            { label: 'Product', path: '/product' },
            { label: 'Contact', path: '/contact' }
        ]
    });

    useEffect(() => {
        const unsub = onSnapshot(doc(firestoreDb, 'settings', 'home'), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.footer) {
                    setFooterContent(prev => ({ ...prev, ...data.footer }));
                }
                if (data.navbar) {
                    setNavContent(prev => ({ 
                        ...prev, 
                        ...data.navbar,
                        links: data.navbar.links || prev.links 
                    }));
                }
            }
        });
        return () => unsub();
    }, []);

    return (
        <footer className="main-footer">
            <div className="footer-top">
                <div className="footer-container">
                    <div className="footer-grid">
                        {/* Company Info */}
                        <div className="footer-col about-col">
                            <div className="footer-logo">
                                {navContent.logo_img ? (
                                    <img src={navContent.logo_img} alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain', marginBottom: '10px' }} />
                                ) : (
                                    <span className="logo-icon">{navContent.logo_icon || '🧺'}</span>
                                )}
                                <h2>{navContent.logo_title || 'EarthVibes'} <span>{navContent.logo_subtitle || 'Exports'}</span></h2>
                            </div>
                            <p className="footer-desc">
                                {footerContent.desc}
                            </p>
                            <div className="social-links">
                                <a href={footerContent.social_fb} aria-label="Facebook"><Facebook size={20} /></a>
                                <a href={footerContent.social_ig} aria-label="Instagram"><Instagram size={20} /></a>
                                <a href={footerContent.social_tw} aria-label="Twitter"><Twitter size={20} /></a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="footer-col links-col">
                            <h3>Quick Links</h3>
                            <ul>
                                {(navContent.links || []).map((link, idx) => (
                                    <li key={idx}><Link to={link.path}>{link.label}</Link></li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div className="footer-col contact-col">
                            <h3>Contact Info</h3>
                            <div className="contact-item">
                                <MapPin size={18} />
                                <span>{footerContent.address}</span>
                            </div>
                            <div className="contact-item">
                                <Phone size={18} />
                                <span>{footerContent.phone}</span>
                            </div>
                            <div className="contact-item">
                                <Mail size={18} />
                                <span>{footerContent.email}</span>
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div className="footer-col newsletter-col">
                            <h3>{footerContent.newsletter_title}</h3>
                            <p>{footerContent.newsletter_desc}</p>
                            <form className="footer-newsletter-form">
                                <input type="email" placeholder="Your Email" required />
                                <button type="submit"><Send size={18} /></button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-container">
                    <div className="bottom-wrapper">
                        <p className="copyright">&copy; {new Date().getFullYear()} EarthVibes Exports. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
