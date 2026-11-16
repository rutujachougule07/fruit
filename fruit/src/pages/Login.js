import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, UserPlus, Sparkles, Mail } from 'lucide-react';
import './Login.css';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const buyNowItem = location.state?.buyNowItem;

    // Auto-redirect if already logged in
    useEffect(() => {
        const isDemoUser = localStorage.getItem('demo_user') === 'true';

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user || isDemoUser) {
                if (buyNowItem) {
                    navigate('/checkout', { state: { buyNowItem } });
                } else {
                    navigate('/checkout');
                }
            }
        });

        return () => unsubscribe();
    }, [navigate, buyNowItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Special Master Login for Admin / Rutuja
        if (isLogin && (
            (formData.email === 'admin@gmail.com' && formData.password === 'admin123') ||
            (formData.email === 'rutuja' && formData.password === 'rutuja1505')
        )) {
            localStorage.setItem('demo_user', 'true');
            alert('Successfully Logged In as Admin!');
            setLoading(false);
            navigate('/admin');
            return;
        }

        try {
            if (isLogin) {
                // Regular Email Login
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
                alert('Successfully Logged In!');
            } else {
                // Account Creation
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match!");
                }

                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

                // Update profile with name
                if (formData.name) {
                    await updateProfile(userCredential.user, {
                        displayName: formData.name
                    });
                }

                alert('Account Created Successfully! Welcome ' + (formData.name || 'User'));
            }
        } catch (error) {
            let errorMsg = error.message;
            if (error.code === 'auth/invalid-email') errorMsg = "Please enter a valid email address.";
            if (error.code === 'auth/user-not-found') errorMsg = "No account found with this email.";
            if (error.code === 'auth/wrong-password') errorMsg = "Incorrect password.";
            if (error.code === 'auth/email-already-in-use') errorMsg = "An account already exists with this email.";
            if (error.code === 'auth/weak-password') errorMsg = "Password should be at least 6 characters.";

            alert('Error: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = () => {
        setFormData({ ...formData, email: 'admin@gmail.com', password: 'admin123' });
    };

    return (
        <div className="login-page">
            <Navbar />

            <div className="login-container">
                <div className="login-card-wrapper">
                    <div className="login-visual-side">
                        <div className="visual-content">
                            <div className="floating-fruits">
                                <span className="fruit-emoji f1">🍎</span>
                                <span className="fruit-emoji f2">🥭</span>
                                <span className="fruit-emoji f3">🍓</span>
                            </div>
                            <h2>{isLogin ? "Freshness Delivered to Your Doorstep." : "Start Your Fresh Journey Today."}</h2>
                            <p>Join our community of fruit lovers and get exclusive access to premium seasonal harvests.</p>
                        </div>
                    </div>

                    <div className="login-form-side">
                        <div className="form-header">
                            <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>
                            <p>{isLogin ? "Please enter your details to continue" : "Fill in the details to get started"}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
                            {/* Full Name - Only for Signup */}
                            {!isLogin && (
                                <div className="input-group">
                                    <label><User size={18} /> Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <label><Mail size={18} /> {isLogin ? "Username or Email" : "Email Address"}</label>
                                <input
                                    type={isLogin ? "text" : "email"}
                                    name="email"
                                    placeholder={isLogin ? "Enter username or email" : "yourname@example.com"}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="input-group">
                                <label><Lock size={18} /> Password</label>
                                <input
                                    type="password"
                                    name="login_password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            {/* Confirm Password - Only for Signup */}
                            {!isLogin && (
                                <div className="input-group">
                                    <label><Lock size={18} /> Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            {isLogin && (
                                <div className="demo-hint-box" onClick={handleDemoLogin}>
                                    <Sparkles size={16} color="#e67e22" />
                                    <span>Try Admin Demo: <b>admin@gmail.com</b> / <b>admin123</b></span>
                                </div>
                            )}

                            <button type="submit" className="login-submit-btn" disabled={loading}>
                                {loading ? "Processing..." : (isLogin ? "Sign In" : "Register Now")}
                                {isLogin ? <ArrowRight size={20} /> : <UserPlus size={20} />}
                            </button>
                        </form>

                        <div className="form-footer">
                            <p>
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <button className="toggle-auth-btn" onClick={() => {
                                    setIsLogin(!isLogin);
                                    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                                }}>
                                    {isLogin ? " Create an account" : " Sign In"}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Login;
