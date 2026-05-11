import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (image: string | null) => void;
  currentImage?: string;
  label?: string;
}

export function ImageUpload({ onImageSelect, currentImage, label = 'Image du Véhicule' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('L\'image doit faire moins de 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">
        <ImageIcon className="w-4 h-4" />
        {label}
      </label>

      {preview ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-48 rounded-lg overflow-hidden border border-border"
        >
          <img
            src={preview}
            alt="Aperçu"
            className="w-full h-full object-cover"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClear}
            type="button"
            className="absolute top-2 right-2 w-8 h-8 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4 text-red-400" />
          </motion.button>
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="absolute bottom-2 left-2 px-3 py-1.5 bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/50 rounded-lg text-xs text-accent-cyan font-medium transition-all"
          >
            Changer
          </button>
        </motion.div>
      ) : (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ borderColor: 'rgba(0, 240, 255, 0.5)' }}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-accent-cyan/80 bg-accent-cyan/5'
              : 'border-border hover:border-accent-cyan/30'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ y: isDragging ? -5 : 0 }}
              className="w-12 h-12 rounded-lg bg-accent-cyan/10 flex items-center justify-center"
            >
              <Upload className="w-6 h-6 text-accent-cyan" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Glissez-déposez votre image ici
              </p>
              <p className="text-xs text-text-secondary mt-1">
                ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-text-secondary/50 mt-1">
                Max 5MB (PNG, JPG, WebP)
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
