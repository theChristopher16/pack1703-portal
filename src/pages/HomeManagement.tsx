import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, ShoppingBasket, Book, ChefHat, ShoppingCart, Calendar, CheckSquare,
  Settings, DollarSign, CreditCard, Wrench, Package, CalendarDays,
  Heart, Car, PawPrint, FileText, Sparkles, CalendarRange
} from 'lucide-react';
import GroceryManager from '../components/Home/GroceryManager';
import RecipeManager from '../components/Home/RecipeManager';
import ShoppingListManager from '../components/Home/ShoppingListManager';
import MealPlannerManager from '../components/Home/MealPlannerManager';
import TaskManager from '../components/Home/TaskManager';
import HomeSettings from '../components/Home/HomeSettings';
import BudgetManager from '../components/Home/BudgetManager';
import BillsManager from '../components/Home/BillsManager';
import MaintenanceManager from '../components/Home/MaintenanceManager';
import InventoryManager from '../components/Home/InventoryManager';
import FamilyCalendar from '../components/Home/FamilyCalendar';
import UnifiedCalendar from '../components/Home/UnifiedCalendar';
import HealthManager from '../components/Home/HealthManager';
import VehicleManager from '../components/Home/VehicleManager';
import PetManager from '../components/Home/PetManager';
import DocumentVault from '../components/Home/DocumentVault';
import CleaningSchedule from '../components/Home/CleaningSchedule';
import homePreferencesService from '../services/homePreferencesService';
import { HomePreferences } from '../types/homePreferences';
import { useToast } from '../contexts/ToastContext';

type TabType = 'groceries' | 'recipes' | 'shopping' | 'meals' | 'tasks' | 'settings' | 
  'budget' | 'bills' | 'maintenance' | 'inventory' | 'familyCalendar' | 'health' | 
  'vehicles' | 'pets' | 'documents' | 'cleaning' | 'unifiedCalendar';

const HomeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('groceries');
  const [preferences, setPreferences] = useState<HomePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await homePreferencesService.getPreferences();
      setPreferences(prefs);
      
      // If current tab is disabled, switch to first enabled tab
      if (!prefs.features[activeTab as keyof HomePreferences['features']] && activeTab !== 'settings') {
        const firstEnabled = Object.entries(prefs.features).find(([_, enabled]) => enabled)?.[0];
        if (firstEnabled) {
          setActiveTab(firstEnabled as TabType);
        }
      }
    } catch (error: any) {
      showError('Failed to load preferences', error.message);
    } finally {
      setLoading(false);
    }
  };

  const allTabs = [
    { id: 'groceries' as TabType, label: 'Groceries', icon: ShoppingBasket, feature: 'groceries' },
    { id: 'recipes' as TabType, label: 'Recipes', icon: Book, feature: 'recipes' },
    { id: 'shopping' as TabType, label: 'Shopping', icon: ShoppingCart, feature: 'shoppingLists' },
    { id: 'meals' as TabType, label: 'Meals', icon: Calendar, feature: 'mealPlanner' },
    { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare, feature: 'tasks' },
    { id: 'budget' as TabType, label: 'Budget', icon: DollarSign, feature: 'budget' },
    { id: 'bills' as TabType, label: 'Bills', icon: CreditCard, feature: 'bills' },
    { id: 'maintenance' as TabType, label: 'Maintenance', icon: Wrench, feature: 'maintenance' },
    { id: 'inventory' as TabType, label: 'Inventory', icon: Package, feature: 'inventory' },
    { id: 'familyCalendar' as TabType, label: 'Calendar', icon: CalendarDays, feature: 'familyCalendar' },
    { id: 'unifiedCalendar' as TabType, label: 'All Events', icon: CalendarRange, feature: 'unifiedCalendar' },
    { id: 'health' as TabType, label: 'Health', icon: Heart, feature: 'health' },
    { id: 'vehicles' as TabType, label: 'Vehicles', icon: Car, feature: 'vehicles' },
    { id: 'pets' as TabType, label: 'Pets', icon: PawPrint, feature: 'pets' },
    { id: 'documents' as TabType, label: 'Documents', icon: FileText, feature: 'documents' },
    { id: 'cleaning' as TabType, label: 'Cleaning', icon: Sparkles, feature: 'cleaning' },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, feature: null }, // Always visible
  ];

  // Filter tabs based on user preferences
  const tabs = allTabs.filter(tab => {
    if (tab.feature === null) return true; // Settings always visible
    if (!preferences) return tab.id === 'groceries'; // Show only groceries while loading
    return preferences.features[tab.feature as keyof HomePreferences['features']];
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl shadow-lg">
              <Home className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Home Management
              </h1>
              <p className="text-gray-600 mt-1">
                Your complete household management system
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'groceries' && <GroceryManager />}
            {activeTab === 'recipes' && <RecipeManager />}
            {activeTab === 'shopping' && <ShoppingListManager />}
            {activeTab === 'meals' && <MealPlannerManager />}
            {activeTab === 'tasks' && <TaskManager />}
            {activeTab === 'budget' && <BudgetManager />}
            {activeTab === 'bills' && <BillsManager />}
            {activeTab === 'maintenance' && <MaintenanceManager />}
            {activeTab === 'inventory' && <InventoryManager />}
            {activeTab === 'familyCalendar' && <FamilyCalendar />}
            {activeTab === 'unifiedCalendar' && <UnifiedCalendar />}
            {activeTab === 'health' && <HealthManager />}
            {activeTab === 'vehicles' && <VehicleManager />}
            {activeTab === 'pets' && <PetManager />}
            {activeTab === 'documents' && <DocumentVault />}
            {activeTab === 'cleaning' && <CleaningSchedule />}
            {activeTab === 'settings' && <HomeSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomeManagement;

