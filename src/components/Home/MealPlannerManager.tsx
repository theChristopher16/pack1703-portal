import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import homeService from '../../services/homeService';
import { MealPlan, Recipe } from '../../types/home';
import { useToast } from '../../contexts/ToastContext';

const MealPlannerManager: React.FC = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(today.setDate(diff));
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [meals, allRecipes] = await Promise.all([
        homeService.getMealPlans(),
        homeService.getRecipes(),
      ]);
      setMealPlans(meals);
      setRecipes(allRecipes);
    } catch (error: any) {
      showError('Failed to load meal plans', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this meal plan?')) return;

    try {
      await homeService.deleteMealPlan(id);
      setMealPlans(mealPlans.filter((m) => m.id !== id));
      showSuccess('Meal plan deleted successfully');
    } catch (error: any) {
      showError('Failed to delete meal plan', error.message);
    }
  };

  const getDaysOfWeek = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getMealsForDate = (date: Date) => {
    return mealPlans.filter((meal) => {
      const mealDate = new Date(meal.date);
      return (
        mealDate.getFullYear() === date.getFullYear() &&
        mealDate.getMonth() === date.getMonth() &&
        mealDate.getDate() === date.getDate()
      );
    });
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'lunch', label: 'Lunch', color: 'bg-green-100 text-green-800' },
    { id: 'dinner', label: 'Dinner', color: 'bg-blue-100 text-blue-800' },
    { id: 'snack', label: 'Snack', color: 'bg-purple-100 text-purple-800' },
  ];

  const days = getDaysOfWeek(currentWeekStart);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-sm text-gray-600">
                Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <CalendarIcon className="w-5 h-5" />
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
            (day) => (
              <div
                key={day}
                className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
              >
                {day}
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {days.map((day, index) => {
            const meals = getMealsForDate(day);
            const isToday =
              new Date().toDateString() === day.toDateString();

            return (
              <div
                key={index}
                className={`min-h-[300px] p-2 ${
                  isToday ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isToday ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedDate(day);
                      setShowAddModal(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-1">
                  {meals.map((meal) => {
                    const mealType = mealTypes.find((t) => t.id === meal.mealType);
                    return (
                      <div
                        key={meal.id}
                        className="group relative text-xs p-2 rounded hover:shadow-md transition-shadow bg-white border border-gray-200"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div className="flex-1 min-w-0">
                            <span
                              className={`inline-block px-1 py-0.5 rounded text-[10px] font-medium mb-1 ${
                                mealType?.color
                              }`}
                            >
                              {mealType?.label}
                            </span>
                            <p className="font-medium text-gray-800 truncate">
                              {meal.recipeName || meal.customMeal}
                            </p>
                            {meal.notes && (
                              <p className="text-gray-500 text-[10px] truncate mt-0.5">
                                {meal.notes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(meal.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && selectedDate && (
          <MealPlanModal
            date={selectedDate}
            recipes={recipes}
            onClose={() => {
              setShowAddModal(false);
              setSelectedDate(null);
            }}
            onSave={() => {
              loadData();
              setShowAddModal(false);
              setSelectedDate(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Meal Plan Modal Component
interface MealPlanModalProps {
  date: Date;
  recipes: Recipe[];
  onClose: () => void;
  onSave: () => void;
}

const MealPlanModal: React.FC<MealPlanModalProps> = ({ date, recipes, onClose, onSave }) => {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [useRecipe, setUseRecipe] = useState(true);
  const [recipeId, setRecipeId] = useState('');
  const [customMeal, setCustomMeal] = useState('');
  const [notes, setNotes] = useState('');
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const selectedRecipe = recipes.find((r) => r.id === recipeId);
      const mealData = {
        date,
        mealType,
        recipeId: useRecipe ? recipeId || undefined : undefined,
        recipeName: useRecipe && selectedRecipe ? selectedRecipe.name : undefined,
        customMeal: !useRecipe ? customMeal : undefined,
        notes: notes || undefined,
      };

      await homeService.addMealPlan(mealData);
      showSuccess('Meal plan added successfully');
      onSave();
    } catch (error: any) {
      showError('Failed to save meal plan', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Add Meal Plan
          </h2>
          <p className="text-gray-600 mb-6">
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Meal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type *</label>
              <select
                required
                value={mealType}
                onChange={(e) =>
                  setMealType(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            {/* Recipe or Custom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meal Source</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useRecipe}
                    onChange={() => setUseRecipe(true)}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">From Recipe</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useRecipe}
                    onChange={() => setUseRecipe(false)}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Custom Meal</span>
                </label>
              </div>

              {useRecipe ? (
                <select
                  required
                  value={recipeId}
                  onChange={(e) => setRecipeId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a recipe</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={customMeal}
                  onChange={(e) => setCustomMeal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Leftover pizza, Sandwich"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MealPlannerManager;

