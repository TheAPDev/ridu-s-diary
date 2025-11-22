import { useState, useEffect } from 'react';
import TimelinePanel from './components/TimelinePanel';
import ChapterPanel from './components/ChapterPanel';
import Editor from './components/Editor';
import CharacterPanel from './components/CharacterPanel';

function App() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(200, Math.min(500, e.clientX));
        setLeftPanelWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(250, Math.min(500, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingLeft, isResizingRight]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const panelBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';

  return (
    <div className={`h-screen ${bgClass} flex overflow-hidden`}>
      <div
        className={`flex-shrink-0 ${panelBgClass} border-r ${borderClass} flex flex-col`}
        style={{ width: `${leftPanelWidth}px` }}
      >
        <div className={`px-4 py-3 border-b ${borderClass} flex items-center`}> 
          <h1 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Ridu's Diary
          </h1>
        </div>
        <div className={`flex-1 overflow-hidden border-b ${borderClass}`}>
          <TimelinePanel />
        </div>
        <div className="flex-1 overflow-hidden">
          <ChapterPanel />
        </div>
      </div>

      <div
        className={`w-1 ${isDarkMode ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-200 hover:bg-blue-400'} cursor-col-resize transition-colors`}
        onMouseDown={() => setIsResizingLeft(true)}
      />

      <div className="flex-1 overflow-hidden">
        <Editor isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      </div>

      <div
        className={`w-1 ${isDarkMode ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-200 hover:bg-blue-400'} cursor-col-resize transition-colors`}
        onMouseDown={() => setIsResizingRight(true)}
      />

      <div
        className={`flex-shrink-0 ${panelBgClass} border-l ${borderClass} overflow-hidden`}
        style={{ width: `${rightPanelWidth}px` }}
      >
  <CharacterPanel />
      </div>
    </div>
  );
}

export default App;
