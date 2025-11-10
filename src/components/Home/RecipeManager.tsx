import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit,
  Search,
  ChefHat,
  Clock,
  Users,
  Play,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import homeService from '../../services/homeService';
import { Recipe, RecipeIngredient } from '../../types/home';
import { useToast } from '../../contexts/ToastContext';

const RecipeManager: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showUseModal, setShowUseModal] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const items = await homeService.getRecipes();
      setRecipes(items);
    } catch (error: any) {
      showError('Failed to load recipes', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await homeService.deleteRecipe(id);
      setRecipes(recipes.filter((r) => r.id !== id));
      showSuccess('Recipe deleted successfully');
    } catch (error: any) {
      showError('Failed to delete recipe', error.message);
    }
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => {
              setEditingRecipe(null);
              setShowAddModal(true);
            }}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Recipe
          </button>
        </div>
      </div>

      {/* Recipes List */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No recipes found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Start by adding your first recipe'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Add Your First Recipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Recipe Image or Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ChefHat className="w-16 h-16 text-white opacity-50" />
                )}
              </div>

              <div className="p-5">
                {/* Title and Actions */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-800 flex-1">{recipe.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingRecipe(recipe);
                        setShowAddModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(recipe.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {recipe.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                )}

                {/* Recipe Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {(recipe.prepTime || recipe.cookTime) && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{recipe.servings} servings</span>
                    </div>
                  </div>

                  {recipe.difficulty && (
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                        recipe.difficulty
                      )}`}
                    >
                      {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                    </span>
                  )}

                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {recipe.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{recipe.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Usage Stats */}
                {recipe.timesUsed > 0 && (
                  <div className="border-t border-gray-100 pt-3 mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>Used {recipe.timesUsed} times</span>
                      </div>
                      {recipe.lastUsed && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(recipe.lastUsed).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Use Recipe Button */}
                <button
                  onClick={() => setShowUseModal(recipe)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Use This Recipe
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <RecipeModal
            recipe={editingRecipe}
            onClose={() => {
              setShowAddModal(false);
              setEditingRecipe(null);
            }}
            onSave={() => {
              loadRecipes();
              setShowAddModal(false);
              setEditingRecipe(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Use Recipe Modal */}
      <AnimatePresence>
        {showUseModal && (
          <UseRecipeModal
            recipe={showUseModal}
            onClose={() => setShowUseModal(null)}
            onSuccess={() => {
              loadRecipes();
              setShowUseModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Recipe Modal Component
interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onSave: () => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    description: recipe?.description || '',
    servings: recipe?.servings || 4,
    prepTime: recipe?.prepTime || 0,
    cookTime: recipe?.cookTime || 0,
    difficulty: recipe?.difficulty || 'medium',
    tags: recipe?.tags?.join(', ') || '',
    ingredients: recipe?.ingredients || [{ name: '', quantity: 0, unit: '', optional: false }],
    instructions: recipe?.instructions || [''],
  });
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', quantity: 0, unit: '', optional: false }],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleIngredientChange = (
    index: number,
    field: keyof RecipeIngredient,
    value: any
  ) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleAddInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, ''],
    });
  };

  const handleRemoveInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index),
    });
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const recipeData = {
        name: formData.name,
        description: formData.description || undefined,
        servings: Number(formData.servings),
        prepTime: Number(formData.prepTime) || undefined,
        cookTime: Number(formData.cookTime) || undefined,
        difficulty: formData.difficulty as 'easy' | 'medium' | 'hard',
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        ingredients: formData.ingredients.filter((i) => i.name && i.quantity && i.unit),
        instructions: formData.instructions.filter(Boolean),
      };

      if (recipe) {
        await homeService.updateRecipe(recipe.id, recipeData);
        showSuccess('Recipe updated successfully');
      } else {
        await homeService.addRecipe(recipeData);
        showSuccess('Recipe added successfully');
      }

      onSave();
    } catch (error: any) {
      showError('Failed to save recipe', error.message);
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
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {recipe ? 'Edit Recipe' : 'Add Recipe'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Spaghetti Carbonara"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of the recipe..."
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servings *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cook Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cookTime}
                    onChange={(e) => setFormData({ ...formData, cookTime: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., pasta, italian, quick, vegetarian"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Ingredients</h3>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  + Add Ingredient
                </button>
              </div>

              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    value={ingredient.quantity || ''}
                    onChange={(e) =>
                      handleIngredientChange(index, 'quantity', Number(e.target.value))
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={ingredient.optional || false}
                      onChange={(e) => handleIngredientChange(index, 'optional', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Optional</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Instructions</h3>
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  + Add Step
                </button>
              </div>

              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <textarea
                    placeholder={`Step ${index + 1}`}
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : recipe ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Use Recipe Modal Component
interface UseRecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onSuccess: () => void;
}

const UseRecipeModal: React.FC<UseRecipeModalProps> = ({ recipe, onClose, onSuccess }) => {
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [using, setUsing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { showSuccess, showError } = useToast();

  const handleUseRecipe = async () => {
    setUsing(true);
    try {
      const useLog = await homeService.useRecipe(recipe.id, servingMultiplier);
      setResult(useLog);
      showSuccess('Recipe used successfully! Groceries updated.');
    } catch (error: any) {
      showError('Failed to use recipe', error.message);
      setUsing(false);
    }
  };

  if (result) {
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
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Recipe Used Successfully!</h2>
                <p className="text-gray-600">Your groceries have been updated</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Grocery Deductions:</h3>
              {result.groceryDeductions.length > 0 ? (
                <div className="space-y-2">
                  {result.groceryDeductions.map((deduction: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white p-3 rounded"
                    >
                      <span className="text-gray-700">{deduction.groceryItemName}</span>
                      <span className="text-gray-600">
                        -{deduction.quantityUsed} {deduction.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded">
                  <AlertCircle className="w-5 h-5" />
                  <span>No groceries were deducted. You may be missing required ingredients.</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

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
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Use Recipe: {recipe.name}</h2>

          <div className="space-y-6">
            {/* Servings Multiplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many batches? (Base recipe serves {recipe.servings})
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={servingMultiplier}
                onChange={(e) => setServingMultiplier(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-1">
                Total servings: {recipe.servings * servingMultiplier}
              </p>
            </div>

            {/* Ingredients Preview */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Required Ingredients:</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-700">
                      {ingredient.name} {ingredient.optional && '(optional)'}
                    </span>
                    <span className="text-gray-600 font-medium">
                      {ingredient.quantity * servingMultiplier} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">This will update your grocery inventory</p>
                <p>
                  Required ingredients will be deducted from your groceries. If you don't have enough of an ingredient, we'll deduct what you have available.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={using}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUseRecipe}
                disabled={using}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {using ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Using Recipe...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Use Recipe
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecipeManager;

