import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Product, Category } from "../types";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance using the specific databaseId specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Collections references
const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";

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
    return products.sort((a, b) => {
      const orderA = a.sort_order !== undefined ? a.sort_order : a.id;
      const orderB = b.sort_order !== undefined ? b.sort_order : b.id;
      return orderA - orderB;
    });
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

