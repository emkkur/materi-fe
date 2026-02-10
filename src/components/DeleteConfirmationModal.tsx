import type { FC } from 'react';
import Button from './Button';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  loading?: boolean;
}

const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  loading 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Document?</h3>
        <p className="text-gray-600 mb-6">
          This action cannot be undone. All content in "{title || 'Untitled Document'}" will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 border-red-600 focus:ring-red-500"
          >
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
