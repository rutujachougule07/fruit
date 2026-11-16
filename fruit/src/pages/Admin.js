import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, ShoppingBag, LogOut, Shield, Plus, Edit, Trash2, Activity, Printer, X, ShoppingCart, CheckCircle, Eye, Apple, FileText, Edit2, Truck, Menu, MapPin, UserCheck, Tag, Settings, Navigation } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useStore } from '../context/StoreContext';
import { firestoreDb, auth } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where, getDocs, increment } from 'firebase/firestore';
import './Admin.css';

const Admin = () => {
    const { products: fruits, addProduct, updateProduct, deleteProduct } = useProducts();
    const { branches, deliverySettings, addBranch, updateBranch, deleteBranch, updateDeliverySettings } = useStore();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginForm, setLoginForm] = useState({ email: 'admin@gmail.com', password: 'admin123' });
    const [subTab, setSubTab] = useState('all');

    // Hyperlocal Branch Form State
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [isEditingBranch, setIsEditingBranch] = useState(false);
    const [branchForm, setBranchForm] = useState({
        id: '',
        name: '',
        address: '',
        lat: 17.6805,
        lng: 74.0183,
        radiusKm: 3,
        phone: ''
    });

    // Delivery Rules Form State
    const [deliveryRulesForm, setDeliveryRulesForm] = useState({
        minFreeDeliveryAmount: 500,
        defaultDeliveryFee: 40
    });

    // Delivery Boy Assignment State
    const [deliveryBoyModalOrder, setDeliveryBoyModalOrder] = useState(null);
    const [deliveryBoyInput, setDeliveryBoyInput] = useState({ name: '', phone: '' });

    const [fruitForm, setFruitForm] = useState({
        id: null,
        name: '',
        category: 'Seasonal',
        price: '',
        unit: 'kg',
        image: '',
        images: [],
        badge: '',
        rating: 5,
        stock: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [orders, setOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [orderSearchQuery, setOrderSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [homeBanners, setHomeBanners] = useState([
        { id: 1, badge: "100% Organic", title: "Fresh Fruits,\n Delivered Direct to You.", desc: "Experience the finest selection of exotic and seasonal fruits, handpicked for quality and freshness. Taste the difference today.", image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80', btn1_text: 'Shop Now', btn1_link: '/product', btn2_text: 'Contact Us', btn2_link: '/contact' },
        { id: 2, badge: "Fresh Arrival", title: "Farm Fresh Berries\n Now In Stock", desc: "Sweet and juicy strawberries, blueberries, and raspberries. Perfect for your morning smoothies or healthy snacking.", image: "https://images.unsplash.com/photo-1464965911861-746a04b4cda0?auto=format&fit=crop&w=1200&q=80", btn1_text: 'Shop Now', btn1_link: '/product', btn2_text: 'Contact Us', btn2_link: '/contact' },
        { id: 3, badge: "Bestseller", title: "Premium Mangoes\n Straight from Orchards", desc: "Taste the King of Fruits. We deliver the best grade Alphonso and Kesar mangoes globally.", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1974&auto=format&fit=crop", btn1_text: 'Shop Now', btn1_link: '/product', btn2_text: 'Contact Us', btn2_link: '/contact' },
        { id: 4, badge: "Healthy Choice", title: "Fresh Apples\n & Pears", desc: "Crunchy, sweet, and packed with nutrients. Get the best quality apples and natural fruits delivered fresh.", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?q=80&w=1974&auto=format&fit=crop", btn1_text: 'Shop Now', btn1_link: '/product', btn2_text: 'Contact Us', btn2_link: '/contact' }
    ]);

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
        },
        navbar: {
            logo_title: 'EarthVibes',
            logo_subtitle: 'EXPORTS',
            logo_icon: '🧺',
            logo_img: '',
            links: [
                { label: 'Home', path: '/' },
                { label: 'About', path: '/about' },
                { label: 'Product', path: '/product' },
                { label: 'Contact', path: '/contact' }
            ]
        },
        footer: {
            desc: 'We provide premium quality, handpicked fresh fruits delivered directly to your doorstep. Experience the taste of nature in its purest form.',
            address: '123 Fruit Market, Pune, MH, India',
            phone: '+91 98765 43210',
            email: 'support@earthvibesexports.com',
            social_fb: '#',
            social_ig: '#',
            social_tw: '#',
            newsletter_title: 'Newsletter',
            newsletter_desc: 'Subscribe to get updates on new arrivals.'
        }
    });

    const navigate = useNavigate();

    useEffect(() => {
        // Real-time Banners
        const unsubBanners = onSnapshot(collection(firestoreDb, 'banners'), (snapshot) => {
            const bannerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (bannerList.length > 0) {
                setHomeBanners(bannerList.sort((a, b) => a.id - b.id));
            } else {
                // Seed initial banners if empty
                homeBanners.forEach(async (b) => {
                    await setDoc(doc(firestoreDb, 'banners', b.id.toString()), b);
                });
            }
        });

        // Real-time Home Content
        const unsubHomeContent = onSnapshot(doc(firestoreDb, 'settings', 'home'), (snapshot) => {
            if (snapshot.exists()) {
                setHomeContent(snapshot.data());
            } else {
                // Seed initial content if empty
                setDoc(doc(firestoreDb, 'settings', 'home'), homeContent);
            }
        });

        // Real-time Inquiries
        const unsubInquiries = onSnapshot(query(collection(firestoreDb, 'inquiries'), orderBy('id', 'desc')), (snapshot) => {
            setInquiries(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
        });

        // Real-time Orders
        const unsubOrders = onSnapshot(query(collection(firestoreDb, 'orders')), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
            // Sort by Date.now() or displayId descending
            setOrders(list.sort((a, b) => (b.displayId || b.id || 0) - (a.displayId || a.id || 0)));
        });

        window.history.pushState(null, null, window.location.pathname);
        const preventBack = () => {
            window.history.pushState(null, null, window.location.pathname);
        };
        window.addEventListener('popstate', preventBack);

        // Force sign-out on every refresh/initial mount to ensure login page appears
        signOut(auth).catch(err => console.error("Auto signout error:", err));

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });

        return () => {
            window.removeEventListener('popstate', preventBack);
            unsubBanners();
            unsubHomeContent();
            unsubInquiries();
            unsubOrders();
            unsubscribeAuth();
        };
    }, []);

    const handleUpdateBanner = async (id, field, value) => {
        try {
            const bannerRef = doc(firestoreDb, 'banners', id.toString());
            await updateDoc(bannerRef, { [field]: value });
        } catch (e) {
            console.error("Error updating banner:", e);
        }
    };

    const handleUpdateHomeContent = async (updatedContent) => {
        try {
            const homeRef = doc(firestoreDb, 'settings', 'home');
            await setDoc(homeRef, updatedContent);
        } catch (e) {
            console.error("Error updating home content:", e);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const emailInput = loginForm.email.trim().toLowerCase();
        const passwordInput = loginForm.password.trim();

        if (emailInput === 'admin@gmail.com' && passwordInput === 'admin123') {
            setIsLoggedIn(true);
            setActiveTab('dashboard');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
            setIsLoggedIn(true);
            setActiveTab('dashboard');
        } catch (error) {
            if (emailInput === 'admin@gmail.com' && passwordInput === 'admin123') {
                setIsLoggedIn(true);
                setActiveTab('dashboard');
            } else {
                alert('Login failed: ' + error.message);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Fruit Management Handlers
    const handleAddOrUpdateFruit = (e) => {
        e.preventDefault();

        // Clean price and unit to avoid double symbols
        const cleanPrice = String(fruitForm.price).replace(/[₹\s,]/g, '').split('/')[0];
        const formattedPrice = `₹${cleanPrice}/${fruitForm.unit}`;

        // Ensure the primary 'image' field is the first of our 'images' array if provided
        const finalImages = fruitForm.images.filter(img => img.trim() !== '');
        const primaryImage = finalImages.length > 0 ? finalImages[0] : fruitForm.image;

        const finalFruit = {
            ...fruitForm,
            price: formattedPrice,
            image: primaryImage,
            images: finalImages,
            stock: Number(fruitForm.stock) || 0
        };

        if (isEditing) {
            updateProduct(finalFruit);
            alert('Fruit updated successfully!');
        } else {
            addProduct(finalFruit);
            alert('New fruit added successfully!');
        }
        resetForm();
    };

    const handleEditClick = (fruit) => {
        // Parse: ₹180/kg or just 180
        const priceStr = String(fruit.price);
        const priceOnly = priceStr.replace(/[₹\s,]/g, '').split('/')[0];
        const unitOnly = priceStr.includes('/') ? priceStr.split('/')[1] : (fruit.unit || 'kg');

        setFruitForm({
            ...fruit,
            price: priceOnly,
            unit: unitOnly,
            images: fruit.images || [fruit.image].filter(Boolean),
            stock: fruit.stock || 0
        });
        setIsEditing(true);
        setShowForm(true);
    };

    const handleDeleteClick = (id) => {
        if (window.confirm('Are you sure you want to delete this fruit?')) {
            deleteProduct(id);
        }
    };

    const handlePrint = (invoice) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice #${(invoice.displayId || invoice.id || '000000').toString().slice(-6)}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                        .company { color: #10b981; font-size: 24px; font-weight: bold; }
                        .details { margin: 30px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
                        th { background: #f8fafc; }
                        .total { text-align: right; margin-top: 30px; font-size: 20px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company">EarthVibes Exports</div>
                        <div class="invoice-meta">
                            <div>INVOICE: #INV-${(invoice.displayId || invoice.id || '000000').toString().slice(-6)}</div>
                            <div>DATE: ${invoice.date}</div>
                        </div>
                    </div>
                    <div class="details">
                        <p><strong>Billed To:</strong> ${invoice.customerName}</p>
                        <p><strong>Order ID:</strong> #${invoice.id}</p>
                        <p><strong>Status:</strong> ${invoice.status}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(invoice.items || []).map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.price}</td>
                                    <td>₹${(item.quantity * parseFloat(String(item.price).replace(/[₹\s,]/g, ''))) || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="total">Grand Total: ₹${invoice.totalAmount}</div>
                    <div style="margin-top: 50px; font-size: 12px; color: #666; text-align: center;">
                        Thank you for choosing EarthVibes Exports!
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const resetForm = () => {
        setFruitForm({
            id: null,
            name: '',
            category: 'Seasonal',
            price: '',
            unit: 'kg',
            image: '',
            images: [],
            badge: '',
            rating: 5
        });
        setIsEditing(false);
        setShowForm(false);
    };

    // Inquiry Handlers
    const handleResolveInquiry = async (id) => {
        try {
            const inqRef = doc(firestoreDb, 'inquiries', id.toString());
            await updateDoc(inqRef, { status: 'Resolved' });
        } catch (e) {
            console.error("Error resolving inquiry:", e);
        }
    };

    const handleDeleteInquiry = async (id) => {
        if (window.confirm('Are you sure you want to delete this inquiry?')) {
            try {
                await deleteDoc(doc(firestoreDb, 'inquiries', id));
                alert('Inquiry deleted successfully');
            } catch (e) {
                console.error("Error deleting inquiry:", e);
                alert('Failed to delete inquiry: ' + e.message);
            }
        }
    };

    const handleUpdateOrderStatus = async (id, newStatus, order) => {
        try {
            const orderRef = doc(firestoreDb, 'orders', id);
            await updateDoc(orderRef, { status: newStatus });

            // ── STOCK RESTORE ON CANCEL ──
            if (newStatus === 'Cancelled' && order?.items?.length > 0) {
                for (const item of order.items) {
                    const itemName = (item.name || '').trim();
                    const qty = Number(item.quantity) || 1;
                    if (!itemName) continue;

                    try {
                        // Try exact name match first
                        const q = query(collection(firestoreDb, 'products'), where('name', '==', itemName));
                        const snap = await getDocs(q);
                        if (!snap.empty) {
                            await updateDoc(doc(firestoreDb, 'products', snap.docs[0].id), {
                                stock: increment(qty)
                            });
                            console.log(`[STOCK RESTORE ✅] "${itemName}" +${qty}`);
                        } else {
                            // Case-insensitive fallback
                            const allSnap = await getDocs(collection(firestoreDb, 'products'));
                            const match = allSnap.docs.find(d =>
                                (d.data().name || '').trim().toLowerCase() === itemName.toLowerCase()
                            );
                            if (match) {
                                await updateDoc(doc(firestoreDb, 'products', match.id), {
                                    stock: increment(qty)
                                });
                                console.log(`[STOCK RESTORE ✅] Case match: "${match.data().name}" +${qty}`);
                            }
                        }
                    } catch (err) {
                        console.warn(`[STOCK RESTORE ❌] "${itemName}":`, err.message);
                    }
                }
            }
        } catch (e) {
            console.error("Error updating order status:", e);
            alert('Failed to update status');
        }
    };

    const handleUpdateProductField = async (id, field, value) => {
        try {
            // Check if it's a numeric ID or firestore string ID
            const prodRef = doc(firestoreDb, 'products', id.toString());
            await updateDoc(prodRef, { [field]: value });
        } catch (e) {
            console.error("Error updating product field:", e);
        }
    };

    const handleResetAllStock = () => {
        setShowResetModal(true);
    };

    const executeResetAllStock = async () => {
        setShowResetModal(false);
        try {
            const { getDocs, collection: col } = await import('firebase/firestore');
            const allSnap = await getDocs(col(firestoreDb, 'products'));
            const updates = allSnap.docs.map(docSnap =>
                updateDoc(doc(firestoreDb, 'products', docSnap.id), { stock: 0 })
            );
            await Promise.all(updates);
            // Optional: nice toast here. For now rely on UI auto-updating
        } catch (e) {
            console.error('Reset stock error:', e);
            alert('Error resetting stock: ' + e.message);
        }
    };

    const handleDeleteOrder = async (id) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await deleteDoc(doc(firestoreDb, 'orders', id));
                alert('Order deleted successfully');
            } catch (e) {
                console.error("Error deleting order:", e);
                alert('Failed to delete order: ' + e.message);
            }
        }
    };

    // Store Branch Handlers
    const handleSaveBranch = async (e) => {
        e.preventDefault();
        if (isEditingBranch) {
            await updateBranch(branchForm.id, branchForm);
            alert('Store branch updated successfully!');
        } else {
            const newId = branchForm.id.trim() || `branch_${Date.now()}`;
            await addBranch({ ...branchForm, id: newId });
            alert('New store branch added successfully!');
        }
        setShowBranchModal(false);
        setIsEditingBranch(false);
    };

    const handleEditBranch = (branch) => {
        setBranchForm(branch);
        setIsEditingBranch(true);
        setShowBranchModal(true);
    };

    const handleDeleteBranchClick = async (branchId) => {
        if (window.confirm('Are you sure you want to delete this store branch?')) {
            await deleteBranch(branchId);
        }
    };

    // Delivery Boy Assignment Handler
    const handleAssignDeliveryBoy = async (e) => {
        e.preventDefault();
        if (!deliveryBoyModalOrder) return;

        try {
            const orderRef = doc(firestoreDb, 'orders', deliveryBoyModalOrder.firestoreId);
            await updateDoc(orderRef, {
                status: 'Out for Delivery',
                deliveryBoy: {
                    name: deliveryBoyInput.name,
                    phone: deliveryBoyInput.phone,
                    assignedAt: new Date().toLocaleTimeString()
                }
            });
            alert(`Delivery Boy ${deliveryBoyInput.name} assigned to Order #${deliveryBoyModalOrder.displayId || deliveryBoyModalOrder.id}`);
            setDeliveryBoyModalOrder(null);
            setDeliveryBoyInput({ name: '', phone: '' });
        } catch (e) {
            console.error("Error assigning delivery boy:", e);
        }
    };

    const renderContent = () => {
        if (!isLoggedIn && activeTab !== 'login') {
            return (
                <div className="admin-placeholder">
                    <Shield size={64} className="placeholder-icon" />
                    <h2>Access Denied</h2>
                    <p>Please log in to view this section.</p>
                    <button onClick={() => setActiveTab('login')} className="admin-btn">Go to Login</button>
                </div>
            );
        }

        switch (activeTab) {
            case 'login':
                return (
                    <div className="admin-placeholder">
                        <h2>You are already logged in!</h2>
                        <button onClick={handleLogout} className="admin-btn logout">Log Out</button>
                    </div>
                );
            case 'dashboard':
                const totalRevenueValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

                return (
                    <div className="admin-section dashboard-premium">
                        <div className="dashboard-header-main">
                            <h2>EarthVibes Admin Dashboard</h2>
                            <p className="dashboard-subtitle">Real-time overview of your fruit export business</p>
                        </div>

                        {fruits.filter(f => (f.stock || 0) < 20).length > 0 && (
                            <div className="critical-stock-alert">
                                <div className="alert-icon-wrapper">
                                    <Activity size={24} />
                                </div>
                                <div className="alert-text-content">
                                    <h3>Low Stock Alert!</h3>
                                    <p>
                                        {fruits.filter(f => (f.stock || 0) < 20).length} fruits have stock under 20. Please restock them soon.
                                    </p>
                                </div>
                                <div className="alert-fruits-list">
                                    {fruits.filter(f => (f.stock || 0) < 20).slice(0, 3).map(f => (
                                        <button 
                                            key={f.id}
                                            className="quick-edit-stock-btn"
                                            onClick={() => {
                                                setActiveTab('products');
                                                handleEditClick(f);
                                            }}
                                            title="Click to quickly edit product"
                                        >
                                            {f.name} ({f.stock})
                                        </button>
                                    ))}
                                    {fruits.filter(f => (f.stock || 0) < 20).length > 3 && (
                                        <span className="stock-alert-more">
                                            +{fruits.filter(f => (f.stock || 0) < 20).length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}                        <div className="dashboard-stats-grid">
                            <div className="stat-card orders-card">
                                <div className="stat-icon-bg"><ShoppingBag size={24} /></div>
                                <div className="stat-details">
                                    <h3>Total Orders</h3>
                                    <div className="stat-value">{orders.length}</div>
                                    <p className="stat-trend positive">From Website</p>
                                </div>
                            </div>
                            <div className="stat-card revenue-card">
                                <div className="stat-icon-bg"><Shield size={24} /></div>
                                <div className="stat-details">
                                    <h3>Total Revenue</h3>
                                    <div className="stat-value">₹{totalRevenueValue.toLocaleString('en-IN')}</div>
                                    <p className="stat-trend positive">Live Calculations</p>
                                </div>
                            </div>
                            <div className="stat-card inquiries-card">
                                <div className="stat-icon-bg"><MessageSquare size={24} /></div>
                                <div className="stat-details">
                                    <h3>Active Inquiries</h3>
                                    <div className="stat-value">{inquiries.filter(i => i.status === 'Pending').length}</div>
                                    <p className="stat-trend neutral">Customer Support</p>
                                </div>
                            </div>


                        </div>

                        <div className="dashboard-grid-two-col">
                            <div className="dashboard-card recent-activity-card">
                                <div className="card-header">
                                    <h3><Activity size={18} /> Recent Activity</h3>
                                </div>
                                <div className="card-body">
                                    {orders.length === 0 && inquiries.length === 0 ? (
                                        <p className="no-activity">No recent activity found.</p>
                                    ) : (
                                        <div className="activity-timeline">
                                            {orders.slice(0, 3).map(order => (
                                                <div className="activity-item" key={order.id}>
                                                    <div className="activity-dot order-dot"></div>
                                                    <div className="activity-content">
                                                        <p><strong>New Order #{order.id}</strong> placed by {order.customerName}</p>
                                                        <span>{order.date}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {inquiries.slice(0, 2).map(inq => (
                                                <div className="activity-item" key={inq.id}>
                                                    <div className={`activity-dot inq-dot ${inq.status === 'Pending' ? 'pending' : ''}`}></div>
                                                    <div className="activity-content">
                                                        <p><strong>Inquiry from {inq.name}</strong> regarding {inq.fruitQuery}</p>
                                                        <span>{inq.date}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>


                        </div>
                    </div>
                );
            case 'products':
                const displayedFruits = fruits.filter(f => {
                    const matchesTab = subTab === 'all' || 
                                     (subTab === 'seasonal' && f.category === 'Seasonal') ||
                                     (subTab === 'mangoes' && f.category === 'Mangoes') ||
                                     (subTab === 'berries' && f.category === 'Berries') ||
                                     (subTab === 'imported' && f.category === 'Imported') ||
                                     (subTab === 'natural' && f.category === 'Natural Fruits');
                    
                    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        f.category.toLowerCase().includes(searchQuery.toLowerCase());
                    
                    return matchesTab && matchesSearch;
                });

                return (
                    <div className="admin-section">
                        {showResetModal && (
                            <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
                                <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                                    <div style={{ background: '#fee2e2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#dc2626' }}>
                                        <Activity size={32} />
                                    </div>
                                    <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', color: '#111827' }}>Reset All Stock?</h3>
                                    <p style={{ margin: '0 0 24px', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        Are you absolutely sure you want to set the stock to <strong>0</strong> for all products? This action will immediately show "Out of Stock" for everything on the live website.
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                        <button 
                                            onClick={() => setShowResetModal(false)}
                                            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: '600', cursor: 'pointer', flex: 1 }}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={executeResetAllStock}
                                            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: '600', cursor: 'pointer', flex: 1 }}
                                        >
                                            Yes, Reset All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="section-header-flex">
                            <div>
                                <h2>Fruits Management</h2>
                                <div className="search-bar-admin" style={{ marginTop: '10px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Search fruits by name or category..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd', width: '300px', fontSize: '14px' }}
                                    />
                                </div>
                            </div>
                            <button className="admin-btn add-btn" onClick={() => setShowForm(true)}>
                                <Plus size={18} /> Add New Fruit
                            </button>
                            <button
                                className="admin-btn"
                                onClick={handleResetAllStock}
                                style={{ background: '#fff5f5', color: '#dc2626', border: '1.5px solid #fecaca', marginLeft: '8px' }}
                            >
                                Set All Stock → 0
                            </button>
                        </div>

                        {showForm && (
                            <div className="admin-form-overlay">
                                <div className="admin-modal">
                                    <h3>{isEditing ? 'Update Fruit' : 'Add New Fruit'}</h3>
                                    <form onSubmit={handleAddOrUpdateFruit} className="fruit-manage-form">
                                        <div className="form-grid">
                                            <div className="admin-form-group">
                                                <label>Fruit Name</label>
                                                <input
                                                    type="text"
                                                    value={fruitForm.name}
                                                    onChange={(e) => setFruitForm({ ...fruitForm, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="admin-form-group">
                                                <label>Category</label>
                                                <select
                                                    value={fruitForm.category}
                                                    onChange={(e) => setFruitForm({ ...fruitForm, category: e.target.value })}
                                                >
                                                    <option value="Seasonal">Seasonal</option>
                                                    <option value="Mangoes">Mangoes</option>
                                                    <option value="Berries">Berries</option>
                                                    <option value="Imported">Imported</option>
                                                    <option value="Natural Fruits">Natural Fruits</option>
                                                </select>
                                            </div>
                                            <div className="admin-form-group">
                                                <label>Price (₹)</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={fruitForm.price}
                                                    onChange={(e) => setFruitForm({ ...fruitForm, price: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="admin-form-group">
                                                <label>Unit (e.g., kg, dz, box)</label>
                                                <input
                                                    type="text"
                                                    value={fruitForm.unit}
                                                    onChange={(e) => setFruitForm({ ...fruitForm, unit: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="admin-form-group full-row">
                                                <label>Product Images (Multiple Links)</label>
                                                <div className="images-links-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {fruitForm.images.map((imgUrl, idx) => (
                                                        <div key={idx} className="image-link-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <input
                                                                type="text"
                                                                value={imgUrl}
                                                                onChange={(e) => {
                                                                    const newImages = [...fruitForm.images];
                                                                    newImages[idx] = e.target.value;
                                                                    setFruitForm({ ...fruitForm, images: newImages });
                                                                }}
                                                                placeholder={`Image URL #${idx + 1}`}
                                                                style={{ flex: 1 }}
                                                            />
                                                            <div className="img-mini-preview" style={{ width: '40px', height: '40px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #eee', overflow: 'hidden' }}>
                                                                <img src={imgUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=?'} />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="icon-btn delete"
                                                                onClick={() => {
                                                                    const newImages = fruitForm.images.filter((_, i) => i !== idx);
                                                                    setFruitForm({ ...fruitForm, images: newImages });
                                                                }}
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Fallback for primary image if images array is empty */}
                                                    {fruitForm.images.length === 0 && (
                                                        <div className="image-link-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <input
                                                                type="text"
                                                                value={fruitForm.image}
                                                                onChange={(e) => setFruitForm({ ...fruitForm, image: e.target.value })}
                                                                placeholder="Paste primary image URL here"
                                                                style={{ flex: 1 }}
                                                            />
                                                            <div className="img-mini-preview" style={{ width: '40px', height: '40px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #eee', overflow: 'hidden' }}>
                                                                <img src={fruitForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=?'} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="admin-btn"
                                                        style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 12px', background: '#f0fdf4', color: '#10b981', border: '1px solid #bbf7d0' }}
                                                        onClick={() => {
                                                            const currentImages = fruitForm.images.length > 0 ? fruitForm.images : [fruitForm.image].filter(Boolean);
                                                            setFruitForm({ ...fruitForm, images: [...currentImages, ''] });
                                                        }}
                                                    >
                                                        <Plus size={14} /> Add More Image Links
                                                    </button>
                                                </div>
                                                <small style={{ color: '#64748b', marginTop: '5px', display: 'block' }}>You can add multiple image links. The first one will be the primary image.</small>
                                            </div>
                                            <div className="admin-form-group">
                                                <label>Badge (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={fruitForm.badge}
                                                    onChange={(e) => setFruitForm({ ...fruitForm, badge: e.target.value })}
                                                    placeholder="Best Seller, Fresh, etc."
                                                />
                                            </div>
                                            <div className="admin-form-group">
                                                <label>Rating (1-5)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={fruitForm.rating}
                                                    onChange={(e) => setFruitForm({ ...fruitForm, rating: e.target.value })}
                                                />
                                            </div>
                                            <div className="admin-form-group">
                                                <label>Stock Quantity</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={fruitForm.stock}
                                                    onChange={(e) => setFruitForm({ ...fruitForm, stock: e.target.value })}
                                                    placeholder="e.g. 50"
                                                />
                                            </div>


                                        </div>
                                        <div className="modal-actions">
                                            <button type="button" className="admin-btn cancel" onClick={resetForm}>Cancel</button>
                                            <button type="submit" className="admin-btn submit">{isEditing ? 'Update' : 'Add'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="admin-tabs-sub">
                            <button className={`sub-tab ${subTab === 'all' ? 'active' : ''}`} onClick={() => setSubTab('all')}>All ({fruits.length})</button>
                            <button className={`sub-tab ${subTab === 'seasonal' ? 'active' : ''}`} onClick={() => setSubTab('seasonal')}>Seasonal ({fruits.filter(f => f.category === 'Seasonal').length})</button>
                            <button className={`sub-tab ${subTab === 'mangoes' ? 'active' : ''}`} onClick={() => setSubTab('mangoes')}>Mangoes ({fruits.filter(f => f.category === 'Mangoes').length})</button>
                            <button className={`sub-tab ${subTab === 'berries' ? 'active' : ''}`} onClick={() => setSubTab('berries')}>Berries ({fruits.filter(f => f.category === 'Berries').length})</button>
                            <button className={`sub-tab ${subTab === 'imported' ? 'active' : ''}`} onClick={() => setSubTab('imported')}>Imported ({fruits.filter(f => f.category === 'Imported').length})</button>
                        </div>

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Rating</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedFruits.map(fruit => (
                                        <tr key={fruit.id}>
                                            <td>
                                                <img
                                                    src={fruit.image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80'}
                                                    alt={fruit.name}
                                                    className="admin-table-img"
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #34d399' }}
                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80'; }}
                                                />
                                            </td>
                                            <td>
                                                <div className="name-col">
                                                    {fruit.name}
                                                    {fruit.badge && <span className={`badge-mini ${fruit.badge.toLowerCase().replace(/\s+/g, '.')}`}>{fruit.badge}</span>}
                                                </div>
                                            </td>
                                            <td>{fruit.category}</td>
                                            <td>{String(fruit.price).includes('/') ? fruit.price : `₹${fruit.price}/${fruit.unit}`}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        key={`stock-${fruit.id}-${fruit.stock}`}
                                                        defaultValue={fruit.stock || 0}
                                                        onBlur={(e) => handleUpdateProductField(fruit.id || fruit.firestoreId, 'stock', Number(e.target.value))}
                                                        className="stock-inline-input"
                                                        style={{
                                                            width: '70px',
                                                            padding: '6px 8px',
                                                            border: `1.5px solid ${(fruit.stock || 0) === 0 ? '#fca5a5' : (fruit.stock || 0) < 10 ? '#fde68a' : '#e2e8f0'}`,
                                                            borderRadius: '8px',
                                                            fontWeight: '700',
                                                            textAlign: 'center',
                                                            color: (fruit.stock || 0) === 0 ? '#dc2626' : (fruit.stock || 0) < 10 ? '#d97706' : '#059669',
                                                            background: (fruit.stock || 0) === 0 ? '#fff5f5' : (fruit.stock || 0) < 10 ? '#fffbeb' : '#f0fdf4',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    />
                                                    <span style={{
                                                        fontSize: '0.78rem',
                                                        fontWeight: '600',
                                                        color: '#64748b'
                                                    }}>
                                                        {fruit.unit || String(fruit.price).split('/')[1] || ''}
                                                    </span>
                                                </div>
                                                {(fruit.stock || 0) === 0 && (
                                                    <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '3px', fontWeight: '700' }}>🔴 Out of Stock</div>
                                                )}
                                                {(fruit.stock || 0) > 0 && (fruit.stock || 0) < 10 && (
                                                    <div style={{ fontSize: '10px', color: '#d97706', marginTop: '3px', fontWeight: '700' }}>⚠ Low Stock</div>
                                                )}
                                            </td>
                                            <td>{fruit.rating} ⭐</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="icon-btn edit" onClick={() => handleEditClick(fruit)} title="Edit"><Edit size={16} /></button>
                                                    <button className="icon-btn delete" onClick={() => handleDeleteClick(fruit.id)} title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'inquiries':
                return (
                    <div className="admin-section">
                        <h2>User Inquiries (Live)</h2>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone No</th>
                                        <th>Email ID</th>
                                        <th>Fruit Inquiry</th>
                                        <th>Message</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inquiries.length > 0 ? inquiries.map(inq => (
                                        <tr key={inq.firestoreId}>
                                            <td>{inq.name}</td>
                                            <td>{inq.phone}</td>
                                            <td>{inq.email}</td>
                                            <td>{inq.fruitQuery}</td>
                                            <td>{inq.message}</td>
                                            <td><span className={`status ${inq.status.toLowerCase()}`}>{inq.status}</span></td>
                                            <td>
                                                <div className="table-actions">
                                                    {inq.status === 'Pending' && (
                                                        <button className="icon-btn edit" onClick={() => handleResolveInquiry(inq.firestoreId)} title="Mark Resolved"><CheckCircle size={16} /></button>
                                                    )}
                                                    <button className="icon-btn delete" onClick={() => handleDeleteInquiry(inq.firestoreId)} title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                                No inquiries found from website users.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'stores':
                return (
                    <div className="admin-section">
                        <div className="section-header-flex">
                            <div>
                                <h2>Hyperlocal Stores & Delivery Radius</h2>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Manage store branches (Satara, Koregaon, etc.) and set delivery coverage radius in KM.</p>
                            </div>
                            <button
                                className="admin-btn add-btn"
                                onClick={() => {
                                    setBranchForm({ id: `branch_${Date.now()}`, name: '', address: '', lat: 17.6805, lng: 74.0183, radiusKm: 3, phone: '' });
                                    setIsEditingBranch(false);
                                    setShowBranchModal(true);
                                }}
                            >
                                <Plus size={18} /> Add New Store Branch
                            </button>
                        </div>

                        {showBranchModal && (
                            <div className="admin-form-overlay">
                                <div className="admin-modal">
                                    <h3>{isEditingBranch ? 'Edit Store Branch' : 'Add New Store Branch'}</h3>
                                    <form onSubmit={handleSaveBranch} className="fruit-manage-form">
                                        <div className="form-grid">
                                            <div className="admin-form-group">
                                                <label>Branch Name</label>
                                                <input
                                                    type="text"
                                                    value={branchForm.name}
                                                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                                                    placeholder="e.g. Satara Store / Koregaon Branch"
                                                    required
                                                />
                                            </div>
                                            <div className="admin-form-group">
                                                <label>Delivery Radius (KM)</label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0.5"
                                                    value={branchForm.radiusKm}
                                                    onChange={(e) => setBranchForm({ ...branchForm, radiusKm: e.target.value })}
                                                    placeholder="3"
                                                    required
                                                />
                                            </div>
                                            <div className="admin-form-group full-row">
                                                <label>Branch Full Address</label>
                                                <input
                                                    type="text"
                                                    value={branchForm.address}
                                                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                                                    placeholder="Building, Street, City, Pin Code"
                                                    required
                                                />
                                            </div>
                                            <div className="admin-form-group">
                                                <label>Latitude (GPS)</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={branchForm.lat}
                                                    onChange={(e) => setBranchForm({ ...branchForm, lat: e.target.value })}
                                                    placeholder="17.6805"
                                                    required
                                                />
                                            </div>
                                            <div className="admin-form-group">
                                                <label>Longitude (GPS)</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={branchForm.lng}
                                                    onChange={(e) => setBranchForm({ ...branchForm, lng: e.target.value })}
                                                    placeholder="74.0183"
                                                    required
                                                />
                                            </div>
                                            <div className="admin-form-group full-row">
                                                <label>Store Helpline Phone</label>
                                                <input
                                                    type="text"
                                                    value={branchForm.phone}
                                                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                                                    placeholder="+91 98220 12345"
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                            <button type="submit" className="admin-btn add-btn" style={{ flex: 1 }}>Save Branch</button>
                                            <button type="button" className="admin-btn" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => setShowBranchModal(false)}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Branch Name</th>
                                        <th>Address</th>
                                        <th>Delivery Radius</th>
                                        <th>GPS Coordinates</th>
                                        <th>Contact Phone</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branches.map(branch => (
                                        <tr key={branch.id}>
                                            <td style={{ fontWeight: 'bold', color: '#166534' }}>
                                                <MapPin size={16} inline style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                {branch.name}
                                            </td>
                                            <td style={{ fontSize: '0.88rem' }}>{branch.address}</td>
                                            <td>
                                                <span className="badge-mini" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
                                                    {branch.radiusKm || 3} KM Max
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                                {branch.lat}, {branch.lng}
                                            </td>
                                            <td>{branch.phone || 'N/A'}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="icon-btn edit" onClick={() => handleEditBranch(branch)} title="Edit"><Edit size={16} /></button>
                                                    <button className="icon-btn delete" onClick={() => handleDeleteBranchClick(branch.id)} title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'delivery_rules':
                return (
                    <div className="admin-section">
                        <h2>Delivery Charge & Free Delivery Threshold</h2>
                        <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '600px', marginBottom: '30px' }}>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                updateDeliverySettings({
                                    ...deliverySettings,
                                    minFreeDeliveryAmount: Number(deliveryRulesForm.minFreeDeliveryAmount),
                                    defaultDeliveryFee: Number(deliveryRulesForm.defaultDeliveryFee)
                                });
                                alert('Delivery charges settings updated live!');
                            }}>
                                <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ fontWeight: 'bold', color: '#1e293b' }}>Minimum Order for Free Delivery (₹)</label>
                                    <input
                                        type="number"
                                        value={deliveryRulesForm.minFreeDeliveryAmount ?? deliverySettings?.minFreeDeliveryAmount ?? 500}
                                        onChange={(e) => setDeliveryRulesForm({ ...deliveryRulesForm, minFreeDeliveryAmount: e.target.value })}
                                        placeholder="500"
                                        required
                                        style={{ padding: '12px', fontSize: '1rem' }}
                                    />
                                    <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Orders above this total get ₹0 Free Shipping.</small>
                                </div>

                                <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ fontWeight: 'bold', color: '#1e293b' }}>Standard Shipping Fee (₹)</label>
                                    <input
                                        type="number"
                                        value={deliveryRulesForm.defaultDeliveryFee ?? deliverySettings?.defaultDeliveryFee ?? 40}
                                        onChange={(e) => setDeliveryRulesForm({ ...deliveryRulesForm, defaultDeliveryFee: e.target.value })}
                                        placeholder="40"
                                        required
                                        style={{ padding: '12px', fontSize: '1rem' }}
                                    />
                                    <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Charged when order total is less than free delivery limit.</small>
                                </div>

                                <button type="submit" className="admin-btn add-btn" style={{ width: '100%', padding: '12px' }}>
                                    Save Delivery Rules
                                </button>
                            </form>
                        </div>
                    </div>
                );

            case 'orders':
                const displayedOrders = orders.filter(o =>
                    (o.customerName || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                    (o.displayId || o.id || '').toString().includes(orderSearchQuery) ||
                    (o.status || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                    (o.storeBranch || '').toLowerCase().includes(orderSearchQuery.toLowerCase())
                );

                return (
                    <div className="admin-section">
                        <div className="section-header-flex">
                            <h2>Order History & Dispatch Workflow</h2>
                            <input
                                type="text"
                                placeholder="Search by customer, store or order ID..."
                                value={orderSearchQuery}
                                onChange={(e) => setOrderSearchQuery(e.target.value)}
                                style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd', width: '280px', fontSize: '14px' }}
                            />
                        </div>

                        {/* Delivery Boy Assignment Modal */}
                        {deliveryBoyModalOrder && (
                            <div className="admin-form-overlay">
                                <div className="admin-modal" style={{ maxWidth: '450px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Assign Delivery Executive</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                                        Order #{deliveryBoyModalOrder.displayId || deliveryBoyModalOrder.id} for <strong>{deliveryBoyModalOrder.customerName}</strong>
                                    </p>
                                    <form onSubmit={handleAssignDeliveryBoy}>
                                        <div className="admin-form-group" style={{ marginBottom: '15px' }}>
                                            <label>Delivery Boy Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Ramesh Kumar"
                                                value={deliveryBoyInput.name}
                                                onChange={(e) => setDeliveryBoyInput({ ...deliveryBoyInput, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                                            <label>Delivery Boy Phone Number</label>
                                            <input
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                value={deliveryBoyInput.phone}
                                                onChange={(e) => setDeliveryBoyInput({ ...deliveryBoyInput, phone: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="submit" className="admin-btn add-btn" style={{ flex: 1 }}>
                                                Assign & Dispatch
                                            </button>
                                            <button type="button" className="admin-btn" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => setDeliveryBoyModalOrder(null)}>
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer & Address</th>
                                        <th>Fulfilling Store</th>
                                        <th>Total (Locked)</th>
                                        <th>Delivery Executive</th>
                                        <th>Order Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedOrders.length > 0 ? displayedOrders.map(order => (
                                        <tr key={order.firestoreId}>
                                            <td style={{ fontWeight: 'bold' }}>#{(order.displayId || order.id || '000000').toString().slice(-6)}</td>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{order.address || order.city}</div>
                                            </td>
                                            <td>
                                                <span className="badge-mini" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '10px' }}>
                                                    {order.storeBranch || 'Satara Store'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 'bold', color: '#166534' }}>
                                                ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td>
                                                {order.deliveryBoy?.name ? (
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <strong style={{ color: '#1e293b' }}>{order.deliveryBoy.name}</strong>
                                                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{order.deliveryBoy.phone}</div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setDeliveryBoyModalOrder(order);
                                                            setDeliveryBoyInput({ name: '', phone: '' });
                                                        }}
                                                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        + Assign Boy
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <select
                                                    className={`status-select ${(order.status || '').toLowerCase().replace(/\s+/g, '.')}`}
                                                    value={order.status || 'Order Placed'}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value;
                                                        if (newStatus === 'Out for Delivery' && !order.deliveryBoy?.name) {
                                                            setDeliveryBoyModalOrder(order);
                                                        }
                                                        handleUpdateOrderStatus(order.firestoreId, newStatus, order);
                                                    }}
                                                >
                                                    <option value="Order Placed">Order Placed</option>
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Packing">Packing</option>
                                                    <option value="Out for Delivery">Out for Delivery</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="icon-btn edit" onClick={() => setSelectedInvoice(order)} title="View Detail"><Eye size={16} /></button>
                                                    <button className="icon-btn delete" onClick={() => handleDeleteOrder(order.firestoreId)} title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                                No matching orders found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'invoices':
                return (
                    <div className="admin-section">
                        <h2>Invoices</h2>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length > 0 ? orders.map(order => (
                                        <tr key={order.firestoreId}>
                                            <td style={{ fontWeight: '600', color: '#10b981' }}>#INV-{(order.displayId || order.id || '000000').toString().slice(-6)}</td>
                                            <td>#{(order.displayId || order.id || '000000').toString().slice(-6)}</td>
                                            <td>{order.customerName}</td>
                                            <td>{order.date}</td>
                                            <td>₹{order.totalAmount}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="icon-btn edit" onClick={() => setSelectedInvoice(order)} title="View Detail"><Eye size={16} /></button>
                                                    <button className="icon-btn edit" onClick={() => handlePrint(order)} title="Print"><Printer size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                                No invoices generated yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'home_management':
                return (
                    <div className="admin-section">
                        <div className="section-header-flex">
                            <h2>Home Page Content Management</h2>
                            <button className="admin-btn add-btn" onClick={() => {
                                if (window.confirm('Are you sure you want to reset all site content to defaults?')) {
                                    const defaultContent = {
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
                                        },
                                            navbar: {
                                                logo_title: 'EarthVibes',
                                                logo_subtitle: 'EXPORTS',
                                                logo_icon: '🧺',
                                                links: [
                                                    { label: 'Home', path: '/' },
                                                    { label: 'About', path: '/about' },
                                                    { label: 'Product', path: '/product' },
                                                    { label: 'Contact', path: '/contact' }
                                                ]
                                            },
                                            footer: {
                                                desc: 'We provide premium quality, handpicked fresh fruits delivered directly to your doorstep. Experience the taste of nature in its purest form.',
                                                address: '123 Fruit Market, Pune, MH, India',
                                                phone: '+91 98765 43210',
                                                email: 'support@earthvibesexports.com',
                                                social_fb: '#',
                                                social_ig: '#',
                                                social_tw: '#',
                                                newsletter_title: 'Newsletter',
                                                newsletter_desc: 'Subscribe to get updates on new arrivals.'
                                            }
                                        };
                                    handleUpdateHomeContent(defaultContent);
                                    alert('Content reset successfully');
                                }
                            }}>
                                Reset to Defaults
                            </button>
                        </div>
                        <p style={{ color: '#64748b', marginBottom: '25px' }}>Update the banners, headings, and images on your home page.</p>

                        {/* Banner Management */}
                        <div className="admin-card-header" style={{ marginTop: '30px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Edit2 size={18} /> Hero Slider Banners</h3>
                        </div>
                        <div className="banners-management-grid">
                            {homeBanners.map((banner, index) => (
                                <div key={banner.id} className="banner-edit-card">
                                    <h4 style={{ color: '#10b981', marginBottom: '15px', borderBottom: '1px solid #f0fdf4', paddingBottom: '10px' }}>Slide #{index + 1}</h4>
                                    <div className="admin-form-group">
                                        <label>Banner Badge</label>
                                        <input type="text" value={banner.badge} onChange={(e) => handleUpdateBanner(banner.id, 'badge', e.target.value)} />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Main Title</label>
                                        <textarea rows="2" value={banner.title} onChange={(e) => handleUpdateBanner(banner.id, 'title', e.target.value)} />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Description</label>
                                        <textarea rows="3" value={banner.desc} onChange={(e) => handleUpdateBanner(banner.id, 'desc', e.target.value)} />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Banner Image URL</label>
                                        <input type="text" value={banner.image} onChange={(e) => handleUpdateBanner(banner.id, 'image', e.target.value)} placeholder="Paste URL here..." />
                                    </div>
                                    <div className="form-grid">
                                        <div className="admin-form-group">
                                            <label>Button 1 Text</label>
                                            <input type="text" value={banner.btn1_text || 'Shop Now'} onChange={(e) => handleUpdateBanner(banner.id, 'btn1_text', e.target.value)} />
                                        </div>
                                        <div className="admin-form-group">
                                            <label>Button 1 Link</label>
                                            <input type="text" value={banner.btn1_link || '/product'} onChange={(e) => handleUpdateBanner(banner.id, 'btn1_link', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-grid">
                                        <div className="admin-form-group">
                                            <label>Button 2 Text</label>
                                            <input type="text" value={banner.btn2_text || 'Contact Us'} onChange={(e) => handleUpdateBanner(banner.id, 'btn2_text', e.target.value)} />
                                        </div>
                                        <div className="admin-form-group">
                                            <label>Button 2 Link</label>
                                            <input type="text" value={banner.btn2_link || '/contact'} onChange={(e) => handleUpdateBanner(banner.id, 'btn2_link', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="banner-preview-img">
                                        <img src={banner.image || (banner.id === 1 ? 'https://via.placeholder.com/400x150?text=Default+Fruit+Shelf' : '')} alt="Preview" onError={(e) => e.target.src = 'https://via.placeholder.com/400x150?text=Invalid+Image+URL'} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Features Bar */}
                        <div className="admin-card-header">
                            <h3><Truck size={18} /> Features Bar</h3>
                        </div>
                        <div className="features-management-grid">
                            {(homeContent.features || []).map((feature, idx) => (
                                <div key={idx} className="banner-edit-card">
                                    <h4 style={{ color: '#3b82f6', marginBottom: '15px' }}>Feature #{idx + 1}</h4>
                                    <div className="admin-form-group">
                                        <label>Icon Name (e.g. Truck, ShieldCheck, Clock)</label>
                                        <input type="text" value={feature.icon} onChange={(e) => {
                                            const newFeatures = [...homeContent.features];
                                            newFeatures[idx].icon = e.target.value;
                                            handleUpdateHomeContent({ ...homeContent, features: newFeatures });
                                        }} />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Title</label>
                                        <input type="text" value={feature.title} onChange={(e) => {
                                            const newFeatures = [...homeContent.features];
                                            newFeatures[idx].title = e.target.value;
                                            handleUpdateHomeContent({ ...homeContent, features: newFeatures });
                                        }} />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Description</label>
                                        <input type="text" value={feature.desc} onChange={(e) => {
                                            const newFeatures = [...homeContent.features];
                                            newFeatures[idx].desc = e.target.value;
                                            handleUpdateHomeContent({ ...homeContent, features: newFeatures });
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Section Header */}
                        <div className="admin-card-header">
                            <h3><ShoppingBag size={18} /> Featured Section Title</h3>
                        </div>
                        <div className="banner-edit-card">
                            <div className="admin-form-group">
                                <label>Section Subtitle</label>
                                <input type="text" value={homeContent?.featured_section?.subtitle} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, featured_section: { ...homeContent.featured_section, subtitle: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Section Main Title</label>
                                <input type="text" value={homeContent?.featured_section?.title} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, featured_section: { ...homeContent.featured_section, title: e.target.value } });
                                }} />
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="admin-card-header">
                            <h3><Shield size={18} /> About Section Content</h3>
                        </div>
                        <div className="banner-edit-card section-margin">
                            <div className="admin-form-group">
                                <label>About Subtitle</label>
                                <input type="text" value={homeContent?.about_section?.subtitle} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, about_section: { ...homeContent.about_section, subtitle: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>About Main Title</label>
                                <input type="text" value={homeContent?.about_section?.title} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, about_section: { ...homeContent.about_section, title: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Description Content</label>
                                <textarea rows="4" value={homeContent?.about_section?.desc} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, about_section: { ...homeContent.about_section, desc: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Experience Years (e.g., 20+ Years)</label>
                                <input type="text" value={homeContent?.about_section?.exp_years} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, about_section: { ...homeContent.about_section, exp_years: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Experience Label (e.g., of Excellence)</label>
                                <input type="text" value={homeContent?.about_section?.exp_label} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, about_section: { ...homeContent.about_section, exp_label: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>About Section Side Image URL</label>
                                <input type="text" value={homeContent?.about_section?.image} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, about_section: { ...homeContent.about_section, image: e.target.value } });
                                }} placeholder="Paste image URL here (Leave empty for default shelf image)" />
                            </div>
                            
                            <h4 className="sub-header-mini">Stat Highlights</h4>
                            <div className="stat-highlights-grid">
                                {(homeContent?.about_section?.highlights || []).map((high, idx) => (
                                    <div key={idx} className="highlight-item-card">
                                        <div className="admin-form-group">
                                            <input type="text" placeholder="Value (e.g., 25+)" value={high.num} onChange={(e) => {
                                                const newHighlights = [...homeContent.about_section.highlights];
                                                newHighlights[idx].num = e.target.value;
                                                handleUpdateHomeContent({ ...homeContent, about_section: { ...homeContent.about_section, highlights: newHighlights } });
                                            }} />
                                        </div>
                                        <div className="admin-form-group" style={{ marginBottom: 0 }}>
                                            <input type="text" placeholder="Label" value={high.label} onChange={(e) => {
                                                const newHighlights = [...homeContent.about_section.highlights];
                                                newHighlights[idx].label = e.target.value;
                                                handleUpdateHomeContent({ ...homeContent, about_section: { ...homeContent.about_section, highlights: newHighlights } });
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Navbar Management */}
                        <div className="admin-card-header">
                            <h3><Shield size={18} /> Navbar Settings</h3>
                        </div>
                        <div className="banner-edit-card section-margin">
                            <div className="admin-form-group">
                                <label>Logo Title</label>
                                <input type="text" value={homeContent?.navbar?.logo_title} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, navbar: { ...homeContent.navbar, logo_title: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Logo Subtitle</label>
                                <input type="text" value={homeContent?.navbar?.logo_subtitle} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, navbar: { ...homeContent.navbar, logo_subtitle: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Logo Icon (Emoji or Text)</label>
                                <input type="text" value={homeContent?.navbar?.logo_icon} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, navbar: { ...homeContent.navbar, logo_icon: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Custom Logo Image URL (Overrides Icon)</label>
                                <input type="text" value={homeContent?.navbar?.logo_img} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, navbar: { ...homeContent.navbar, logo_img: e.target.value } });
                                }} placeholder="Paste image URL (Optional)" />
                            </div>
                            
                            <h4 className="sub-header-mini">Navigation Links</h4>
                            <div className="stat-highlights-grid">
                                {(homeContent?.navbar?.links || []).map((link, idx) => (
                                    <div key={idx} className="highlight-item-card">
                                        <div className="admin-form-group">
                                            <input type="text" placeholder="Link Label" value={link.label} onChange={(e) => {
                                                const newLinks = [...homeContent.navbar.links];
                                                newLinks[idx].label = e.target.value;
                                                handleUpdateHomeContent({ ...homeContent, navbar: { ...homeContent.navbar, links: newLinks } });
                                            }} />
                                        </div>
                                        <div className="admin-form-group" style={{ marginBottom: 0 }}>
                                            <input type="text" placeholder="Path (e.g. /about)" value={link.path} onChange={(e) => {
                                                const newLinks = [...homeContent.navbar.links];
                                                newLinks[idx].path = e.target.value;
                                                handleUpdateHomeContent({ ...homeContent, navbar: { ...homeContent.navbar, links: newLinks } });
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Management */}
                        <div className="admin-card-header">
                            <h3><FileText size={18} /> Footer Settings</h3>
                        </div>
                        <div className="banner-edit-card">
                            <div className="admin-form-group">
                                <label>Footer Description</label>
                                <textarea rows="3" value={homeContent?.footer?.desc} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, footer: { ...homeContent.footer, desc: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Full Address</label>
                                <input type="text" value={homeContent?.footer?.address} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, footer: { ...homeContent.footer, address: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Contact Phone</label>
                                <input type="text" value={homeContent?.footer?.phone} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, footer: { ...homeContent.footer, phone: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Contact Email</label>
                                <input type="text" value={homeContent?.footer?.email} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, footer: { ...homeContent.footer, email: e.target.value } });
                                }} />
                            </div>
                            <div className="form-grid-three">
                                <div className="admin-form-group">
                                    <label>Facebook URL</label>
                                    <input type="text" value={homeContent?.footer?.social_fb} onChange={(e) => {
                                        handleUpdateHomeContent({ ...homeContent, footer: { ...homeContent.footer, social_fb: e.target.value } });
                                    }} />
                                </div>
                                <div className="admin-form-group">
                                    <label>Instagram URL</label>
                                    <input type="text" value={homeContent?.footer?.social_ig} onChange={(e) => {
                                        handleUpdateHomeContent({ ...homeContent, footer: { ...homeContent.footer, social_ig: e.target.value } });
                                    }} />
                                </div>
                                <div className="admin-form-group">
                                    <label>Twitter URL</label>
                                    <input type="text" value={homeContent?.footer?.social_tw} onChange={(e) => {
                                        handleUpdateHomeContent({ ...homeContent, footer: { ...homeContent.footer, social_tw: e.target.value } });
                                    }} />
                                </div>
                            </div>

                            <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#64748b' }}>Newsletter Section</h4>
                            <div className="admin-form-group">
                                <label>Newsletter Title</label>
                                <input type="text" value={homeContent?.footer?.newsletter_title} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, footer: { ...homeContent.footer, newsletter_title: e.target.value } });
                                }} />
                            </div>
                            <div className="admin-form-group">
                                <label>Newsletter Description</label>
                                <input type="text" value={homeContent?.footer?.newsletter_desc} onChange={(e) => {
                                    handleUpdateHomeContent({ ...homeContent, footer: { ...homeContent.footer, newsletter_desc: e.target.value } });
                                }} />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="admin-login-standalone">
                <div className="login-overlay">
                    <div className="admin-login-card premium">
                        <div className="login-header">
                            <Shield size={60} className="login-logo-big" />
                            <h1>Earth Vibes Exports</h1>
                            <p>Administrator Login Portal</p>
                        </div>
                        <form onSubmit={handleLogin} className="admin-login-form" autoComplete="off">
                            <div className="admin-form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                    placeholder="admin@gmail.com"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    placeholder="admin123"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <button type="submit" className="login-btn-premium">Sign In</button>
                        </form>
                        <div className="login-footer">
                            <Link to="/">Back to Website Home</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'mobile-visible' : ''}`}>
                <div className="admin-sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Shield className="admin-logo-icon" size={28} />
                        <h2>EarthVibes Admin</h2>
                    </div>
                    <button className="mobile-sidebar-close" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
                <nav className="admin-nav">
                    <ul>
                        {/* Removed redundant login tab */}
                        {isLoggedIn && (
                            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
                                <LayoutDashboard size={20} /> Dashboard
                            </li>
                        )}
                        <li className={activeTab === 'products' ? 'active' : ''} onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}>
                            <Apple size={20} /> Fruits Management
                        </li>
                        <li className={activeTab === 'inquiries' ? 'active' : ''} onClick={() => { setActiveTab('inquiries'); setIsSidebarOpen(false); }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <MessageSquare size={20} /> Inquiries
                                </div>
                                {inquiries.filter(i => i.status === 'Pending').length > 0 && (
                                    <span className="sidebar-badge-count" style={{ background: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>
                                        {inquiries.filter(i => i.status === 'Pending').length}
                                    </span>
                                )}
                            </div>
                        </li>
                        <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ShoppingBag size={20} /> Order History
                                </div>
                                {orders.filter(o => o.status === 'Processing' || o.status === 'Pending' || o.status === 'Order Placed').length > 0 && (
                                    <span className="sidebar-badge-count" style={{ background: '#3b82f6', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>
                                        {orders.filter(o => o.status === 'Processing' || o.status === 'Pending' || o.status === 'Order Placed').length}
                                    </span>
                                )}
                            </div>
                        </li>
                        <li className={activeTab === 'stores' ? 'active' : ''} onClick={() => { setActiveTab('stores'); setIsSidebarOpen(false); }}>
                            <MapPin size={20} /> Branches & Radius
                        </li>
                        <li className={activeTab === 'delivery_rules' ? 'active' : ''} onClick={() => { setActiveTab('delivery_rules'); setIsSidebarOpen(false); }}>
                            <Truck size={20} /> Delivery Rules
                        </li>
                        <li className={activeTab === 'invoices' ? 'active' : ''} onClick={() => { setActiveTab('invoices'); setIsSidebarOpen(false); }}>
                            <FileText size={20} /> Invoices
                        </li>
                        <li className={activeTab === 'home_management' ? 'active' : ''} onClick={() => { setActiveTab('home_management'); setIsSidebarOpen(false); }}>
                            <Edit2 size={20} /> Home Page Settings
                        </li>
                    </ul>
                </nav>
                <div className="admin-sidebar-footer">
                    {isLoggedIn && (
                        <button className="logout-btn" onClick={handleLogout}>
                            <LogOut size={20} /> Logout
                        </button>
                    )}
                    <Link to="/" className="back-home-link">Back to Website</Link>
                </div>
            </aside>
            <main className="admin-main">
                <div className="admin-topbar">
                    <div className="admin-topbar-left">
                        <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="admin-breadcrumb">
                        Admin / <span>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                    </div>
                    </div>
                    <div className="admin-user-info">
                        {isLoggedIn ? (
                            <span className="logged-in-badge">Logged in as Admin</span>
                        ) : (
                            <span className="guest-badge">Guest Session</span>
                        )}
                    </div>
                </div>
                <div className="admin-content-wrapper">
                    {renderContent()}
                </div>
            </main>

            {/* Invoice Detail Modal */}
            {selectedInvoice && (
                <div className="admin-form-overlay">
                    <div className="admin-modal" style={{ maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Invoice & Dispatch Details</h3>
                            <button className="icon-btn" style={{ background: 'none' }} onClick={() => setSelectedInvoice(null)}><X size={20} /></button>
                        </div>
                        <div className="invoice-viewer" style={{ border: '1px solid #e2e8f0', padding: '24px', borderRadius: '12px', background: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
                                <div>
                                    <h4 style={{ color: '#166534', margin: '0 0 4px 0', fontSize: '1.2rem' }}>EarthVibes Hyperlocal</h4>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Fulfilling Store: <strong>{selectedInvoice.storeBranch || 'Satara Store'}</strong></span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', color: '#15803d' }}>#INV-{(selectedInvoice.displayId || selectedInvoice.id || '000000').toString().slice(-6)}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Date: {selectedInvoice.date}</div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '15px', fontSize: '14px', textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <strong>Customer:</strong> {selectedInvoice.customerName}<br />
                                    <strong>Phone:</strong> {selectedInvoice.phone || 'N/A'}<br />
                                    <strong>Address:</strong> {selectedInvoice.address || selectedInvoice.city}
                                </div>
                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                    <strong>Status:</strong> <span style={{ color: '#15803d', fontWeight: 'bold' }}>{selectedInvoice.status || 'Order Placed'}</span><br />
                                    <strong>Delivery Executive:</strong> {selectedInvoice.deliveryBoy?.name ? `${selectedInvoice.deliveryBoy.name} (${selectedInvoice.deliveryBoy.phone})` : 'Not Assigned Yet'}<br />
                                    <strong>Payment Method:</strong> {(selectedInvoice.paymentMethod || 'COD').toUpperCase()}
                                </div>
                            </div>
                            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '10px' }}>Item (Price Locked)</th>
                                        <th style={{ textAlign: 'center', padding: '10px' }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '10px' }}>Locked Price</th>
                                        <th style={{ textAlign: 'right', padding: '10px' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedInvoice.items || []).map((item, idx) => {
                                        const pVal = Number(item.unitPriceNumeric) || parseFloat(String(item.priceAtPurchase || item.price || '0').replace(/[^\d.]/g, '')) || 0;
                                        const qVal = Number(item.quantity) || 1;
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px', textAlign: 'left', fontWeight: '500' }}>{item.name}</td>
                                                <td style={{ textAlign: 'center', padding: '10px' }}>{qVal}</td>
                                                <td style={{ textAlign: 'right', padding: '10px', color: '#64748b' }}>₹{pVal.toLocaleString('en-IN')}</td>
                                                <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>₹{(pVal * qVal).toLocaleString('en-IN')}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px dashed #cbd5e1', fontSize: '14px' }}>
                                {selectedInvoice.subtotal && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
                                        <span>Subtotal:</span>
                                        <span>₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {selectedInvoice.discountAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 'bold', marginBottom: '4px' }}>
                                        <span>Discount ({selectedInvoice.appliedCouponCode || 'Coupon'}):</span>
                                        <span>- ₹{selectedInvoice.discountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '8px' }}>
                                    <span>Delivery Charge:</span>
                                    <span>{selectedInvoice.deliveryFee === 0 ? 'FREE' : `₹${selectedInvoice.deliveryFee ?? 40}`}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#166534', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                    <span>Grand Total:</span>
                                    <span>₹{selectedInvoice.totalAmount?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button className="admin-btn cancel" onClick={() => setSelectedInvoice(null)}>Close</button>
                            <button className="admin-btn submit" onClick={() => handlePrint(selectedInvoice)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Printer size={18} /> Print Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
