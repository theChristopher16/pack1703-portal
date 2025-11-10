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
import { db } from '../firebase/config';
import authService from './authService';
import {
  GroceryItem,
  GroceryCategory,
  Recipe,
  RecipeIngredient,
  RecipeUseLog,
  ShoppingList,
  MealPlan,
  Task,
  TaskStatus,
  Expense,
  Budget,
  BudgetCategory,
  SavingsGoal,
  Bill,
  MaintenanceItem,
  MaintenanceLog,
  InventoryItem,
  FamilyEvent,
  Medication,
  HealthAppointment,
  VaccinationRecord,
  Vehicle,
  VehicleMaintenance,
  Pet,
  PetAppointment,
  PetMedication,
  Document,
  CleaningTask,
  CleaningLog,
} from '../types/home';

class HomeService {
  private readonly GROCERIES_COLLECTION = 'groceries';
  private readonly RECIPES_COLLECTION = 'recipes';
  private readonly RECIPE_USE_LOGS_COLLECTION = 'recipeUseLogs';
  private readonly SHOPPING_LISTS_COLLECTION = 'shoppingLists';
  private readonly MEAL_PLANS_COLLECTION = 'mealPlans';
  private readonly TASKS_COLLECTION = 'tasks';
  private readonly EXPENSES_COLLECTION = 'expenses';
  private readonly BUDGETS_COLLECTION = 'budgets';
  private readonly BUDGET_CATEGORIES_COLLECTION = 'budgetCategories';
  private readonly SAVINGS_GOALS_COLLECTION = 'savingsGoals';
  private readonly BILLS_COLLECTION = 'bills';
  private readonly MAINTENANCE_ITEMS_COLLECTION = 'maintenanceItems';
  private readonly MAINTENANCE_LOGS_COLLECTION = 'maintenanceLogs';
  private readonly INVENTORY_ITEMS_COLLECTION = 'inventoryItems';
  private readonly FAMILY_EVENTS_COLLECTION = 'familyEvents';
  private readonly MEDICATIONS_COLLECTION = 'medications';
  private readonly HEALTH_APPOINTMENTS_COLLECTION = 'healthAppointments';
  private readonly VACCINATIONS_COLLECTION = 'vaccinations';
  private readonly VEHICLES_COLLECTION = 'vehicles';
  private readonly VEHICLE_MAINTENANCE_COLLECTION = 'vehicleMaintenance';
  private readonly PETS_COLLECTION = 'pets';
  private readonly PET_APPOINTMENTS_COLLECTION = 'petAppointments';
  private readonly PET_MEDICATIONS_COLLECTION = 'petMedications';
  private readonly DOCUMENTS_COLLECTION = 'documents';
  private readonly CLEANING_TASKS_COLLECTION = 'cleaningTasks';
  private readonly CLEANING_LOGS_COLLECTION = 'cleaningLogs';

  // ==================== Grocery Methods ====================

  async getGroceries(): Promise<GroceryItem[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.GROCERIES_COLLECTION),
      where('userId', '==', user.uid),
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
      userId: user.uid,
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

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
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

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
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
      where('userId', '==', user.uid),
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
      userId: user.uid,
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

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
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

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
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
    if (!recipeDoc.exists() || recipeDoc.data()?.userId !== user.uid) {
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
      userId: user.uid,
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
        where('userId', '==', user.uid),
        where('recipeId', '==', recipeId),
        orderBy('usedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, this.RECIPE_USE_LOGS_COLLECTION),
        where('userId', '==', user.uid),
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

  // ==================== Shopping List Methods ====================

  async getShoppingLists(): Promise<ShoppingList[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.SHOPPING_LISTS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as ShoppingList;
    });
  }

  async addShoppingList(list: Omit<ShoppingList, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.SHOPPING_LISTS_COLLECTION), {
      ...list,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  async updateShoppingList(
    id: string,
    updates: Partial<Omit<ShoppingList, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.SHOPPING_LISTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Shopping list not found or access denied');
    }

    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteShoppingList(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.SHOPPING_LISTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Shopping list not found or access denied');
    }

    await deleteDoc(docRef);
  }

  // ==================== Meal Plan Methods ====================

