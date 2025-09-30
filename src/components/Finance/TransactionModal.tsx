import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  FileText, 
  Tag, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { 
  FinancialTransaction, 
  TransactionType, 
  TransactionCategory, 
  PaymentMethod,
  TransactionStatus 
} from '../../types/finance';
import { financeService } from '../../services/financeService';
import { fileUploadService } from '../../services/fileUploadService';
import { useAdmin } from '../../contexts/AdminContext';
import { Timestamp } from 'firebase/firestore';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: FinancialTransaction | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  mode,
  onSuccess
}) => {
  const { state } = useAdmin();
  const { currentUser } = state;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    category: 'general' as TransactionCategory,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as PaymentMethod,
    status: 'completed' as TransactionStatus,
    reference: '',
    notes: '',
    tags: [] as string[],
    accountId: 'default',
    attachments: [] as string[]
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (transaction && mode === 'edit') {
      setFormData({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount.toString(),
        description: transaction.description,
        date: transaction.date.toDate().toISOString().split('T')[0],
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        reference: transaction.reference || '',
        notes: transaction.notes || '',
        tags: transaction.tags || [],
        accountId: transaction.accountId || 'default',
        attachments: transaction.attachments || []
      });
    } else {
      // Reset form for create mode
      setFormData({
        type: 'expense',
        category: 'general',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        status: 'completed',
        reference: '',
        notes: '',
        tags: [],
        accountId: 'default',
        attachments: []
      });
    }
    setError(null);
    setSuccess(null);
  }, [transaction, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const transactionData = {
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: Timestamp.fromDate(new Date(formData.date)),
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        tags: formData.tags,
        accountId: formData.accountId,
        attachments: formData.attachments,
        createdBy: currentUser.uid,
        // Only include optional fields if they have values
        ...(formData.reference && { reference: formData.reference }),
        ...(formData.notes && { notes: formData.notes })
      };

      if (mode === 'create') {
        await financeService.createTransaction(transactionData);
        setSuccess('Transaction created successfully!');
      } else if (mode === 'edit' && transaction) {
        await financeService.updateTransaction(transaction.id, transactionData);
        setSuccess('Transaction updated successfully!');
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      handleInputChange('tags', [...formData.tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Upload files to Firebase Storage
      const downloadURLs = await fileUploadService.uploadTransactionReceipts(
        newFiles, 
        'temp-' + Date.now() // Temporary ID, will be updated when transaction is created
      );
      
      handleInputChange('attachments', [...formData.attachments, ...downloadURLs]);
    } catch (error) {
      setError('Failed to upload files');
      // Remove files from state if upload failed
      setUploadedFiles(prev => prev.slice(0, -files.length));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    handleInputChange('attachments', newAttachments);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-white/50 shadow-soft">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Add New Transaction' : 'Edit Transaction'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Type and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as TransactionType)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  placeholder="Enter transaction description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value as TransactionCategory)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  required
                >
                  <option value="general">General</option>
                  <option value="fundraising">Fundraising</option>
                  <option value="dues">Dues</option>
                  <option value="camping">Camping</option>
                  <option value="equipment">Equipment</option>
                  <option value="supplies">Supplies</option>
                  <option value="events">Events</option>
                  <option value="food">Food</option>
                  <option value="transportation">Transportation</option>
                  <option value="insurance">Insurance</option>
                  <option value="training">Training</option>
                  <option value="awards">Awards</option>
                  <option value="administrative">Administrative</option>
                  <option value="bank_fees">Bank Fees</option>
                  <option value="refund">Refund</option>
                  <option value="donation">Donation</option>
                </select>
              </div>
            </div>

            {/* Date and Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value as PaymentMethod)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                  <option value="transfer">Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="venmo">Venmo</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Status and Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as TransactionStatus)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  required
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="reconciled">Reconciled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  placeholder="Check number, transaction ID, etc."
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                placeholder="Type a tag and press Enter"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipts & Attachments (Optional)
              </label>
              
              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload receipts or drag files here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports images and PDFs
                </p>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Uploaded
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploading && (
                <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Uploading files...
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm resize-none"
                placeholder="Additional notes about this transaction"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {mode === 'create' ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {mode === 'create' ? 'Create Transaction' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
