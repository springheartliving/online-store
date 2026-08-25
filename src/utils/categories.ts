import { Category, Product } from "../types";

type CategoryReference = {
  id: number | string;
  name: string;
  slug: string;
};

const categoryKey = (id: number | string | undefined) =>
  id === undefined || id === null ? "" : String(id);

export function resolveProductCategories(
  product: Product,
  categories: Category[]
): Product {
  const categoriesById = new Map(
    categories.map((category) => [categoryKey(category.id), category])
  );

  return {
    ...product,
    categories: (product.categories || []).map((reference: CategoryReference) => {
      const matchedCategory = categoriesById.get(categoryKey(reference.id));
      return matchedCategory || reference;
    }),
  };
}