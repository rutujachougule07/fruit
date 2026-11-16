import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { firestoreDb, auth } from './firebase';
import { collection, addDoc, doc as firestoreDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { CreditCard, Truck, ShieldCheck, Banknote, Shield, Package, ChevronRight, ArrowLeft, FileText, MapPin, Tag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import './Checkout.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Checkout = () => {
    const { cartItems, totalPrice: cartTotal, clearCart } = useCart();
    const { branches, deliverySettings, checkDeliveryArea } = useStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Protection: Redirect if not logged in
    useEffect(() => {
        const isDemoUser = localStorage.getItem('demo_user') === 'true';
        if (!auth.currentUser && !isDemoUser) {
            navigate('/login');
        }
    }, [navigate]);

    const buyNowItem = location.state?.buyNowItem;
    const displayItems = buyNowItem ? [buyNowItem] : cartItems;

    const calculateSubtotal = () => {
        if (buyNowItem) {
            return parseFloat(buyNowItem.displayPrice.replace(/[^\d.]/g, '')) || 0;
        }
        return cartTotal;
    };

    const subtotal = calculateSubtotal();

    // Dynamic Delivery Fee based on settings (e.g. Free if >= ₹500, else ₹40)
    const minFreeAmount = deliverySettings?.minFreeDeliveryAmount ?? 500;
    const defaultFee = deliverySettings?.defaultDeliveryFee ?? 40;
    const deliveryFee = subtotal >= minFreeAmount ? 0 : defaultFee;

    // Coupon handling
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');

    const handleApplyCoupon = () => {
        setCouponError('');
        const trimmed = couponCode.trim().toUpperCase();
        if (!trimmed) return;

        const availableCoupons = deliverySettings?.coupons || [
            { code: 'FRESH50', type: 'flat', discount: 50, minOrder: 300, desc: '₹50 Flat Off' },
            { code: 'WELCOME10', type: 'percent', discount: 10, minOrder: 200, desc: '10% Off' },
            { code: 'FRUIT20', type: 'percent', discount: 20, minOrder: 600, desc: '20% Off' }
        ];

        const found = availableCoupons.find(c => c.code.toUpperCase() === trimmed);
        if (!found) {
            setCouponError('Invalid coupon code.');
            setAppliedCoupon(null);
            return;
        }

        if (subtotal < (found.minOrder || 0)) {
            setCouponError(`Coupon valid on minimum order of ₹${found.minOrder}`);
            setAppliedCoupon(null);
            return;
        }

        let discountVal = 0;
        if (found.type === 'flat') {
            discountVal = found.discount;
        } else if (found.type === 'percent') {
            discountVal = Math.round((subtotal * found.discount) / 100);
        }

        setAppliedCoupon({ ...found, discountAmount: discountVal });
    };

    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const grandTotal = Math.max(0, subtotal - discountAmount) + deliveryFee;

    // Location & Radius Verification State
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [customerCoords, setCustomerCoords] = useState({ lat: 17.6830, lng: 74.0210 }); // Satara default near centre
    const [isLocating, setIsLocating] = useState(false);
    const [locationNotice, setLocationNotice] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [placedOrderDetails, setPlacedOrderDetails] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        address: 'Powai Naka, near Rajwada',
        city: 'Satara',
        zipCode: '415001',
        phone: ''
    });

    // Auto-select initial branch if present
    useEffect(() => {
        if (branches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(branches[0].id);
        }
    }, [branches, selectedBranchId]);

    // Check delivery area dynamically
    const deliveryCheck = checkDeliveryArea(customerCoords.lat, customerCoords.lng, selectedBranchId);

    const handleGetGPSLocation = () => {
        if (!navigator.geolocation) {
            setLocationNotice("Geolocation is not supported by your browser.");
            return;
        }

        setIsLocating(true);
        setLocationNotice("Fetching live coordinates...");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCustomerCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
                setIsLocating(false);
                setLocationNotice("📍 GPS coordinates detected!");
            },
            (err) => {
                setIsLocating(false);
                setLocationNotice("Could not fetch GPS location. Using address coordinates.");
            },
            { timeout: 10000 }
        );
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateAndDownloadInvoice = (orderData) => {
        const targetOrder = orderData || placedOrderDetails;
        if (!targetOrder) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(46, 125, 50); // Primary green
        doc.text("EARTHVIBES EXPORTS", 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Hyperlocal Fresh Fruit Delivery", 105, 26, { align: 'center' });
        doc.text("Email: support@earthvibes.com | Web: www.earthvibes.com", 105, 31, { align: 'center' });

        doc.setDrawColor(46, 125, 50);
        doc.line(15, 36, 195, 36);

        // Order Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("TAX INVOICE", 15, 45);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Invoice No: INV-${(targetOrder.displayId || targetOrder.id || Date.now()).toString().slice(-6)}`, 15, 52);
        doc.text(`Date: ${targetOrder.date}`, 15, 57);
        doc.text(`Payment: ${(targetOrder.paymentMethod || 'COD').toUpperCase()}`, 15, 62);
        doc.text(`Fulfilling Branch: ${targetOrder.storeBranch || 'Satara Store'}`, 15, 67);

        // Customer Details
        doc.setFont("helvetica", "bold");
        doc.text("Deliver To:", 130, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`${targetOrder.customerName}`, 130, 52);
        doc.text(`${targetOrder.email}`, 130, 57);
        doc.text(`${targetOrder.phone}`, 130, 62);
        doc.text(`${targetOrder.address}`, 130, 67, { maxWidth: 65 });

        // Items Table
        const tableColumn = ["Item Description", "Price (Locked)", "Qty", "Total"];
        const tableRows = [];

        (targetOrder.items || []).forEach(item => {
            const priceVal = Number(item.unitPriceNumeric) || parseFloat(String(item.price || '0').replace(/[^\d.]/g, '')) || 0;
            const qty = item.quantity || 1;
            const itemTotal = priceVal * qty;

            tableRows.push([
                item.name,
                `INR ${priceVal.toLocaleString('en-IN')}`,
                qty,
                `INR ${itemTotal.toLocaleString('en-IN')}`
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 75,
            theme: 'striped',
            headStyles: { fillColor: [46, 125, 50] },
            margin: { left: 15, right: 15 }
        });

        // Totals
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Subtotal:`, 130, finalY);
        doc.text(`${targetOrder.subtotal?.toLocaleString('en-IN') || subtotal.toLocaleString('en-IN')} INR`, 190, finalY, { align: 'right' });

        if (targetOrder.discountAmount > 0) {
            doc.text(`Discount (${targetOrder.appliedCouponCode || 'Coupon'}):`, 130, finalY + 7);
            doc.text(`- ${targetOrder.discountAmount.toLocaleString('en-IN')} INR`, 190, finalY + 7, { align: 'right' });
        }

        doc.text(`Shipping Fee (${targetOrder.deliveryFee === 0 ? 'FREE' : 'Flat'}):`, 130, finalY + 14);
        doc.text(`${targetOrder.deliveryFee ?? deliveryFee} INR`, 190, finalY + 14, { align: 'right' });

        doc.setFontSize(13);
        doc.setTextColor(46, 125, 50);
        doc.text(`Grand Total:`, 130, finalY + 24);
        doc.text(`${(targetOrder.totalAmount ?? grandTotal).toLocaleString('en-IN')} INR`, 190, finalY + 24, { align: 'right' });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.setFont("helvetica", "italic");
        doc.text("Thank you for ordering with EarthVibes Hyperlocal! Stay Healthy.", 105, 280, { align: 'center' });

        doc.save(`EarthVibes_Invoice_${(targetOrder.displayId || targetOrder.id || Date.now()).toString().slice(-6)}.pdf`);
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        // 🛑 Hyperlocal Radius Block Check
        if (!deliveryCheck.isDeliverable) {
            alert(`Order Cannot Be Placed!\n\nYour address is outside our delivery radius (${deliveryCheck.radiusKm} KM) from ${deliveryCheck.nearestBranch?.name || 'Store'}.\nDistance: ${deliveryCheck.distanceKm} KM.`);
            return;
        }

        // Snapshot LOCKED PRICES for every product in the order
        const snapshotItems = displayItems.map(item => {
            const priceStr = item.displayPrice || item.price || '0';
            const numericVal = parseFloat(String(priceStr).replace(/[^\d.]/g, '')) || 0;
            const qty = Number(item.quantity) || 1;

            return {
                id: item.id || item.firestoreId || null,
                name: item.name || 'Fruit Item',
                category: item.category || 'Fresh',
                priceAtPurchase: String(priceStr),
                unitPriceNumeric: numericVal,
                quantity: qty,
                itemTotal: numericVal * qty
            };
        });

        const newOrder = {
            displayId: Date.now(),
            uid: auth.currentUser ? auth.currentUser.uid : (localStorage.getItem('demo_user') === 'true' ? 'demo_master' : 'guest'),
            customerName: `${formData.firstName} ${formData.lastName}`.trim() || 'Customer',
            email: formData.email,
            phone: formData.phone,
            address: `${formData.address}, ${formData.city} - ${formData.zipCode}`,
            city: formData.city,
            zipCode: formData.zipCode,
            
            // Hyperlocal details
            storeBranch: deliveryCheck.nearestBranch?.name || 'Satara Store',
            branchId: deliveryCheck.nearestBranch?.id || 'satara_1',
            deliveryDistanceKm: deliveryCheck.distanceKm,
            
            // Amounts & Locked Prices
            items: snapshotItems,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            discountAmount: discountAmount,
            appliedCouponCode: appliedCoupon ? appliedCoupon.code : null,
            totalAmount: grandTotal,

            paymentMethod: paymentMethod,
            status: 'Order Placed', // Timeline: Order Placed -> Confirmed -> Packing -> Out for Delivery -> Delivered
            date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            
            // Delivery Boy details (to be assigned by Admin)
            deliveryBoy: {
                name: 'Not Assigned Yet',
                phone: ''
            }
        };

        try {
            const orderRef = await addDoc(collection(firestoreDb, 'orders'), newOrder);
            console.log("Order created with ID:", orderRef.id);

            // ── AUTOMATIC STOCK REDUCTION ──
            for (const item of snapshotItems) {
                const quantityToReduce = item.quantity;
                const itemName = (item.name || '').trim();
                let stockUpdated = false;

                if (itemName) {
                    try {
                        const q = query(collection(firestoreDb, 'products'), where('name', '==', itemName));
                        const snap = await getDocs(q);
                        if (!snap.empty) {
                            const prodDocRef = firestoreDoc(firestoreDb, 'products', snap.docs[0].id);
                            await updateDoc(prodDocRef, { stock: increment(-quantityToReduce) });
                            stockUpdated = true;
                        }
                    } catch (err) {
                        console.warn(`[STOCK] Exact query error:`, err.message);
                    }
                }

                if (!stockUpdated && item.id) {
                    try {
                        const prodRef = firestoreDoc(firestoreDb, 'products', String(item.id));
                        await updateDoc(prodRef, { stock: increment(-quantityToReduce) });
                    } catch (err) {
                        // Silent fallback
                    }
                }
            }

            const completePlacedOrder = { id: orderRef.id, ...newOrder };
            setPlacedOrderDetails(completePlacedOrder);
            setShowSuccessModal(true);
        } catch (e) {
            console.error("Order creation failed:", e);
            alert("Sorry, we couldn't place your order. Please check your internet connection.");
        }
    };

    const handleCloseSuccessModal = () => {
        clearCart();
        navigate('/');
    };

    if (displayItems.length === 0 && !showSuccessModal) {
        return (
            <div className="checkout-page">
                <Navbar />
                <div className="checkout-empty">
                    <Package size={80} color="#ccc" />
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added anything to your cart yet.</p>
                    <Link to="/product" className="continue-shopping-btn">Explore Products</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <Navbar />

            <div className="checkout-breadcrumb">
                <div className="breadcrumb-container">
                    <Link to="/product">Products</Link>
                    <ChevronRight size={16} />
                    <span>Checkout</span>
                </div>
            </div>

            <div className="checkout-container">
                <div className="checkout-header">
                    <h1>Hyperlocal Checkout</h1>
                    <p>Select your location and complete your order within our delivery zone.</p>
                </div>

                <form onSubmit={handlePlaceOrder} className="checkout-content" autoComplete="off">
                    <div className="checkout-left">

                        {/* 📍 HYPERLOCAL STORE & RADIUS SELECTION SECTION */}
                        <div className="form-section location-radius-box" style={{ border: '2px solid #bbf7d0', background: '#f0fdf4' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0, color: '#166534', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={22} color="#16a34a" /> Store Branch & Delivery Radius Check
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleGetGPSLocation}
                                    disabled={isLocating}
                                    style={{
                                        background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px',
                                        borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', cursor: isLocating ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        opacity: isLocating ? 0.7 : 1
                                    }}
                                >
                                    <MapPin size={14} /> {isLocating ? 'Detecting...' : 'Detect My GPS Location'}
                                </button>
                            </div>

                            {locationNotice && (
                                <p style={{ fontSize: '0.88rem', color: '#15803d', margin: '0 0 12px 0', fontWeight: '600' }}>{locationNotice}</p>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fulfilling Store Branch</label>
                                    <select
                                        value={selectedBranchId}
                                        onChange={(e) => setSelectedBranchId(e.target.value)}
                                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600' }}
                                    >
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name} ({branch.radiusKm} KM Radius) - {branch.address}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Radius Check Alert Banner */}
                            <div style={{
                                padding: '14px 18px', borderRadius: '10px',
                                background: deliveryCheck.isDeliverable ? '#dcfce7' : '#fee2e2',
                                border: `1.5px solid ${deliveryCheck.isDeliverable ? '#86efac' : '#fca5a5'}`,
                                display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px'
                            }}>
                                {deliveryCheck.isDeliverable ? (
                                    <CheckCircle2 size={26} color="#15803d" />
                                ) : (
                                    <AlertTriangle size={26} color="#dc2626" />
                                )}
                                <div>
                                    <strong style={{ color: deliveryCheck.isDeliverable ? '#14532d' : '#991b1b', fontSize: '0.98rem', display: 'block' }}>
                                        {deliveryCheck.isDeliverable ? 'Deliverable Area Verified! ✅' : 'Out of Delivery Radius! ❌'}
                                    </strong>
                                    <span style={{ fontSize: '0.88rem', color: deliveryCheck.isDeliverable ? '#166534' : '#b91c1c' }}>
                                        {deliveryCheck.message}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address Section */}
                        <div className="form-section">
                            <h3><Truck size={22} /> Shipping Address</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
                                        placeholder="First Name" required autoComplete="off"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
                                        placeholder="Last Name" required autoComplete="off"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleInputChange}
                                        placeholder="Email Address" required autoComplete="off"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                        placeholder="+91 XXXXX XXXXX" required autoComplete="off"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Street / Landmark Address</label>
                                <input
                                    type="text" name="address" value={formData.address} onChange={handleInputChange}
                                    placeholder="Flat No, Building, Street / Area" required autoComplete="off"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>City</label>
                                    <input
                                        type="text" name="city" value={formData.city} onChange={handleInputChange}
                                        placeholder="Satara" required autoComplete="off"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Zip / Pin Code</label>
                                    <input
                                        type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange}
                                        placeholder="415001" required autoComplete="off"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="form-section">
                            <h3><CreditCard size={22} /> Payment Method</h3>
                            <div className="payment-options">
                                <div
                                    className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('cod')}
                                >
                                    <input type="radio" checked={paymentMethod === 'cod'} readOnly />
                                    <div className="payment-option-content">
                                        <Banknote size={24} color="#16a34a" />
                                        <span className="payment-option-title">Cash / Pay on Delivery (COD)</span>
                                    </div>
                                </div>

                                <div
                                    className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('card')}
                                >
                                    <input type="radio" checked={paymentMethod === 'card'} readOnly />
                                    <div className="payment-option-content">
                                        <CreditCard size={24} />
                                        <span className="payment-option-title">Online Payment / UPI / Card</span>
                                    </div>
                                </div>

                                {paymentMethod === 'card' && (
                                    <div className="card-details-fields">
                                        <div className="form-group">
                                            <label>Card / UPI Details</label>
                                            <input type="text" placeholder="Card Number or UPI ID (e.g. mobile@upi)" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="checkout-actions-bottom">
                            <Link to="/product" className="back-link"><ArrowLeft size={16} /> Back to Products</Link>
                        </div>
                    </div>

                    {/* Order Summary & Calculations */}
                    <div className="checkout-right">
                        <div className="order-summary-box">
                            <h3>Order Summary</h3>
                            <div className="summary-items">
                                {displayItems.map((item, idx) => (
                                    <div key={idx} className="summary-item">
                                        <img
                                            src={item.image || 'https://via.placeholder.com/60'}
                                            alt={item.name}
                                            className="summary-item-img"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=Fruit'; }}
                                        />
                                        <div className="summary-item-info">
                                            <h4>{item.name}</h4>
                                            <p>{item.category} • Qty: {item.quantity || 1}</p>
                                        </div>
                                        <div className="summary-item-price">
                                            {item.displayPrice || item.price}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Code Section */}
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.9rem', color: '#334155', marginBottom: '8px' }}>
                                    <Tag size={16} color="#16a34a" /> Apply Promo / Coupon Code
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. FRESH50"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', textTransform: 'uppercase', fontWeight: 'bold' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Apply
                                    </button>
                                </div>
                                {appliedCoupon && (
                                    <div style={{ marginTop: '8px', color: '#16a34a', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        ✓ Coupon "{appliedCoupon.code}" applied: ₹{appliedCoupon.discountAmount} OFF!
                                    </div>
                                )}
                                {couponError && (
                                    <div style={{ marginTop: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        ⚠ {couponError}
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Totals */}
                            <div className="summary-totals">
                                <div className="summary-row">
                                    <span>Items Subtotal</span>
                                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>

                                {appliedCoupon && (
                                    <div className="summary-row" style={{ color: '#16a34a', fontWeight: '600' }}>
                                        <span>Coupon Discount ({appliedCoupon.code})</span>
                                        <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}

                                <div className="summary-row">
                                    <span>
                                        Delivery Charge
                                        {subtotal >= minFreeAmount && (
                                            <small style={{ color: '#16a34a', marginLeft: '5px', fontWeight: 'bold' }}>(Free Delivery above ₹{minFreeAmount})</small>
                                        )}
                                    </span>
                                    <span>{deliveryFee === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : `₹${deliveryFee}`}</span>
                                </div>

                                <div className="summary-row total">
                                    <span>Grand Total</span>
                                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="place-order-btn"
                                disabled={!deliveryCheck.isDeliverable}
                                style={{
                                    opacity: deliveryCheck.isDeliverable ? 1 : 0.5,
                                    cursor: deliveryCheck.isDeliverable ? 'pointer' : 'not-allowed',
                                    background: deliveryCheck.isDeliverable ? '#2e7d32' : '#94a3b8'
                                }}
                            >
                                {deliveryCheck.isDeliverable ? 'CONFIRM ORDER' : 'OUT OF RADIUS'}
                            </button>

                            {!deliveryCheck.isDeliverable && (
                                <p style={{ color: '#dc2626', fontSize: '0.85rem', textAlign: 'center', marginTop: '8px', fontWeight: 'bold' }}>
                                    ⚠ Change address or store to proceed with order
                                </p>
                            )}

                            <div className="trust-badges" style={{ marginTop: '20px' }}>
                                <div className="trust-badge">
                                    <Shield size={18} />
                                    <span>Hyperlocal Express Delivery</span>
                                </div>
                                <div className="trust-badge">
                                    <ShieldCheck size={18} />
                                    <span>Price Lock Guarantee</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '16px', padding: '40px',
                        maxWidth: '480px', width: '90%', textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', background: '#dcfce7',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 20px'
                        }}>
                            <ShieldCheck size={40} color="#16a34a" />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', color: '#166534', margin: '0 0 10px' }}>Order Placed Successfully! 🎉</h2>
                        <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.5' }}>
                            Your hyperlocal order will be packed and dispatched from <strong>{placedOrderDetails?.storeBranch || 'our store'}</strong>.
                        </p>

                        <div style={{
                            background: '#f9fafb', borderRadius: '12px', padding: '15px',
                            marginBottom: '25px', textAlign: 'left', border: '1px solid #e5e7eb',
                            maxHeight: '220px', overflowY: 'auto'
                        }}>
                            <h4 style={{ margin: '0 0 10px', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', fontSize: '1rem' }}>Order Details</h4>
                            {placedOrderDetails?.items?.map((item, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#4b5563', flex: 1 }}>{item.name} <strong style={{ color: '#111827' }}>x{item.quantity}</strong></span>
                                    <span style={{ fontWeight: '600', color: '#111827' }}>₹{item.itemTotal?.toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#6b7280', margin: '4px 0' }}>
                                <span>Delivery Fee:</span>
                                <span>{placedOrderDetails?.deliveryFee === 0 ? 'FREE' : `₹${placedOrderDetails?.deliveryFee}`}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #d1d5db', fontSize: '1.05rem' }}>
                                <span style={{ color: '#374151', fontWeight: 'bold' }}>Total Amount:</span>
                                <span style={{ color: '#166534', fontWeight: 'bold' }}>₹{placedOrderDetails?.totalAmount?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => generateAndDownloadInvoice()}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    padding: '14px', background: '#34d399', color: '#fff', border: 'none',
                                    borderRadius: '10px', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(52, 211, 153, 0.4)'
                                }}
                            >
                                <FileText size={20} /> Download Tax Invoice (PDF)
                            </button>

                            <button
                                onClick={handleCloseSuccessModal}
                                style={{
                                    padding: '14px', background: '#f3f4f6', color: '#4b5563', border: 'none',
                                    borderRadius: '10px', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Checkout;
