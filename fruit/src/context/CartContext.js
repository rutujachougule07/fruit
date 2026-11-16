import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('earthvibes_cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                // Deduplicate by ID and aggregate quantity
                const deduped = [];
                parsed.forEach(item => {
                    const existing = deduped.find(d => String(d.id) === String(item.id));
                    if (existing) {
                        existing.quantity += item.quantity;
                    } else {
                        deduped.push({ ...item });
                    }
                });
                return deduped;
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('earthvibes_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, quantity) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => String(item.id) === String(product.id));
            if (existingItem) {
                return prevItems.map(item =>
                    String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + quantity } : item
                );
            } else {
                return [...prevItems, { ...product, quantity }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => String(item.id) !== String(productId)));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const totalItems = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

    const totalPrice = cartItems.reduce((acc, item) => {
        // Safe extraction of numeric value from string like "₹1,200/dz"
        const priceStr = String(item.price || '0');
        const numericPrice = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;
        const safeQuantity = Number(item.quantity) || 0;
        return acc + (numericPrice * safeQuantity);
    }, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, totalItems, totalPrice }}>
            {children}
        </CartContext.Provider>
    );
};
