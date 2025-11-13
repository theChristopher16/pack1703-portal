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
  ChevronDown,
  ChevronUp,
  Ruler,
  Droplet,
  Calendar,
  Wrench,
  Sparkles,
  Tag,
  AlertCircle,
} from 'lucide-react';
import householdService from '../../services/householdService';
import { Room, HouseholdProfile, RoomNote } from '../../types/household';
import { useToast } from '../../contexts/ToastContext';

const EnhancedRoomManager: React.FC = () => {
  const [profile, setProfile] = useState<HouseholdProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Room>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [selectedRoomForNote, setSelectedRoomForNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<Omit<RoomNote, 'id' | 'createdAt' | 'updatedAt'>>({
    content: '',
    category: 'general',
  });
  const [newRoom, setNewRoom] = useState<Omit<Room, 'id'>>({
    name: '',
    type: 'other',
    floor: undefined,
    roomNotes: [],
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
        // Migrate legacy notes to roomNotes
        const migratedRooms = (householdProfile.rooms || []).map((room) => {
          if (room.notes && (!room.roomNotes || room.roomNotes.length === 0)) {
            return {
              ...room,
              roomNotes: [
                {
                  id: `note_${Date.now()}`,
                  content: room.notes,
                  category: 'general' as const,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
            };
          }
          return room;
        });
        setRooms(migratedRooms);
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
        roomNotes: [],
      };

      const updatedRooms = [...rooms, roomToAdd];
      await householdService.updateHouseholdProfile({
        rooms: updatedRooms,
      });

      setRooms(updatedRooms);
      setShowAddModal(false);
      setNewRoom({ name: '', type: 'other', floor: undefined, roomNotes: [] });
      showSuccess('Room added successfully!');
    } catch (error: any) {
      showError('Failed to add room', error.message);
    }
  };

  const handleAddNote = async () => {
    if (!selectedRoomForNote || !newNote.content.trim()) {
      showError('Note content is required', 'Please enter a note');
      return;
    }

    try {
      const noteToAdd: RoomNote = {
        ...newNote,
        id: `note_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedRooms = rooms.map((room) => {
        if (room.id === selectedRoomForNote) {
          return {
            ...room,
            roomNotes: [...(room.roomNotes || []), noteToAdd],
          };
        }
        return room;
      });

      await householdService.updateHouseholdProfile({
        rooms: updatedRooms,
      });

      setRooms(updatedRooms);
      setShowAddNoteModal(false);
      setSelectedRoomForNote(null);
      setNewNote({ content: '', category: 'general' });
      showSuccess('Note added successfully!');
    } catch (error: any) {
      showError('Failed to add note', error.message);
    }
  };

  const handleDeleteNote = async (roomId: string, noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const updatedRooms = rooms.map((room) => {
        if (room.id === roomId) {
          return {
            ...room,
            roomNotes: (room.roomNotes || []).filter((note) => note.id !== noteId),
          };
        }
        return room;
      });

      await householdService.updateHouseholdProfile({
        rooms: updatedRooms,
      });

      setRooms(updatedRooms);
      showSuccess('Note deleted successfully!');
    } catch (error: any) {
      showError('Failed to delete note', error.message);
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

  const getCategoryIcon = (category: RoomNote['category']) => {
    const icons: Record<RoomNote['category'], React.ReactNode> = {
      general: <FileText className="w-4 h-4" />,
      maintenance: <Wrench className="w-4 h-4" />,
      paint: <Droplet className="w-4 h-4" />,
      furniture: <Tag className="w-4 h-4" />,
      renovation: <Home className="w-4 h-4" />,
      cleaning: <Sparkles className="w-4 h-4" />,
      issues: <AlertCircle className="w-4 h-4" />,
    };
    return icons[category];
  };

  const getCategoryColor = (category: RoomNote['category']) => {
    const colors: Record<RoomNote['category'], string> = {
      general: 'bg-gray-100 text-gray-700 border-gray-300',
      maintenance: 'bg-orange-100 text-orange-700 border-orange-300',
      paint: 'bg-purple-100 text-purple-700 border-purple-300',
      furniture: 'bg-blue-100 text-blue-700 border-blue-300',
      renovation: 'bg-red-100 text-red-700 border-red-300',
      cleaning: 'bg-green-100 text-green-700 border-green-300',
      issues: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    return colors[category];
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

  const noteCategoryOptions: { value: RoomNote['category']; label: string }[] = [
    { value: 'general', label: 'General' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'paint', label: 'Paint/Colors' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'renovation', label: 'Renovation' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'issues', label: 'Issues' },
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
            Manage your home's rooms with detailed notes and information
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
            Add rooms to organize your home and keep track of detailed information for each space.
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
          {rooms.map((room) => {
            const isExpanded = expandedRoomId === room.id;
            const noteCount = (room.roomNotes || []).length;

            return (
              <motion.div
                key={room.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {editingRoomId === room.id ? (
                  // Edit Mode
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

                    {/* Room Details */}
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.flooringType || ''}
                        onChange={(e) => setEditForm({ ...editForm, flooringType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Flooring type (e.g., Hardwood, Carpet)"
                      />

                      <input
                        type="number"
                        value={editForm.squareFootage || ''}
                        onChange={(e) => setEditForm({ ...editForm, squareFootage: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Square footage"
                      />

                      <input
                        type="number"
                        value={editForm.windowCount || ''}
                        onChange={(e) => setEditForm({ ...editForm, windowCount: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Number of windows"
                      />
                    </div>

                    {/* Paint Colors */}
                    <div className="space-y-2 border-t pt-2">
                      <label className="text-sm font-medium text-gray-700">Paint Colors</label>
                      <input
                        type="text"
                        value={editForm.paintColors?.walls || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          paintColors: { 
                            ...editForm.paintColors, 
                            walls: e.target.value 
                          } 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="Wall color"
                      />
                      <input
                        type="text"
                        value={editForm.paintColors?.trim || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          paintColors: { 
                            ...editForm.paintColors, 
                            trim: e.target.value 
                          } 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="Trim color"
                      />
                    </div>

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
                  // View Mode
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
                      {/* Room Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {room.floor !== undefined && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>Floor {room.floor}</span>
                          </div>
                        )}
                        {room.squareFootage && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Ruler className="w-4 h-4" />
                            <span>{room.squareFootage} sq ft</span>
                          </div>
                        )}
                        {room.windowCount !== undefined && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Home className="w-4 h-4" />
                            <span>{room.windowCount} windows</span>
                          </div>
                        )}
                        {room.flooringType && (
                          <div className="flex items-center gap-2 text-gray-600 col-span-2">
                            <Tag className="w-4 h-4" />
                            <span>{room.flooringType}</span>
                          </div>
                        )}
                      </div>

                      {/* Paint Colors */}
                      {room.paintColors && (room.paintColors.walls || room.paintColors.trim) && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Droplet className="w-4 h-4 text-purple-600" />
                            <div>
                              {room.paintColors.walls && <div><strong>Walls:</strong> {room.paintColors.walls}</div>}
                              {room.paintColors.trim && <div><strong>Trim:</strong> {room.paintColors.trim}</div>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes Section */}
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => setExpandedRoomId(isExpanded ? null : room.id)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Notes ({noteCount})</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRoomForNote(room.id);
                              setShowAddNoteModal(true);
                            }}
                            className="p-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                            title="Add note"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-2 overflow-hidden"
                            >
                              {noteCount === 0 ? (
                                <p className="text-sm text-gray-400 italic py-2">No notes yet</p>
                              ) : (
                                (room.roomNotes || []).map((note) => (
                                  <div
                                    key={note.id}
                                    className={`p-2 rounded border ${getCategoryColor(note.category)}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          {getCategoryIcon(note.category)}
                                          <span className="text-xs font-medium capitalize">{note.category}</span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                        <p className="text-xs opacity-70 mt-1">
                                          {new Date(note.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteNote(room.id, note.id)}
                                        className="p-1 hover:bg-black/10 rounded transition-colors"
                                        title="Delete note"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Last Cleaned/Maintenance */}
                      {(room.lastCleaned || room.lastMaintenance) && (
                        <div className="border-t pt-2 space-y-1 text-xs text-gray-600">
                          {room.lastCleaned && (
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3 h-3" />
                              <span>Cleaned: {new Date(room.lastCleaned).toLocaleDateString()}</span>
                            </div>
                          )}
                          {room.lastMaintenance && (
                            <div className="flex items-center gap-2">
                              <Wrench className="w-3 h-3" />
                              <span>Maintained: {new Date(room.lastMaintenance).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
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
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor
                    </label>
                    <input
                      type="number"
                      value={newRoom.floor || ''}
                      onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 1, 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sq Ft
                    </label>
                    <input
                      type="number"
                      value={newRoom.squareFootage || ''}
                      onChange={(e) => setNewRoom({ ...newRoom, squareFootage: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 150"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flooring Type
                  </label>
                  <input
                    type="text"
                    value={newRoom.flooringType || ''}
                    onChange={(e) => setNewRoom({ ...newRoom, flooringType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Hardwood, Carpet, Tile"
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

      {/* Add Note Modal */}
      <AnimatePresence>
        {showAddNoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddNoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Add Note
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newNote.category}
                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value as RoomNote['category'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {noteCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note Content *
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Enter your note here..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Note
                </button>
                <button
                  onClick={() => {
                    setShowAddNoteModal(false);
                    setSelectedRoomForNote(null);
                    setNewNote({ content: '', category: 'general' });
                  }}
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

export default EnhancedRoomManager;

