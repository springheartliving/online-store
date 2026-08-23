import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  writeBatch
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Product, Category, Quotation } from "../types";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance using the specific databaseId specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Collections references
const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";
const QUOTATIONS_COLLECTION = "quotations";

/**
 * Fetch all products from Firestore database
 */
export async function fetchProductsFromFirestore(): Promise<Product[]> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return [];
    }
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      products.push(docSnap.data() as Product);
    });
    return products;
  } catch (error) {
    console.error("Failed to fetch products from Firestore:", error);
    return [];
  }
}

/**
 * Fetch categories from Firestore database
 */
export async function fetchCategoriesFromFirestore(): Promise<Category[]> {
  try {
    const colRef = collection(db, CATEGORIES_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return [];
    }
    const categories: Category[] = [];
    snapshot.forEach((docSnap) => {
      categories.push(docSnap.data() as Category);
    });
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories from Firestore:", error);
    return [];
  }
}

/**
 * Save/seed products and categories to Firestore database
 */
export async function seedInitialDataToFirestore(
  products: Product[],
  categories: Category[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Seed products
    for (const prod of products) {
      const docRef = doc(db, PRODUCTS_COLLECTION, String(prod.id));
      batch.set(docRef, prod, { merge: true });
    }

    // Seed categories
    for (const cat of categories) {
      const docRef = doc(db, CATEGORIES_COLLECTION, String(cat.id));
      batch.set(docRef, cat, { merge: true });
    }

    await batch.commit();
    console.log(`Successfully seeded ${products.length} products and ${categories.length} categories to Firestore.`);
  } catch (error) {
    console.error("Failed to seed data to Firestore:", error);
  }
}

/**
 * Fetch historical quotation orders from Firestore
 */
export async function fetchQuotationsFromFirestore(): Promise<Quotation[]> {
  try {
    const colRef = collection(db, QUOTATIONS_COLLECTION);
    const q = query(colRef, orderBy("createdAt", "desc"), limit(100));
    const snapshot = await getDocs(q);
    const quotations: Quotation[] = [];
    snapshot.forEach((docSnap) => {
      quotations.push(docSnap.data() as Quotation);
    });
    return quotations;
  } catch (error) {
    console.error("Failed to fetch quotations from Firestore:", error);
    // Fallback if index not ready
    try {
      const colRef = collection(db, QUOTATIONS_COLLECTION);
      const snapshot = await getDocs(colRef);
      const list: Quotation[] = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data() as Quotation));
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }
}

/**
 * Save a new or updated quotation order to Firestore database
 */
export async function saveQuotationToFirestore(quotation: Quotation): Promise<void> {
  try {
    const docRef = doc(db, QUOTATIONS_COLLECTION, quotation.quoteNo);
    await setDoc(docRef, {
      ...quotation,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Quotation ${quotation.quoteNo} saved to Firestore.`);
  } catch (error) {
    console.error("Failed to save quotation to Firestore:", error);
  }
}

/**
 * Delete a quotation record from Firestore
 */
export async function deleteQuotationFromFirestore(quoteNo: string): Promise<void> {
  try {
    const docRef = doc(db, QUOTATIONS_COLLECTION, quoteNo);
    await deleteDoc(docRef);
    console.log(`Quotation ${quoteNo} deleted from Firestore.`);
  } catch (error) {
    console.error("Failed to delete quotation from Firestore:", error);
  }
}
