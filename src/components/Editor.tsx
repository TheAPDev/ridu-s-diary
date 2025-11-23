  import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Bold, Italic, Underline, Save, Moon, Sun } from 'lucide-react';

// interface TextFormatting { // Removed as it is unused
//   bold: boolean; 
//   italic: boolean; 
//   underline: boolean; 
// }

interface Page {
  id: string; // will store supabase uuid after first save
  content: string;
  page_number?: number;
}

export default function Editor({ isDarkMode, toggleDarkMode }: { isDarkMode: boolean; toggleDarkMode: () => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch pages from Supabase on mount
    (async () => {
      const { data, error } = await supabase.from('pages').select('*').order('page_number', { ascending: true });
      if (error) return;
      // Ensure every page has a valid content string
      const safePages = (data || []).map((p) => ({ ...p, content: p.content ?? '' }));
      setPages(safePages);
      if (safePages.length > 0) setCurrentPageId(safePages[0].id);
    })();
  }, []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // headingMode removed — toolbar simplified

  const currentPage = pages.find((p) => p.id === currentPageId);
  const wordCount = currentPage?.content.trim().split(/\s+/).filter((w) => w).length || 0;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  // Basic keydown handler (expand as needed)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Example: handle Ctrl+S for save
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
    }
    // Add more keyboard shortcuts as needed
  };

  const updatePageContent = (newContent: string) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === currentPageId ? { ...page, content: newContent } : page
      )
    );
    handleSave();
    setSaveError(null);

    // Persist change to Supabase (autosave). If the current page id is not a UUID
    // create the chapter record first, otherwise update existing chapter.
    (async () => {
      try {
        const wordCount = newContent.trim().split(/\s+/).filter((w) => w).length || 0;
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!currentPageId) return;

        // Use a default chapter_id for now (should be replaced with real logic)
        const defaultChapterId = '00000000-0000-0000-0000-000000000001';

        if (!uuidRegex.test(currentPageId)) {
          // insert new page
          const { data, error } = await supabase
            .from('pages')
            .insert({ content: newContent, word_count: wordCount, chapter_id: defaultChapterId })
            .select()
            .single();
          if (error) throw error;
          // replace local page id with the DB id
          setPages((prev) => prev.map((p) => (p.id === currentPageId ? { ...p, id: data.id } : p)));
          setCurrentPageId(data.id);
        } else {
          // update existing page
          const { error } = await supabase
            .from('pages')
            .update({ content: newContent, word_count: wordCount })
            .eq('id', currentPageId);
          if (error) throw error;
        }
      } catch (err: any) {
        setSaveError(err?.message || 'Autosave error');
        console.error('Autosave error:', err);
      }
    })();
  };

  const addNewPage = () => {
    // create a new DB-backed chapter immediately so we have a proper id
    (async () => {
      try {
        // Find the next page_number
        const nextPageNumber = pages.length > 0
          ? Math.max(...pages.map((p) => p.page_number ?? 0)) + 1
          : 1;
        const { data, error } = await supabase
          .from('pages')
          .insert({ content: '', word_count: 0, page_number: nextPageNumber })
          .select()
          .single();
        if (error) throw error;
        const newPageId = data.id;
        setPages((prev) => [...prev, { id: newPageId, content: '', page_number: nextPageNumber }]);
        setCurrentPageId(newPageId);
      } catch (err) {
        console.error('Error creating new page:', err);
        // fallback to local id
        const newPageId = Date.now().toString();
        setPages((prev) => [...prev, { id: newPageId, content: '', page_number: pages.length + 1 }]);
        setCurrentPageId(newPageId);
      }
    })();
  };

  const applyFormatting = (type: 'bold' | 'italic' | 'underline') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = currentPage?.content.substring(selectionStart, selectionEnd) || '';

    // Define prefix/suffix for each formatting type. Underline uses HTML tags since markdown doesn't
    // have a standard underline marker.
    const markers: Record<string, { prefix: string; suffix: string }> = {
      bold: { prefix: '**', suffix: '**' },
      italic: { prefix: '*', suffix: '*' },
      underline: { prefix: '<u>', suffix: '</u>' },
    };

    const { prefix, suffix } = markers[type];

    let newContent = currentPage?.content || '';

    if (selectionStart === selectionEnd) {
      // No selection: insert empty markers and place caret between them
      newContent =
        (currentPage?.content.substring(0, selectionStart) || '') +
        prefix + suffix +
        (currentPage?.content.substring(selectionEnd) || '');

      updatePageContent(newContent);

      // Place caret between the markers
      setTimeout(() => {
        textarea.focus();
        const caretPos = selectionStart + prefix.length;
        textarea.setSelectionRange(caretPos, caretPos);
      }, 0);
      return;
    }

    // There is a selection: toggle wrapping
    let formattedText = selectedText;
    if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix)) {
      formattedText = selectedText.slice(prefix.length, selectedText.length - suffix.length);
    } else {
      formattedText = `${prefix}${selectedText}${suffix}`;
    }

    newContent =
      (currentPage?.content.substring(0, selectionStart) || '') +
      formattedText +
      (currentPage?.content.substring(selectionEnd) || '');

    updatePageContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionStart + formattedText.length);
    }, 0);
  };

  // Heading and list helpers removed: toolbar was simplified. Keep headingMode state
  // in case it's used for UI in the future.

  // Define missing classes for background, border, and text
  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const cardBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';

  return (
    <div className={`h-full flex flex-col ${bgClass}`}>
      <div className={`${cardBgClass} border-b ${borderClass} px-8 py-3`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => applyFormatting('bold')}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${textClass}`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => applyFormatting('italic')}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${textClass}`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => applyFormatting('underline')}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${textClass}`}
            title="Underline (Ctrl+U)"
          >
            <Underline size={18} />
          </button>

          <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} mx-2`} />

          

          <div className="flex-1" />

          <button
            onClick={toggleDarkMode}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${textClass}`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} mx-2`} />

          <div className="flex items-center gap-3 text-sm">
            {isSaving ? (
              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Saving...
              </span>
            ) : saveError ? (
              <span className="text-red-500 flex items-center gap-2">
                <Save size={14} className="text-red-500" />
                {saveError}
              </span>
            ) : (
              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2`}>
                <Save size={14} className="text-green-500" />
                Saved
              </span>
            )}
            <span className={`${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>|</span>
            <span className={`${textClass} font-medium`}>{wordCount} words</span>
            <span className={`${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>|</span>
            <span className={`${textClass} font-medium`}>Page {pages.indexOf(pages.find((p) => p.id === currentPageId) || pages[0]) + 1}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full h-full px-2 py-8 flex flex-col items-center justify-center">
          <div className={`${cardBgClass} rounded-xl shadow-sm border ${borderClass} w-full max-w-7xl min-h-[75vh] flex items-stretch`}>
            <textarea
              ref={textareaRef}
              value={currentPage ? currentPage.content : ''}
              onChange={(e) => {
                if (!currentPage) {
                  // If no page exists, create the first page and set its content
                  addNewPage();
                  // Wait for the new page to be created, then set content (handled by effect)
                  return;
                }
                updatePageContent(e.target.value);
              }}
              onKeyDown={(e) => handleKeyDown(e)}
              className={`w-full h-full p-12 ${textClass} text-base leading-relaxed focus:outline-none resize-none rounded-xl transition-colors ${cardBgClass} editor-textarea`}
              placeholder="Begin your story..."
              readOnly={false}
              disabled={false}
              style={{ minHeight: '60vh' }}
            />
          </div>

          {currentPage && pages.length > 1 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex flex-row items-center gap-6">
                <button
                  onClick={() => {
                    const currentIndex = pages.findIndex((p) => p.id === currentPageId);
                    if (currentIndex > 0) {
                      setCurrentPageId(pages[currentIndex - 1].id);
                    }
                  }}
                  disabled={pages.findIndex((p) => p.id === currentPageId) === 0}
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium"
                >
                  Previous Page
                </button>

                <span className={`${textClass} font-medium text-lg mx-2`}>
                  Page {pages.indexOf(currentPage) + 1} of {pages.length}
                </span>

                <button
                  onClick={() => {
                    const currentIndex = pages.findIndex((p) => p.id === currentPageId);
                    if (currentIndex < pages.length - 1) {
                      setCurrentPageId(pages[currentIndex + 1].id);
                    } else {
                      addNewPage();
                    }
                  }}
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-base font-medium"
                >
                  {pages.indexOf(currentPage) === pages.length - 1 ? 'New Page' : 'Next Page'}
                </button>
              </div>
            </div>
          )}

          {pages.length === 1 && (
            <div className="mt-8 text-center">
              <button
                onClick={addNewPage}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add New Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


