import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingBasket, Book, ChefHat } from 'lucide-react';
import GroceryManager from '../components/Home/GroceryManager';
import RecipeManager from '../components/Home/RecipeManager';

type TabType = 'groceries' | 'recipes';

const HomeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('groceries');

  const tabs = [
    { id: 'groceries' as TabType, label: 'Groceries', icon: ShoppingBasket },
    { id: 'recipes' as TabType, label: 'Recipes', icon: Book },
  ];

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
                Manage your groceries and recipes in one place
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomeManagement;

