import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, MessageSquare, Apple, Clock, User, MessageCircle, Info } from 'lucide-react';
import './Contact.css';
import { firestoreDb } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        fruitQuery: 'General'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const newInquiry = {
                ...formData,
                id: Date.now(),
                status: 'Pending',
                date: new Date().toLocaleDateString()
            };

            await addDoc(collection(firestoreDb, 'inquiries'), newInquiry);

            alert('Thank you for contacting us! We will get back to you soon.');
            setFormData({ name: '', email: '', phone: '', fruitQuery: 'General', subject: '', message: '' });
        } catch (error) {
            console.error("Error submitting inquiry:", error);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="page-container">
            <Navbar />
            <div className="contact-hero">
                <h1>Get in Touch</h1>
                <p>We're here to answer your questions and help you experience the best fruits from around the world.</p>
            </div>

            <div className="contact-container">
                <div className="contact-info-grid">
                    <div className="info-card">
                        <div className="info-icon"><MapPin size={24} /></div>
                        <h3>Our Headquarters</h3>
                        <p>123 Fruit Orchard Lane, Global Export Hub, Mumbai, Maharashtra 400001</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon"><Phone size={24} /></div>
                        <h3>Phone & WhatsApp</h3>
                        <p>Sales: +91 98765 43210<br />Support: +91 87654 32109</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon"><Mail size={24} /></div>
                        <h3>Email Us</h3>
                        <p>export@earthvibes.com<br />inquiry@earthvibes.com</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon"><Clock size={24} /></div>
                        <h3>Business Hours</h3>
                        <p>Mon - Sat: 9:00 AM - 7:00 PM<br />Sun: Closed (Email Support Available)</p>
                    </div>
                </div>

                <div className="contact-main-flex">
                    <div className="contact-form-side">
                        <div className="form-header">
                            <h2>Send us a Message</h2>
                            <p>Fill out the form below and our export specialist will contact you within 24 hours.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="premium-contact-form">
                            <div className="form-row">
                                <div className="form-group-contact">
                                    <label><User size={16} /> Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter Your Name" />
                                </div>
                                <div className="form-group-contact">
                                    <label><Mail size={16} /> Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Enter Your Email" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group-contact">
                                    <label><Phone size={16} /> Phone Number</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="+91 00000 00000" />
                                </div>
                                <div className="form-group-contact">
                                    <label><Apple size={16} /> Fruit of Interest</label>
                                    <select name="fruitQuery" value={formData.fruitQuery} onChange={handleInputChange}>
                                        <option value="General">General Inquiry</option>
                                        <option value="Mangoes">Premium Mangoes</option>
                                        <option value="Berries">Fresh Berries</option>
                                        <option value="Imported">Exotic Imported Fruits</option>
                                        <option value="Bulk">Bulk/Wholesale Export</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group-contact">
                                <label><MessageSquare size={16} /> Subject</label>
                                <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder="How can we help you?" />
                            </div>
                            <div className="form-group-contact">
                                <label><MessageCircle size={16} /> Your Message</label>
                                <textarea name="message" value={formData.message} onChange={handleInputChange} required placeholder="Share details about your requirements..."></textarea>
                            </div>
                            <button type="submit" className="contact-submit-btn">
                                <span>Send Message</span>
                                <Send size={18} />
                            </button>
                        </form>
                    </div>

                    <div className="contact-visual-side">
                        <div className="visual-content">
                            <div className="visual-badge">Trusted Exporter</div>
                            <h2>EarthVibes<br />Global Network</h2>
                            <div className="feature-list">
                                <div className="feature-item">
                                    <Info size={18} />
                                    <span>Exporting to 25+ Countries</span>
                                </div>
                                <div className="feature-item">
                                    <Info size={18} />
                                    <span>FSSAI & APEDA Certified</span>
                                </div>
                                <div className="feature-item">
                                    <Info size={18} />
                                    <span>Cold Chain Logistics</span>
                                </div>
                            </div>
                            <div className="visual-footer">
                                <p>Joining hands with sustainable farmers to bring nature's sweetness to your doorstep.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Contact;
