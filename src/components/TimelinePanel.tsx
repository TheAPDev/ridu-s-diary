import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';


type Page = {
  id: string;
  content: string;
  word_count?: number;
  page_number?: number;
};

export default function TimelinePanel() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('page_number', { ascending: true });
      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Pages Timeline</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : pages.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">No pages yet</div>
        ) : (
          pages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900 text-sm">Page {page.page_number ?? ''}</span>
                  <span className="text-xs text-gray-500">{page.word_count ?? 0} words</span>
                </div>
                <div className="text-xs text-gray-700 whitespace-pre-line break-words max-h-32 overflow-y-auto">
                  {page.content || <span className="italic text-gray-400">(No content)</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
