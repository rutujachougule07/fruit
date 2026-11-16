import React, { createContext, useContext, useState, useEffect } from 'react';
import { firestoreDb } from '../pages/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

const ProductContext = createContext();

const initialProducts = [
    { id: 1, name: 'Apple', category: 'Imported', price: '₹180/kg', oldPrice: '₹220', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=800&q=80' },
    { id: 2, name: 'Banana', category: 'Natural Fruits', price: '₹80/dz', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=800&q=80' },
    { id: 3, name: 'Mango', category: 'Mangoes', price: '₹1,200/dz', oldPrice: '₹1,500', rating: 5, stock: 15, image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80', badge: 'Best Seller' },
    { id: 4, name: 'Orange', category: 'Seasonal', price: '₹90/kg', oldPrice: '₹110', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80' },
    { id: 5, name: 'Grapes', category: 'Seasonal', price: '₹140/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1579606869403-1c3905e32be1?auto=format&fit=crop&w=800&q=80' },
    { id: 6, name: 'Pineapple', category: 'Natural Fruits', price: '₹80/pc', oldPrice: '₹95', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1550258114-189fa29b35e9?auto=format&fit=crop&w=800&q=80' },
    { id: 7, name: 'Papaya', category: 'Natural Fruits', price: '₹70/pc', oldPrice: '₹90', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1517282001574-fbf221173ad4?auto=format&fit=crop&w=800&q=80' },
    { id: 8, name: 'Watermelon', category: 'Seasonal', price: '₹40/kg', oldPrice: '₹55', rating: 5, stock: 10, image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80' },
    { id: 9, name: 'Guava', category: 'Natural Fruits', price: '₹100/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1536511118081-306915309623?auto=format&fit=crop&w=800&q=80' },
    { id: 10, name: 'Strawberry', category: 'Berries', price: '₹250/pack', oldPrice: '₹300', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1464965911861-746a04b4cda0?auto=format&fit=crop&w=800&q=80', badge: 'Fresh' },
    { id: 11, name: 'Pomegranate', category: 'Natural Fruits', price: '₹220/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=800&q=80' },
    { id: 12, name: 'Kiwi', category: 'Imported', price: '₹50/pc', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1585059895312-70c982056bea?auto=format&fit=crop&w=800&q=80' },
    { id: 13, name: 'Cherry', category: 'Berries', price: '₹400/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80' },
    { id: 14, name: 'Peach', category: 'Imported', price: '₹300/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1539315415712-9c71618237ba?auto=format&fit=crop&w=800&q=80' },
    { id: 15, name: 'Pear', category: 'Imported', price: '₹150/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1615484477201-9f4953340fab?auto=format&fit=crop&w=800&q=80' },
    { id: 16, name: 'Coconut', category: 'Natural Fruits', price: '₹60/pc', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1523472721958-846109df389b?auto=format&fit=crop&w=800&q=80' },
    { id: 17, name: 'Lemon', category: 'Natural Fruits', price: '₹40/250g', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1590502593747-42a99613309f?auto=format&fit=crop&w=800&q=80' },
    { id: 18, name: 'Dragon Fruit', category: 'Imported', price: '₹120/pc', oldPrice: '₹150', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1527325679961-249a3341d798?auto=format&fit=crop&w=800&q=80' },
    { id: 19, name: 'Lychee', category: 'Seasonal', price: '₹350/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1582231246931-6e3e5c9b6fdf?auto=format&fit=crop&w=800&q=80' },
    { id: 20, name: 'Blueberry', category: 'Berries', price: '₹350/pack', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=800&q=80' },
    { id: 21, name: 'Blackberry', category: 'Berries', price: '₹450/pack', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1433385830216-423a241e390d?auto=format&fit=crop&w=800&q=80' },
    { id: 22, name: 'Raspberry', category: 'Berries', price: '₹400/pack', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1577069861033-55d04ca4ef5c?auto=format&fit=crop&w=800&q=80' },
    { id: 23, name: 'Apricot', category: 'Imported', price: '₹600/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1534352125032-9ec61f6c4495?auto=format&fit=crop&w=800&q=80' },
    { id: 24, name: 'Plum', category: 'Seasonal', price: '₹280/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1595124245030-41589377be5a?auto=format&fit=crop&w=800&q=80' },
    { id: 25, name: 'Fig', category: 'Seasonal', price: '₹220/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1601379327928-393273e91398?auto=format&fit=crop&w=800&q=80' },
    { id: 26, name: 'Avocado', category: 'Imported', price: '₹150/pc', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80' },
    { id: 27, name: 'Passion Fruit', category: 'Imported', price: '₹500/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1534352125032-9ec61f6c4495?auto=format&fit=crop&w=800&q=80' },
    { id: 28, name: 'Cranberry', category: 'Berries', price: '₹800/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1524335198037-ce6f6345ec46?auto=format&fit=crop&w=800&q=80' },
    { id: 29, name: 'Muskmelon', category: 'Seasonal', price: '₹50/kg', oldPrice: '₹65', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=800&q=80' },
    { id: 30, name: 'Custard Apple', category: 'Seasonal', price: '₹160/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1589135338576-90f3398f62c0?auto=format&fit=crop&w=800&q=80' },
    { id: 31, name: 'Star Fruit', category: 'Imported', price: '₹100/pc', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1560155016-bd4879ae8f21?auto=format&fit=crop&w=800&q=80' },
    { id: 32, name: 'Jackfruit', category: 'Natural Fruits', price: '₹180/pack', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1595089332219-90d2946c59d5?auto=format&fit=crop&w=800&q=80' },
    { id: 33, name: 'Tamarind', category: 'Natural Fruits', price: '₹120/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1605333396915-47ed6b68a00e?auto=format&fit=crop&w=800&q=80' },
    { id: 34, name: 'Sapota (Chikoo)', category: 'Natural Fruits', price: '₹110/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1591574042852-168f1f50a240?auto=format&fit=crop&w=800&q=80' },
    { id: 35, name: 'Dates', category: 'Imported', price: '₹350/box', oldPrice: '₹400', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1597838816882-443360bca7b6?auto=format&fit=crop&w=800&q=80' },
    { id: 36, name: 'Mulberry', category: 'Berries', price: '₹300/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1629235948386-89689f7278d6?auto=format&fit=crop&w=800&q=80' },
    { id: 37, name: 'Gooseberry', category: 'Natural Fruits', price: '₹80/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1629828453401-49b062cedea9?auto=format&fit=crop&w=800&q=80' },
    { id: 38, name: 'Persimmon', category: 'Imported', price: '₹200/pc', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1611082121305-64bc606c4a6a?auto=format&fit=crop&w=800&q=80' },
    { id: 39, name: 'Nectarine', category: 'Imported', price: '₹400/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1539315415712-9c71618237ba?auto=format&fit=crop&w=800&q=80' },
    { id: 40, name: 'Grapefruit', category: 'Imported', price: '₹150/pc', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=800&q=80' },
    { id: 41, name: 'Clementine', category: 'Imported', price: '₹500/box', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80' },
    { id: 42, name: 'Mandarin', category: 'Imported', price: '₹120/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80' },
    { id: 43, name: 'Kiwano', category: 'Imported', price: '₹400/pc', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1629828453401-49b062cedea9?auto=format&fit=crop&w=800&q=80' },
    { id: 44, name: 'Longan', category: 'Imported', price: '₹600/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1582231246931-6e3e5c9b6fdf?auto=format&fit=crop&w=800&q=80' },
    { id: 45, name: 'Mangosteen', category: 'Imported', price: '₹1,200/kg', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1615484477221-2a11487ea955?auto=format&fit=crop&w=800&q=80' },
    { id: 46, name: 'Rambutan', category: 'Imported', price: '₹800/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1615484477221-2a11487ea955?auto=format&fit=crop&w=800&q=80' },
    { id: 47, name: 'Durian', category: 'Imported', price: '₹2,500/kg', rating: 3, stock: 50, image: 'https://images.unsplash.com/photo-1615484477221-2a11487ea955?auto=format&fit=crop&w=800&q=80' },
    { id: 48, name: 'Soursop', category: 'Imported', price: '₹400/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1629828453401-49b062cedea9?auto=format&fit=crop&w=800&q=80' },
    { id: 49, name: 'Loquat', category: 'Imported', price: '₹500/kg', rating: 4, stock: 50, image: 'https://images.unsplash.com/photo-1582231246931-6e3e5c9b6fdf?auto=format&fit=crop&w=800&q=80' },
    { id: 50, name: 'Bilberry', category: 'Berries', price: '₹900/pack', rating: 5, stock: 50, image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=800&q=80' }
];

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState(initialProducts);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestoreDb, 'products'), (snapshot) => {
            const productList = snapshot.docs.map(docSnapshot => {
                const data = docSnapshot.data();
                const docId = docSnapshot.id;
                return {
                    ...data,
                    id: docId,
                    firestoreId: docId
                };
            });

            if (productList.length > 0) {
                setProducts(productList);
            } else {
                // Seed initial data if Firestore is empty
                initialProducts.forEach(async (p) => {
                    await setDoc(doc(firestoreDb, 'products', p.id.toString()), p);
                });
            }
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addProduct = React.useCallback(async (newProduct) => {
        try {
            await addDoc(collection(firestoreDb, 'products'), newProduct);
        } catch (e) {
            console.error("Error adding product: ", e);
        }
    }, []);

    const updateProduct = React.useCallback(async (updatedProduct) => {
        try {
            const productRef = doc(firestoreDb, 'products', updatedProduct.id.toString());
            await updateDoc(productRef, updatedProduct);
        } catch (e) {
            console.error("Error updating product: ", e);
        }
    }, []);

    const deleteProduct = React.useCallback(async (id) => {
        try {
            await deleteDoc(doc(firestoreDb, 'products', id.toString()));
        } catch (e) {
            console.error("Error deleting product: ", e);
        }
    }, []);

    const value = React.useMemo(() => ({
        products,
        setProducts,
        addProduct,
        updateProduct,
        deleteProduct
    }), [products, setProducts, addProduct, updateProduct, deleteProduct]);

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);
