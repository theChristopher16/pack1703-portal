import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Play,
} from 'lucide-react';
import homeService from '../../services/homeService';
import { Task, TaskPriority, TaskStatus } from '../../types/home';
import { useToast } from '../../contexts/ToastContext';

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const items = await homeService.getTasks();
      setTasks(items);
    } catch (error: any) {
      showError('Failed to load tasks', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await homeService.deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
      showSuccess('Task deleted successfully');
    } catch (error: any) {
      showError('Failed to delete task', error.message);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === TaskStatus.COMPLETED) {
        updates.completedAt = new Date();
      }

      await homeService.updateTask(task.id, updates);
      setTasks(
        tasks.map((t) =>
          t.id === task.id
            ? { ...t, status: newStatus, completedAt: updates.completedAt }
            : t
        )
      );
      showSuccess('Task status updated');
    } catch (error: any) {
      showError('Failed to update task', error.message);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-gray-100 text-gray-800';
      case TaskPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return <AlertCircle className="w-4 h-4" />;
      case TaskPriority.HIGH:
        return <AlertCircle className="w-4 h-4" />;
      case TaskPriority.MEDIUM:
        return <Clock className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case TaskStatus.IN_PROGRESS:
        return <Play className="w-5 h-5 text-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const groupedTasks = {
    [TaskStatus.TODO]: filteredTasks.filter((t) => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.COMPLETED]: filteredTasks.filter((t) => t.status === TaskStatus.COMPLETED),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => {
                setEditingTask(null);
                setShowAddModal(true);
              }}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Task
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value={TaskStatus.TODO}>To Do</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <Circle className="w-5 h-5 text-gray-400" />
            To Do
            <span className="ml-auto text-sm font-normal bg-gray-100 px-2 py-1 rounded">
              {groupedTasks[TaskStatus.TODO].length}
            </span>
          </h3>
          <div className="space-y-3">
            {groupedTasks[TaskStatus.TODO].map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => {
                  setEditingTask(task);
                  setShowAddModal(true);
                }}
                onDelete={() => handleDelete(task.id)}
                onStatusChange={handleStatusChange}
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
              />
            ))}
            {groupedTasks[TaskStatus.TODO].length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No tasks</p>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            In Progress
            <span className="ml-auto text-sm font-normal bg-blue-100 px-2 py-1 rounded text-blue-800">
              {groupedTasks[TaskStatus.IN_PROGRESS].length}
            </span>
          </h3>
          <div className="space-y-3">
            {groupedTasks[TaskStatus.IN_PROGRESS].map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => {
                  setEditingTask(task);
                  setShowAddModal(true);
                }}
                onDelete={() => handleDelete(task.id)}
                onStatusChange={handleStatusChange}
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
              />
            ))}
            {groupedTasks[TaskStatus.IN_PROGRESS].length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No tasks</p>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Completed
            <span className="ml-auto text-sm font-normal bg-green-100 px-2 py-1 rounded text-green-800">
              {groupedTasks[TaskStatus.COMPLETED].length}
            </span>
          </h3>
          <div className="space-y-3">
            {groupedTasks[TaskStatus.COMPLETED].map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => {
                  setEditingTask(task);
                  setShowAddModal(true);
                }}
                onDelete={() => handleDelete(task.id)}
                onStatusChange={handleStatusChange}
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
              />
            ))}
            {groupedTasks[TaskStatus.COMPLETED].length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <TaskModal
            task={editingTask}
            onClose={() => {
              setShowAddModal(false);
              setEditingTask(null);
            }}
            onSave={() => {
              loadTasks();
              setShowAddModal(false);
              setEditingTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  getPriorityColor: (priority: TaskPriority) => string;
  getPriorityIcon: (priority: TaskPriority) => React.ReactNode;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  getPriorityColor,
  getPriorityIcon,
}) => {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== TaskStatus.COMPLETED;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${
        task.status === TaskStatus.COMPLETED ? 'opacity-60' : ''
      } ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
            {getPriorityIcon(task.priority)}
            {task.priority}
          </span>
          {task.category && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {task.category}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className={`font-semibold text-gray-800 mb-1 ${task.status === TaskStatus.COMPLETED ? 'line-through' : ''}`}>
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div className={`text-xs mb-2 flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          <Clock className="w-3 h-3" />
          {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && ' (Overdue)'}
        </div>
      )}

      {/* Status Buttons */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        {task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.COMPLETED && (
          <button
            onClick={() => onStatusChange(task, TaskStatus.IN_PROGRESS)}
            className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
          >
            Start
          </button>
        )}
        {task.status !== TaskStatus.COMPLETED && (
          <button
            onClick={() => onStatusChange(task, TaskStatus.COMPLETED)}
            className="flex-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
          >
            Complete
          </button>
        )}
        {task.status === TaskStatus.COMPLETED && (
          <button
            onClick={() => onStatusChange(task, TaskStatus.TODO)}
            className="flex-1 px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Reopen
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Task Modal Component
interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || TaskPriority.MEDIUM,
    status: task?.status || TaskStatus.TODO,
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    category: task?.category || '',
  });
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        category: formData.category || undefined,
      };

      if (task) {
        await homeService.updateTask(task.id, taskData);
        showSuccess('Task updated successfully');
      } else {
        await homeService.addTask(taskData);
        showSuccess('Task created successfully');
      }

      onSave();
    } catch (error: any) {
      showError('Failed to save task', error.message);
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
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {task ? 'Edit Task' : 'Create Task'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Clean the garage"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Additional details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as TaskPriority })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                  <option value={TaskPriority.URGENT}>Urgent</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as TaskStatus })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={TaskStatus.TODO}>To Do</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.COMPLETED}>Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., cleaning, maintenance"
                />
              </div>
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : task ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TaskManager;

