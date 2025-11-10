import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, ShoppingBasket, Book, ChefHat, ShoppingCart, Calendar, CheckSquare,
  Settings, DollarSign, CreditCard, Wrench, Package, CalendarDays,
  Heart, Car, PawPrint, FileText, Sparkles, CalendarRange, Users, Menu, X,
  ChevronRight
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
import HouseholdMembers from '../components/Home/HouseholdMembers';
import homePreferencesService from '../services/homePreferencesService';
import householdService from '../services/householdService';
import { HomePreferences } from '../types/homePreferences';
import { useToast } from '../contexts/ToastContext';
import HouseholdSetupWizard from '../components/Home/HouseholdSetupWizard';

type TabType = 'household' | 'groceries' | 'recipes' | 'shopping' | 'meals' | 'tasks' | 'settings' | 
  'budget' | 'bills' | 'maintenance' | 'inventory' | 'familyCalendar' | 'health' | 
  'vehicles' | 'pets' | 'documents' | 'cleaning' | 'unifiedCalendar';

const HomeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('household');
  const [preferences, setPreferences] = useState<HomePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    loadPreferences();
    
    // Set up event listener for preference updates from settings
    const handlePreferenceUpdate = () => {
      loadPreferences();
    };
    
    window.addEventListener('homePreferencesUpdated', handlePreferenceUpdate);
    
    return () => {
      window.removeEventListener('homePreferencesUpdated', handlePreferenceUpdate);
    };
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await homePreferencesService.getPreferences();
      setPreferences(prefs);
      
      // Check if household setup is complete
      const hasCompletedSetup = await householdService.hasCompletedSetup();
      if (!hasCompletedSetup) {
        setShowSetupWizard(true);
      }
      
      // If current tab is disabled, switch to first available tab
      const currentTabFeature = allTabs.find(t => t.id === activeTab)?.feature;
      if (currentTabFeature && !prefs.features[currentTabFeature as keyof HomePreferences['features']]) {
        // Switch to household tab as fallback
        setActiveTab('household');
      }
    } catch (error: any) {
      showError('Failed to load preferences', error.message);
    } finally {
      setLoading(false);
    }
  };

  const allTabs = [
    // Always visible
    { id: 'household' as TabType, label: 'Household', icon: Users, feature: null, category: 'General' },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, feature: null, category: 'General' },
    
    // Food & Shopping
    { id: 'groceries' as TabType, label: 'Groceries', icon: ShoppingBasket, feature: 'groceries', category: 'Food & Shopping' },
    { id: 'recipes' as TabType, label: 'Recipes', icon: Book, feature: 'recipes', category: 'Food & Shopping' },
    { id: 'shopping' as TabType, label: 'Shopping Lists', icon: ShoppingCart, feature: 'shoppingLists', category: 'Food & Shopping' },
    { id: 'meals' as TabType, label: 'Meal Planner', icon: Calendar, feature: 'mealPlanner', category: 'Food & Shopping' },
    
    // Tasks & Chores
    { id: 'tasks' as TabType, label: 'Tasks & Chores', icon: CheckSquare, feature: 'tasks', category: 'Tasks & Maintenance' },
    { id: 'maintenance' as TabType, label: 'Maintenance', icon: Wrench, feature: 'maintenance', category: 'Tasks & Maintenance' },
    { id: 'cleaning' as TabType, label: 'Cleaning', icon: Sparkles, feature: 'cleaning', category: 'Tasks & Maintenance' },
    
    // Finance
    { id: 'budget' as TabType, label: 'Budget', icon: DollarSign, feature: 'budget', category: 'Finance' },
    { id: 'bills' as TabType, label: 'Bills & Subscriptions', icon: CreditCard, feature: 'bills', category: 'Finance' },
    
    // Calendar & Events
    { id: 'familyCalendar' as TabType, label: 'Family Calendar', icon: CalendarDays, feature: 'familyCalendar', category: 'Calendar' },
    { id: 'unifiedCalendar' as TabType, label: 'All Events', icon: CalendarRange, feature: 'unifiedCalendar', category: 'Calendar' },
    
    // Inventory & Assets
    { id: 'inventory' as TabType, label: 'Household Inventory', icon: Package, feature: 'inventory', category: 'Inventory' },
    { id: 'vehicles' as TabType, label: 'Vehicles', icon: Car, feature: 'vehicles', category: 'Inventory' },
    { id: 'documents' as TabType, label: 'Documents', icon: FileText, feature: 'documents', category: 'Inventory' },
    
    // Family
    { id: 'health' as TabType, label: 'Health & Medical', icon: Heart, feature: 'health', category: 'Family' },
    { id: 'pets' as TabType, label: 'Pets', icon: PawPrint, feature: 'pets', category: 'Family' },
  ];

  // Filter tabs based on user preferences
  const tabs = allTabs.filter(tab => {
    if (tab.feature === null) return true; // Household and Settings always visible
    if (!preferences) return false; // Hide all while loading
    return preferences.features[tab.feature as keyof HomePreferences['features']];
  });
  
  // Group tabs by category
  const tabsByCategory = tabs.reduce((acc, tab) => {
    const category = tab.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tab);
    return acc;
  }, {} as Record<string, typeof tabs>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex">
      {/* Sidebar Navigation */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className="bg-white shadow-xl overflow-hidden flex-shrink-0"
      >
        <div className="w-[280px] h-full overflow-y-auto">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Home</h2>
            </div>
            <p className="text-sm text-gray-600">Household Management</p>
          </div>

          {/* Navigation by Category */}
          <nav className="p-4 space-y-6">
            {Object.entries(tabsByCategory).map(([category, categoryTabs]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                  {category}
                </h3>
                <div className="space-y-1">
                  {categoryTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm truncate">{tab.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
              </button>
              
              {/* Active Tab Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {tabs.find(t => t.id === activeTab)?.label || 'Home Management'}
                </h1>
                <p className="text-sm text-gray-600">
                  {tabs.find(t => t.id === activeTab)?.category || 'General'}
                </p>
              </div>
            </div>
            
            {/* Quick Action - Settings */}
            {activeTab !== 'settings' && (
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden md:inline">Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'household' && <HouseholdMembers />}
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

      {/* Household Setup Wizard */}
      {showSetupWizard && (
        <HouseholdSetupWizard
          onComplete={() => {
            setShowSetupWizard(false);
            loadPreferences(); // Reload to update feature visibility
          }}
        />
      )}
    </div>
  );
};

export default HomeManagement;

