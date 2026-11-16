
import { firestoreDb } from './src/pages/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function listProducts() {
    try {
        const querySnapshot = await getDocs(collection(firestoreDb, 'products'));
        console.log("Current Products in Firestore:");
        querySnapshot.forEach((doc) => {
            console.log(`ID: ${doc.id} => Name: "${doc.data().name}"`);
        });
    } catch (e) {
        console.error("Error listing products:", e);
    }
}

listProducts();
