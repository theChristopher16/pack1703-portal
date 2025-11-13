import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  MapPin,
  DoorOpen,
} from 'lucide-react';
import householdService from '../../services/householdService';
import { Room, HouseholdProfile } from '../../types/household';
import { useToast } from '../../contexts/ToastContext';

const RoomManager: React.FC = () => {
  const [profile, setProfile] = useState<HouseholdProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Room>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoom, setNewRoom] = useState<Omit<Room, 'id'>>({
    name: '',
    type: 'other',
    floor: undefined,
    notes: '',
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const householdProfile = await householdService.getHouseholdProfile();
      if (householdProfile) {
        setProfile(householdProfile);
        setRooms(householdProfile.rooms || []);
      }
    } catch (error: any) {
      showError('Failed to load rooms', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (room: Room) => {
    setEditingRoomId(room.id);
    setEditForm(room);
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingRoomId || !profile) return;

    try {
      const updatedRooms = rooms.map((room) =>
        room.id === editingRoomId ? { ...room, ...editForm } : room
      );

      await householdService.updateHouseholdProfile({
        rooms: updatedRooms,
      });

      setRooms(updatedRooms);
      setEditingRoomId(null);
      setEditForm({});
      showSuccess('Room updated successfully!');
    } catch (error: any) {
      showError('Failed to update room', error.message);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      const updatedRooms = rooms.filter((room) => room.id !== roomId);
      await householdService.updateHouseholdProfile({
        rooms: updatedRooms,
      });

      setRooms(updatedRooms);
      showSuccess('Room deleted successfully!');
    } catch (error: any) {
      showError('Failed to delete room', error.message);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.name.trim()) {
      showError('Room name is required', 'Please enter a room name');
      return;
    }

    try {
      const roomToAdd: Room = {
        ...newRoom,
        id: `room_${Date.now()}`,
      };

      const updatedRooms = [...rooms, roomToAdd];
      await householdService.updateHouseholdProfile({
        rooms: updatedRooms,
      });

      setRooms(updatedRooms);
      setShowAddModal(false);
      setNewRoom({ name: '', type: 'other', floor: undefined, notes: '' });
      showSuccess('Room added successfully!');
    } catch (error: any) {
      showError('Failed to add room', error.message);
    }
  };

  const getRoomIcon = (type: Room['type']) => {
    const icons: Record<Room['type'], string> = {
      bedroom: '🛏️',
      bathroom: '🚿',
      kitchen: '🍳',
      living: '🛋️',
      dining: '🍽️',
      garage: '🚗',
      basement: '📦',
      attic: '🏚️',
      office: '💼',
      other: '🏠',
    };
    return icons[type] || '🏠';
  };

  const roomTypeOptions: { value: Room['type']; label: string }[] = [
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'living', label: 'Living Room' },
    { value: 'dining', label: 'Dining Room' },
    { value: 'garage', label: 'Garage' },
    { value: 'basement', label: 'Basement' },
    { value: 'attic', label: 'Attic' },
    { value: 'office', label: 'Office' },
    { value: 'other', label: 'Other' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Household Profile Found</h3>
        <p className="text-gray-500">
          Please complete the household setup wizard first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <DoorOpen className="w-7 h-7 text-purple-600" />
            Rooms & Spaces
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your home's rooms and add notes for each space
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Room
        </button>
      </div>

      {/* Room Grid */}
      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <DoorOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rooms Yet</h3>
          <p className="text-gray-500 mb-4">
            Add rooms to organize your home and keep track of notes for each space.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <motion.div
              key={room.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {editingRoomId === room.id ? (
                <div className="p-4 space-y-3">
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Room name"
                  />
                  
                  <select
                    value={editForm.type || 'other'}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Room['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {roomTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={editForm.floor || ''}
                    onChange={(e) => setEditForm({ ...editForm, floor: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Floor (optional)"
                  />

                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Notes about this room..."
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{getRoomIcon(room.type)}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(room)}
                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                          title="Edit room"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-1.5 bg-white/20 hover:bg-red-500/50 rounded-lg transition-colors"
                          title="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold">{room.name}</h3>
                    <p className="text-sm text-purple-100 capitalize">{room.type}</p>
                  </div>

                  <div className="p-4 space-y-3">
                    {room.floor !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>Floor {room.floor}</span>
                      </div>
                    )}

                    {room.notes ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{room.notes}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        No notes yet
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Room Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-6 h-6 text-purple-600" />
                Add New Room
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Guest Bedroom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Type
                  </label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value as Room['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {roomTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {getRoomIcon(option.value)} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor (optional)
                  </label>
                  <input
                    type="number"
                    value={newRoom.floor || ''}
                    onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 1, 2, -1 for basement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={newRoom.notes}
                    onChange={(e) => setNewRoom({ ...newRoom, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Any notes about this room..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddRoom}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Room
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomManager;

