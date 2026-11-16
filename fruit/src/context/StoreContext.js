import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { firestoreDb } from '../pages/firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const StoreContext = createContext();

const initialBranches = [
    {
        id: 'satara_1',
        name: 'Satara Store',
        address: 'Powai Naka, Satara, Maharashtra 415001',
        lat: 17.6805,
        lng: 74.0183,
        radiusKm: 3,
        phone: '+91 98220 12345',
        isActive: true
    },
    {
        id: 'koregaon_1',
        name: 'Koregaon Branch',
        address: 'Station Road, Koregaon, Maharashtra 415501',
        lat: 17.6974,
        lng: 74.1750,
        radiusKm: 5,
        phone: '+91 98220 54321',
        isActive: true
    }
];

const initialDeliverySettings = {
    minFreeDeliveryAmount: 500,
    defaultDeliveryFee: 40,
    coupons: [
        { code: 'FRESH50', type: 'flat', discount: 50, minOrder: 300, desc: '₹50 Flat Off on orders above ₹300' },
        { code: 'WELCOME10', type: 'percent', discount: 10, minOrder: 200, desc: '10% Off on orders above ₹200' },
        { code: 'FRUIT20', type: 'percent', discount: 20, minOrder: 600, desc: '20% Off on mega orders above ₹600' }
    ]
};

// Haversine formula to calculate distance between two coordinates in KM
export const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Math.round(d * 100) / 100; // 2 decimal places
};

export const StoreProvider = ({ children }) => {
    const [branches, setBranches] = useState(initialBranches);
    const [deliverySettings, setDeliverySettings] = useState(initialDeliverySettings);

    useEffect(() => {
        // Real-time listener for Store Branches
        const unsubBranches = onSnapshot(collection(firestoreDb, 'branches'), (snapshot) => {
            const branchList = snapshot.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
            if (branchList.length > 0) {
                setBranches(branchList);
            } else {
                // Seed initial branches
                initialBranches.forEach(async (b) => {
                    await setDoc(doc(firestoreDb, 'branches', b.id), b);
                });
            }
        });

        // Real-time listener for Delivery Settings
        const unsubSettings = onSnapshot(doc(firestoreDb, 'settings', 'delivery'), (snapshot) => {
            if (snapshot.exists()) {
                setDeliverySettings(snapshot.data());
            } else {
                setDoc(doc(firestoreDb, 'settings', 'delivery'), initialDeliverySettings);
            }
        });

        return () => {
            unsubBranches();
            unsubSettings();
        };
    }, []);

    // Check customer location against all active store branches
    const checkDeliveryArea = useCallback((customerLat, customerLng, selectedBranchId = null) => {
        const activeBranches = branches.filter(b => b.isActive !== false);
        if (activeBranches.length === 0) {
            return { isDeliverable: true, distanceKm: 0, nearestBranch: null, message: "Delivery available everywhere" };
        }

        let targetBranches = activeBranches;
        if (selectedBranchId) {
            const found = activeBranches.find(b => String(b.id) === String(selectedBranchId));
            if (found) targetBranches = [found];
        }

        // Find closest branch among targets
        let nearestBranch = null;
        let minDistance = Infinity;

        targetBranches.forEach(branch => {
            const dist = calculateDistanceInKm(customerLat, customerLng, branch.lat, branch.lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearestBranch = branch;
            }
        });

        if (!nearestBranch) {
            return { isDeliverable: false, distanceKm: 0, nearestBranch: null, message: "No active store branch found." };
        }

        const isDeliverable = minDistance <= (nearestBranch.radiusKm || 3);

        return {
            isDeliverable,
            distanceKm: minDistance,
            nearestBranch,
            radiusKm: nearestBranch.radiusKm || 3,
            message: isDeliverable
                ? `Delivery available from ${nearestBranch.name} (${minDistance} KM away)`
                : `Out of delivery radius! ${nearestBranch.name} delivers within ${nearestBranch.radiusKm || 3} KM, but your location is ${minDistance} KM away.`
        };
    }, [branches]);

    // Admin Branch Actions
    const addBranch = useCallback(async (newBranch) => {
        try {
            const docRef = await addDoc(collection(firestoreDb, 'branches'), {
                ...newBranch,
                isActive: true,
                radiusKm: Number(newBranch.radiusKm) || 3,
                lat: Number(newBranch.lat) || 17.6805,
                lng: Number(newBranch.lng) || 74.0183
            });
            console.log("Added branch:", docRef.id);
        } catch (e) {
            console.error("Error adding branch:", e);
        }
    }, []);

    const updateBranch = useCallback(async (branchId, updatedData) => {
        try {
            await updateDoc(doc(firestoreDb, 'branches', String(branchId)), {
                ...updatedData,
                radiusKm: Number(updatedData.radiusKm) || 3,
                lat: Number(updatedData.lat) || 17.6805,
                lng: Number(updatedData.lng) || 74.0183
            });
        } catch (e) {
            console.error("Error updating branch:", e);
        }
    }, []);

    const deleteBranch = useCallback(async (branchId) => {
        try {
            await deleteDoc(doc(firestoreDb, 'branches', String(branchId)));
        } catch (e) {
            console.error("Error deleting branch:", e);
        }
    }, []);

    const updateDeliverySettings = useCallback(async (newSettings) => {
        try {
            await setDoc(doc(firestoreDb, 'settings', 'delivery'), newSettings);
        } catch (e) {
            console.error("Error updating delivery settings:", e);
        }
    }, []);

    const value = useMemo(() => ({
        branches,
        deliverySettings,
        checkDeliveryArea,
        addBranch,
        updateBranch,
        deleteBranch,
        updateDeliverySettings
    }), [branches, deliverySettings, checkDeliveryArea, addBranch, updateBranch, deleteBranch, updateDeliverySettings]);

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => useContext(StoreContext);
