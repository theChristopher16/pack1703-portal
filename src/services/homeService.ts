import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import authService from './authService';
import {
  GroceryItem,
  GroceryCategory,
  Recipe,
  RecipeIngredient,
  RecipeUseLog,
} from '../types/home';

class HomeService {
  private readonly GROCERIES_COLLECTION = 'groceries';
  private readonly RECIPES_COLLECTION = 'recipes';
  private readonly RECIPE_USE_LOGS_COLLECTION = 'recipeUseLogs';

  // ==================== Grocery Methods ====================

  async getGroceries(): Promise<GroceryItem[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.GROCERIES_COLLECTION),
      where('userId', '==', user.id),
      orderBy('category'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        expirationDate: data.expirationDate?.toDate(),
      } as GroceryItem;
    });
  }

  async addGroceryItem(item: Omit<GroceryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.GROCERIES_COLLECTION), {
      ...item,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
      expirationDate: item.expirationDate ? Timestamp.fromDate(item.expirationDate) : null,
    });

    return docRef.id;
  }

  async updateGroceryItem(
    id: string,
    updates: Partial<Omit<GroceryItem, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.GROCERIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.id) {
      throw new Error('Grocery item not found or access denied');
    }

    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updates.expirationDate) {
      updateData.expirationDate = Timestamp.fromDate(updates.expirationDate);
    }

    await updateDoc(docRef, updateData);
  }

  async deleteGroceryItem(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.GROCERIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.id) {
      throw new Error('Grocery item not found or access denied');
    }

    await deleteDoc(docRef);
  }

  // ==================== Recipe Methods ====================

  async getRecipes(): Promise<Recipe[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.RECIPES_COLLECTION),
      where('userId', '==', user.id),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastUsed: data.lastUsed?.toDate(),
      } as Recipe;
    });
  }

  async addRecipe(recipe: Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'timesUsed' | 'lastUsed'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.RECIPES_COLLECTION), {
      ...recipe,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
      timesUsed: 0,
      lastUsed: null,
    });

    return docRef.id;
  }

  async updateRecipe(
    id: string,
    updates: Partial<Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'timesUsed' | 'lastUsed'>>
  ): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.RECIPES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.id) {
      throw new Error('Recipe not found or access denied');
    }

    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteRecipe(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.RECIPES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.id) {
      throw new Error('Recipe not found or access denied');
    }

    await deleteDoc(docRef);
  }

  /**
   * Use a recipe - deducts ingredients from grocery inventory
   * @param recipeId The recipe to use
   * @param servingMultiplier How many times the base recipe to make (default 1)
   */
  async useRecipe(recipeId: string, servingMultiplier: number = 1): Promise<RecipeUseLog> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get the recipe
    const recipeDoc = await getDoc(doc(db, this.RECIPES_COLLECTION, recipeId));
    if (!recipeDoc.exists() || recipeDoc.data()?.userId !== user.id) {
      throw new Error('Recipe not found or access denied');
    }

    const recipe = { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;

    // Get all groceries
    const groceries = await this.getGroceries();

    // Prepare batch updates
    const batch = writeBatch(db);
    const deductions: RecipeUseLog['groceryDeductions'] = [];

    // Process each ingredient
    for (const ingredient of recipe.ingredients) {
      if (ingredient.optional) continue; // Skip optional ingredients

      // Find matching grocery items (case-insensitive)
      const matchingGroceries = groceries.filter(
        (g) => g.name.toLowerCase() === ingredient.name.toLowerCase()
      );

      if (matchingGroceries.length === 0) {
        console.warn(`No grocery item found for ingredient: ${ingredient.name}`);
        continue;
      }

      // Calculate quantity needed
      const quantityNeeded = ingredient.quantity * servingMultiplier;
      let remainingQuantity = quantityNeeded;

      // Deduct from matching groceries (FIFO - oldest expiration first)
      const sortedGroceries = matchingGroceries.sort((a, b) => {
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return a.expirationDate.getTime() - b.expirationDate.getTime();
      });

      for (const grocery of sortedGroceries) {
        if (remainingQuantity <= 0) break;

        // Check if units match (simplified - you might want more sophisticated unit conversion)
        if (grocery.unit !== ingredient.unit) {
          console.warn(
            `Unit mismatch for ${ingredient.name}: recipe wants ${ingredient.unit}, grocery has ${grocery.unit}`
          );
          continue;
        }

        const deductAmount = Math.min(grocery.quantity, remainingQuantity);
        const newQuantity = grocery.quantity - deductAmount;

        // Update grocery item
        const groceryRef = doc(db, this.GROCERIES_COLLECTION, grocery.id);
        if (newQuantity <= 0) {
          // Delete if quantity reaches 0
          batch.delete(groceryRef);
        } else {
          // Update quantity
          batch.update(groceryRef, {
            quantity: newQuantity,
            updatedAt: Timestamp.now(),
          });
        }

        deductions.push({
          groceryItemId: grocery.id,
          groceryItemName: grocery.name,
          quantityUsed: deductAmount,
          unit: grocery.unit,
        });

        remainingQuantity -= deductAmount;
      }

      if (remainingQuantity > 0) {
        console.warn(
          `Insufficient quantity for ${ingredient.name}. Needed ${quantityNeeded}, found ${quantityNeeded - remainingQuantity}`
        );
      }
    }

    // Update recipe usage stats
    const recipeRef = doc(db, this.RECIPES_COLLECTION, recipeId);
    batch.update(recipeRef, {
      timesUsed: (recipe.timesUsed || 0) + 1,
      lastUsed: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Create use log
    const now = new Date();
    const useLog: Omit<RecipeUseLog, 'id'> = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      usedAt: now,
      userId: user.id,
      groceryDeductions: deductions,
    };

    const logRef = await addDoc(collection(db, this.RECIPE_USE_LOGS_COLLECTION), {
      ...useLog,
      usedAt: Timestamp.fromDate(now),
    });

    // Commit all changes
    await batch.commit();

    return {
      id: logRef.id,
      ...useLog,
    };
  }

  async getRecipeUseLogs(recipeId?: string): Promise<RecipeUseLog[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    let q;
    if (recipeId) {
      q = query(
        collection(db, this.RECIPE_USE_LOGS_COLLECTION),
        where('userId', '==', user.id),
        where('recipeId', '==', recipeId),
        orderBy('usedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, this.RECIPE_USE_LOGS_COLLECTION),
        where('userId', '==', user.id),
        orderBy('usedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        usedAt: data.usedAt?.toDate(),
      } as RecipeUseLog;
    });
  }
}

const homeService = new HomeService();
export default homeService;