  async getMealPlans(): Promise<MealPlan[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.MEAL_PLANS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as MealPlan;
    });
  }

  async addMealPlan(plan: Omit<MealPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.MEAL_PLANS_COLLECTION), {
      ...plan,
      date: Timestamp.fromDate(plan.date),
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  async updateMealPlan(
    id: string,
    updates: Partial<Omit<MealPlan, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.MEAL_PLANS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Meal plan not found or access denied');
    }

    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }

    await updateDoc(docRef, updateData);
  }

  async deleteMealPlan(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.MEAL_PLANS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Meal plan not found or access denied');
    }

    await deleteDoc(docRef);
  }

  // ==================== Task Methods ====================

  async getTasks(): Promise<Task[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.TASKS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Task;
    });
  }

  async addTask(task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.TASKS_COLLECTION), {
      ...task,
      dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.TASKS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Task not found or access denied');
    }

    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }

    if (updates.completedAt) {
      updateData.completedAt = Timestamp.fromDate(updates.completedAt);
    }

    await updateDoc(docRef, updateData);
  }

  async deleteTask(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.TASKS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Task not found or access denied');
    }

    await deleteDoc(docRef);
  }

  // ==================== Budget & Expense Methods ====================

  async getBudgetCategories(): Promise<BudgetCategory[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.BUDGET_CATEGORIES_COLLECTION),
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BudgetCategory));
  }

  async getExpenses(month: string): Promise<Expense[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const [year, monthNum] = month.split('-');
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);

    const q = query(
      collection(db, this.EXPENSES_COLLECTION),
      where('userId', '==', user.uid),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Expense;
    });
  }

  async addExpense(expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.EXPENSES_COLLECTION), {
      ...expense,
      date: Timestamp.fromDate(expense.date),
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  async updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.EXPENSES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Expense not found or access denied');
    }

    const updateData: any = { ...updates, updatedAt: Timestamp.now() };
    if (updates.date) updateData.date = Timestamp.fromDate(updates.date);

    await updateDoc(docRef, updateData);
  }

  async deleteExpense(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.EXPENSES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Expense not found or access denied');
    }

    await deleteDoc(docRef);
  }

  async getBudget(month: string): Promise<Budget | null> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.BUDGETS_COLLECTION),
      where('userId', '==', user.uid),
      where('month', '==', month)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Budget;
  }

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.SAVINGS_GOALS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        deadline: data.deadline?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as SavingsGoal;
    });
  }

  async addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.SAVINGS_GOALS_COLLECTION), {
      ...goal,
      deadline: goal.deadline ? Timestamp.fromDate(goal.deadline) : null,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  async updateSavingsGoal(id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.SAVINGS_GOALS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Goal not found or access denied');
    }

    const updateData: any = { ...updates, updatedAt: Timestamp.now() };
    if (updates.deadline) updateData.deadline = Timestamp.fromDate(updates.deadline);

    await updateDoc(docRef, updateData);
  }

  async deleteSavingsGoal(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.SAVINGS_GOALS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Goal not found or access denied');
    }

    await deleteDoc(docRef);
  }

  // ==================== Bills Methods ====================

  async getBills(): Promise<Bill[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.BILLS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('nextDueDate')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        nextDueDate: data.nextDueDate?.toDate(),
        lastPaidDate: data.lastPaidDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Bill;
    });
  }

  async addBill(bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastPaidDate'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.BILLS_COLLECTION), {
      ...bill,
      nextDueDate: Timestamp.fromDate(bill.nextDueDate),
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  async updateBill(id: string, updates: Partial<Omit<Bill, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.BILLS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Bill not found or access denied');
    }

    const updateData: any = { ...updates, updatedAt: Timestamp.now() };
    if (updates.nextDueDate) updateData.nextDueDate = Timestamp.fromDate(updates.nextDueDate);
    if (updates.lastPaidDate) updateData.lastPaidDate = Timestamp.fromDate(updates.lastPaidDate);

    await updateDoc(docRef, updateData);
  }

  async deleteBill(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.BILLS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Bill not found or access denied');
    }

    await deleteDoc(docRef);
  }

  // ==================== Maintenance Methods ====================

  async getMaintenanceItems(): Promise<MaintenanceItem[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.MAINTENANCE_ITEMS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('nextDue')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastCompleted: data.lastCompleted?.toDate(),
        nextDue: data.nextDue?.toDate(),
        warrantyExpiration: data.warrantyExpiration?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as MaintenanceItem;
    });
  }

  async addMaintenanceItem(item: Omit<MaintenanceItem, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastCompleted'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.MAINTENANCE_ITEMS_COLLECTION), {
      ...item,
      nextDue: Timestamp.fromDate(item.nextDue),
      warrantyExpiration: item.warrantyExpiration ? Timestamp.fromDate(item.warrantyExpiration) : null,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  async updateMaintenanceItem(id: string, updates: Partial<Omit<MaintenanceItem, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.MAINTENANCE_ITEMS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Item not found or access denied');
    }

    const updateData: any = { ...updates, updatedAt: Timestamp.now() };
    if (updates.nextDue) updateData.nextDue = Timestamp.fromDate(updates.nextDue);
    if (updates.lastCompleted) updateData.lastCompleted = Timestamp.fromDate(updates.lastCompleted);
    if (updates.warrantyExpiration) updateData.warrantyExpiration = Timestamp.fromDate(updates.warrantyExpiration);

    await updateDoc(docRef, updateData);
  }

  async deleteMaintenanceItem(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.MAINTENANCE_ITEMS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Item not found or access denied');
    }

    await deleteDoc(docRef);
  }

  async completeMaintenanceItem(id: string, logData: { cost?: number; performedBy: string; notes?: string }): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const itemRef = doc(db, this.MAINTENANCE_ITEMS_COLLECTION, id);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists() || itemSnap.data()?.userId !== user.uid) {
      throw new Error('Item not found or access denied');
    }

    const item = itemSnap.data() as MaintenanceItem;
    const completedDate = new Date();

    // Calculate next due date based on frequency
    let nextDue = new Date(completedDate);
    switch (item.frequency) {
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'semiannually':
        nextDue.setMonth(nextDue.getMonth() + 6);
        break;
      case 'annually':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
    }

    // Update maintenance item
    await updateDoc(itemRef, {
      lastCompleted: Timestamp.fromDate(completedDate),
      nextDue: Timestamp.fromDate(nextDue),
      updatedAt: Timestamp.now(),
    });

    // Create log entry
    await addDoc(collection(db, this.MAINTENANCE_LOGS_COLLECTION), {
      maintenanceItemId: id,
      completedDate: Timestamp.fromDate(completedDate),
      cost: logData.cost || null,
      performedBy: logData.performedBy,
      notes: logData.notes || null,
      nextScheduled: Timestamp.fromDate(nextDue),
      userId: user.uid,
      createdAt: Timestamp.now(),
    });
  }

  async getMaintenanceLogs(): Promise<MaintenanceLog[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.MAINTENANCE_LOGS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('completedDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        completedDate: data.completedDate?.toDate(),
        nextScheduled: data.nextScheduled?.toDate(),
        createdAt: data.createdAt?.toDate(),
      } as MaintenanceLog;
    });
  }

  // ==================== Inventory Methods ====================

  async getInventoryItems(): Promise<InventoryItem[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.INVENTORY_ITEMS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('room'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        purchaseDate: data.purchaseDate?.toDate(),
        warrantyExpiration: data.warrantyExpiration?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as InventoryItem;
    });
  }

  async addInventoryItem(item: Omit<InventoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.INVENTORY_ITEMS_COLLECTION), {
      ...item,
      purchaseDate: item.purchaseDate ? Timestamp.fromDate(item.purchaseDate) : null,
      warrantyExpiration: item.warrantyExpiration ? Timestamp.fromDate(item.warrantyExpiration) : null,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  async updateInventoryItem(id: string, updates: Partial<Omit<InventoryItem, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.INVENTORY_ITEMS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Item not found or access denied');
    }

    const updateData: any = { ...updates, updatedAt: Timestamp.now() };
    if (updates.purchaseDate) updateData.purchaseDate = Timestamp.fromDate(updates.purchaseDate);
    if (updates.warrantyExpiration) updateData.warrantyExpiration = Timestamp.fromDate(updates.warrantyExpiration);

    await updateDoc(docRef, updateData);
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.INVENTORY_ITEMS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== user.uid) {
      throw new Error('Item not found or access denied');
    }

    await deleteDoc(docRef);
  }
}

const homeService = new HomeService();
export default homeService;

