import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestoreDb } from './firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, Package, LogOut, Mail, Calendar, CreditCard, ChevronRight, ShoppingBag, X } from 'lucide-react';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const navigate = useNavigate();

    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        let unsubscribeOrders = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            const demoStatus = localStorage.getItem('demo_user') === 'true';
            setIsDemo(demoStatus);

            if (currentUser || demoStatus) {
                const userData = currentUser || { displayName: 'Rutuja', email: 'rutuja@demo.com' };
                setUser(userData);

                const userEmail = currentUser ? currentUser.email : 'rutuja';
                const userId = currentUser ? currentUser.uid : 'demo_master';

                // Real-time Orders Listener
                const ordersRef = collection(firestoreDb, 'orders');
                const q = query(ordersRef);
                
                unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
                    const ordersData = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        // Match by UID or Email
                        if (data.uid === userId || data.email === userEmail) {
                            ordersData.push({ id: doc.id, ...data });
                        }
                    });

                    const sortedOrders = ordersData.sort((a, b) => (b.displayId || 0) - (a.displayId || 0));
                    setOrders(sortedOrders);

                    // If a modal is open, update selectedOrder with new status
                    setSelectedOrder(prev => {
                        if (!prev) return null;
                        return sortedOrders.find(o => o.id === prev.id) || prev;
                    });
                    
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching orders:", error);
                    setLoading(false);
                });

            } else {
                setLoading(false);
                navigate('/login');
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeOrders();
        };
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('demo_user');
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="loader"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Navbar />

            <div className="profile-container">
                <header className="profile-header">
                    <div className="user-info-card">
                        <div className="user-avatar">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                        </div>
                        <div className="user-meta">
                            <h1>{user.displayName || 'Fruit Lover'}</h1>
                            <p className="user-email"><Mail size={16} /> {user.email}</p>
                            {isDemo && <span className="admin-badge">Admin Access</span>}
                        </div>
                        <button className="profile-logout-btn" onClick={handleLogout}>
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </header>

                <main className="profile-content">
                    <section className="orders-section">
                        <div className="section-title">
                            <Package size={24} />
                            <h2>Recent Orders</h2>
                        </div>

                        {orders.length === 0 ? (
                            <div className="no-orders">
                                <ShoppingBag size={48} />
                                <h3>No orders yet</h3>
                                <p>Looks like you haven't placed any orders yet. Start shopping fresh fruits today!</p>
                                <button onClick={() => navigate('/product')}>Browse Products</button>
                            </div>
                        ) : (
                            <div className="orders-list">
                                {orders.map((order) => (
                                    <div className="order-card" key={order.id}>
                                        <div className="order-header">
                                            <div className="order-id">
                                                <span>Order ID</span>
                                                <strong>#{order.displayId ? order.displayId.toString().slice(-6) : (order.id ? order.id.toString().slice(0, 8) : '000000')}</strong>
                                            </div>
                                            <div className={`order-status ${order.status?.toLowerCase().replace(/\s+/g, '.')}`}>
                                                {order.status}
                                            </div>
                                        </div>

                                        <div className="order-details">
                                            <div className="order-info-item">
                                                <Calendar size={16} />
                                                <span>{order.date}</span>
                                            </div>
                                            <div className="order-info-item">
                                                <CreditCard size={16} />
                                                <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        <div className="order-items-preview">
                                            {order.items?.map((item, idx) => (
                                                <div className="mini-item" key={idx}>
                                                    <span className="item-name">{item.name}</span>
                                                    <span className="item-qty">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-footer">
                                            <button className="view-details-btn" onClick={() => setSelectedOrder(order)}>
                                                View Details <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                {selectedOrder && (
                    <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
                        <div className="order-modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Order Details</h3>
                                <button className="close-modal" onClick={() => setSelectedOrder(null)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-info-grid">
                                    <div className="info-group">
                                        <label>Order ID</label>
                                        <p>#{selectedOrder.displayId || selectedOrder.id}</p>
                                    </div>
                                    <div className="info-group">
                                        <label>Date</label>
                                        <p>{selectedOrder.date}</p>
                                    </div>
                                    <div className="info-group">
                                        <label>Delivery Status</label>
                                        <span className={`status-badge ${selectedOrder.status?.toLowerCase().replace(/\s+/g, '.')}`}>{selectedOrder.status}</span>
                                    </div>
                                    <div className="info-group">
                                        <label>Payment Method</label>
                                        <p>Cash on Delivery</p>
                                    </div>
                                </div>

                                <div className="modal-items-list">
                                    <h4>Order Items</h4>
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div className="modal-item" key={idx}>
                                            <span className="m-item-name">{item.name}</span>
                                            <span className="m-item-price">{item.quantity} x {item.price}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="modal-summary">
                                    <div className="summary-row">
                                        <span>Subtotal</span>
                                        <span>₹{(selectedOrder.totalAmount - 50).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Delivery Fee</span>
                                        <span>₹50</span>
                                    </div>
                                    <div className="summary-row grand-total">
                                        <span>Total</span>
                                        <span>₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Profile;
