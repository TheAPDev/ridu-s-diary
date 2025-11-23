import { GripVertical, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../lib/supabase';

// Define the Chapter type locally
export type Chapter = {
  id: string;
  title: string;
  content?: string;
  word_count?: number;
  order?: number;
  created_at?: string;
  updated_at?: string;
};

export default function ChapterPanel() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '' });
  const [loading, setLoading] = useState(true);

  // Hoisted function declaration so it can safely be referenced from useEffect
  async function fetchChapters() {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      if (data) setChapters(data);
      else setChapters([]);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChapters();
  }, []);

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const { error } = await supabase
        .from('chapters')
        .insert([
          {
            title: formData.title,
            content: '',
            word_count: 0,
            order: chapters.length,
          },
        ])
        .select();

      if (error) throw error;
      setFormData({ title: '' });
      setIsModalOpen(false);
      await fetchChapters();
    } catch (error) {
      console.error('Error adding chapter:', error);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      await supabase.from('chapters').delete().eq('id', id);
      await fetchChapters();
    } catch (error) {
      console.error('Error deleting chapter:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Chapters</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">No chapters yet</div>
        ) : (
          chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-3 group cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-gray-400 hover:text-gray-600"
                  title="Reorder chapter"
                  aria-label="Reorder chapter"
                >
                  <GripVertical size={14} />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                    {chapter.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{(chapter.word_count ?? 0).toLocaleString()} words</span>
                    <span className="text-gray-300">•</span>
                    <span>{chapter.updated_at ? formatDate(chapter.updated_at) : ''}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteChapter(chapter.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 ml-2"
                  title="Delete chapter"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Add Chapter
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Chapter"
      >
        <form onSubmit={handleAddChapter} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chapter Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Chapter 1: Awakening"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Add Chapter
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
