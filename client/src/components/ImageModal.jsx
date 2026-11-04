import React from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function ImageModal({ imageUrl, title = 'Ảnh minh chứng chuyển khoản', onClose }) {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative max-w-3xl w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span>🖼️</span> {title}
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
              title="Mở ảnh tab mới"
            >
              <ExternalLink size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto bg-slate-100">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg border border-slate-200 shadow-sm"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/600x400/e2e8f0/1e293b?text=Minh+Chung+Chuyen+Khoan';
            }}
          />
        </div>
      </div>
    </div>
  );
}
