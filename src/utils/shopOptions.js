import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

// NOTE: Admin options are stored under shopConfig so Firestore rules allow admin writes.
const OPTIONS_DOC_PATH = ["shopConfig", "shopOptions"];

function naturalCompare(a, b) {
  return String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });
}

export function sortBrandUnitsDesc(list) {
  const arr = Array.isArray(list) ? [...list] : [];
  const uniq = Array.from(new Set(arr.map((x) => String(x || "").trim()).filter(Boolean)));

  const other = uniq.filter((x) => x.toLowerCase() === "other");
  const rest = uniq.filter((x) => x.toLowerCase() !== "other");

  rest.sort((a, b) => naturalCompare(b, a)); // DESC natural numeric
  return [...rest, ...other];
}

export const DEFAULT_CATEGORIES = [
  "GoPro",
  "Insta360",
  "Mounts & Clamps",
  "Accessories",
  "Bundle",
  "Other",
];

export const DEFAULT_BRANDS_BY_CATEGORY = {
  GoPro: ["Hero 12", "Hero 11", "Hero 10", "Hero 9", "Hero 8", "Max", "Other"],
  Insta360: ["X4", "X3", "X2", "ONE RS", "ONE X2", "GO 3", "Other"],
  "Mounts & Clamps": ["RAM Mounts", "GoPro Official", "Peak Design", "Ulanzi", "Generic", "Other"],
  Accessories: ["Batteries", "Chargers", "Cases", "Filters", "Memory Cards", "Other"],
  Bundle: ["GoPro Bundle", "Insta360 Bundle", "Mixed Bundle", "Other"],
  Other: ["Other"],
};

export async function getShopOptions() {
  const ref = doc(db, ...OPTIONS_DOC_PATH);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const initial = {
      isConfig: true,
      categories: DEFAULT_CATEGORIES,
      brandsByCategory: DEFAULT_BRANDS_BY_CATEGORY,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, initial);
    return initial;
  }

  const data = snap.data() || {};
  const rawBrands =
    data.brandsByCategory && typeof data.brandsByCategory === "object"
      ? data.brandsByCategory
      : DEFAULT_BRANDS_BY_CATEGORY;

  const brandsByCategory = Object.fromEntries(
    Object.entries(rawBrands).map(([cat, list]) => [cat, sortBrandUnitsDesc(list)])
  );

  return {
    categories: Array.isArray(data.categories) && data.categories.length ? data.categories : DEFAULT_CATEGORIES,
    brandsByCategory,
  };
}

export async function saveShopOptions(next) {
  const ref = doc(db, ...OPTIONS_DOC_PATH);
  const rawBrands =
    next.brandsByCategory && typeof next.brandsByCategory === "object"
      ? next.brandsByCategory
      : DEFAULT_BRANDS_BY_CATEGORY;

  const brandsByCategory = Object.fromEntries(
    Object.entries(rawBrands).map(([cat, list]) => [cat, sortBrandUnitsDesc(list)])
  );

  const payload = {
    isConfig: true,
    categories: Array.isArray(next.categories) ? next.categories : DEFAULT_CATEGORIES,
    brandsByCategory,
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

