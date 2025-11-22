import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Bold, Italic, Underline, List, ListOrdered, Type, Save, Moon, Sun } from 'lucide-react';

// interface TextFormatting { // Removed as it is unused
//   bold: boolean; 
//   italic: boolean; 
//   underline: boolean; 
// }

interface Page {
  id: string; // will store supabase uuid after first save
  content: string;
}

export default function Editor({ isDarkMode, toggleDarkMode }: { isDarkMode: boolean; toggleDarkMode: () => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pages, setPages] = useState<Page[]>([{ id: '1', content: 'The morning sun filtered through the ancient oak trees, casting dappled shadows across the forest floor. Elena paused, her hand resting on the worn leather journal in her bag. She had come so far, yet the journey had only just begun...' }]);
  const [currentPageId, setCurrentPageId] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  
  const [headingMode, setHeadingMode] = useState(false);
  const [listMode, setListMode] = useState<'none' | 'bullet' | 'ordered'>('none');

  const currentPage = pages.find((p) => p.id === currentPageId);
  const wordCount = currentPage?.content.trim().split(/\s+/).filter((w) => w).length || 0;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const updatePageContent = (newContent: string) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === currentPageId ? { ...page, content: newContent } : page
      )
    );
    handleSave();

    // Persist change to Supabase (autosave). If the current page id is not a UUID
    // create the chapter record first, otherwise update existing chapter.
    (async () => {
      try {
        const wordCount = newContent.trim().split(/\s+/).filter((w) => w).length || 0;
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!currentPageId) return;

        if (!uuidRegex.test(currentPageId)) {
          // insert new chapter
          const { data, error } = await supabase
            .from('chapters')
            .insert({ title: 'Untitled', content: newContent, word_count: wordCount })
            .select()
            .single();
          if (error) throw error;
          // replace local page id with the DB id
          setPages((prev) => prev.map((p) => (p.id === currentPageId ? { ...p, id: data.id } : p)));
          setCurrentPageId(data.id);
        } else {
          // update existing chapter
          const { error } = await supabase
            .from('chapters')
            .update({ content: newContent, word_count: wordCount })
            .eq('id', currentPageId);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Autosave error:', err);
      }
    })();
  };

  const addNewPage = () => {
    // create a new DB-backed chapter immediately so we have a proper id
    (async () => {
      try {
        const { data, error } = await supabase
          .from('chapters')
          .insert({ title: 'Untitled', content: '', word_count: 0 })
          .select()
          .single();
        if (error) throw error;
        const newPageId = data.id;
        setPages((prev) => [...prev, { id: newPageId, content: '' }]);
        setCurrentPageId(newPageId);
      } catch (err) {
        console.error('Error creating new page:', err);
        // fallback to local id
        const newPageId = Date.now().toString();
        setPages((prev) => [...prev, { id: newPageId, content: '' }]);
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

  const applyHeading = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = currentPage?.content.substring(selectionStart, selectionEnd) || '';

    if (selectedText) {
      let formattedText = selectedText;

      if (selectedText.startsWith('# ')) {
        formattedText = selectedText.slice(2);
      } else {
        formattedText = `# ${selectedText}`;
      }

      const newContent =
        (currentPage?.content.substring(0, selectionStart) || '') +
        formattedText +
        (currentPage?.content.substring(selectionEnd) || '');

      updatePageContent(newContent);
      setHeadingMode(!headingMode);
    }
  };

  const applyList = (type: 'bullet' | 'ordered') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = currentPage?.content.substring(selectionStart, selectionEnd) || '';

    if (selectedText) {
      const lines = selectedText.split('\n');
      const formattedLines = lines.map((line) => {
        const isBullet = line.trim().startsWith('-');
        const isOrdered = /^\d+\./.test(line.trim());

        if (isBullet || isOrdered) {
          return line.trim().replace(/^[-\d.]\s/, '');
        }
        return type === 'bullet' ? `- ${line}` : `1. ${line}`;
      });

      const newContent =
        (currentPage?.content.substring(0, selectionStart) || '') +
        formattedLines.join('\n') +
        (currentPage?.content.substring(selectionEnd) || '');

      updatePageContent(newContent);
      setListMode((prev) => (prev === type ? 'none' : type));
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 600)}px`;
    }
  }, [currentPage?.content]);

  // Keyboard shortcuts: Ctrl/Cmd + B/I/U for bold/italic/underline
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (!isMod) return;

    const key = (e.key || '').toLowerCase();
    if (key === 'b') {
      e.preventDefault();
      applyFormatting('bold');
    } else if (key === 'i') {
      e.preventDefault();
      applyFormatting('italic');
    } else if (key === 'u') {
      e.preventDefault();
      applyFormatting('underline');
    }
  };

  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
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
        <div className="max-w-4xl mx-auto px-16 py-12">
          <div className={`${cardBgClass} rounded-xl shadow-sm border ${borderClass} min-h-full`}>
            <textarea
              ref={textareaRef}
              value={currentPage?.content || ''}
              onChange={(e) => updatePageContent(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e)}
              className={`w-full p-12 ${textClass} text-base leading-relaxed focus:outline-none resize-none rounded-xl transition-colors ${cardBgClass}`}
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                lineHeight: '1.7',
              }}
              placeholder="Begin your story..."
            />
          </div>

          {currentPage && pages.length > 1 && (
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => {
                  const currentIndex = pages.findIndex((p) => p.id === currentPageId);
                  if (currentIndex > 0) {
                    setCurrentPageId(pages[currentIndex - 1].id);
                  }
                }}
                disabled={pages.findIndex((p) => p.id === currentPageId) === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous Page
              </button>

              <span className={`${textClass} font-medium`}>
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {pages.indexOf(currentPage) === pages.length - 1 ? 'New Page' : 'Next Page'}
              </button>
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
