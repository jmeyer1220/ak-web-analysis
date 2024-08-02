import React, { useState } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Clipboard } from 'lucide-react';

const URLListHovercard = ({ urls }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyAll = () => {
    const allUrls = urls.join('\n');
    navigator.clipboard.writeText(allUrls).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <button className="px-4 py-2 text-sm font-medium  bg-slate-900 text-slate-50 hover:bg-white hover:text-slate-900  border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          View Crawled URLs
        </button>
      </HoverCard.Trigger>
      <HoverCard.Content className="w-80 p-4 bg-white rounded-md shadow-lg">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Crawled URLs</h3>
        <ScrollArea.Root className="h-60 overflow-hidden bg-gray-100 rounded">
          <ScrollArea.Viewport className="w-full h-full rounded">
            <ul className="p-4 space-y-2">
              {urls.map((url, index) => (
                <li key={index} className="text-sm text-gray-700">{url}</li>
              ))}
            </ul>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            className="flex select-none touch-none p-0.5 bg-gray-200 transition-colors duration-150 ease-out hover:bg-gray-300"
            orientation="vertical"
          >
            <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
        <button 
          onClick={handleCopyAll} 
          className={`mt-4 w-full px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isCopied 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
          disabled={isCopied}
        >
          <Clipboard className="inline-block w-4 h-4 mr-2" />
          {isCopied ? 'Copied!' : 'Copy All URLs'}
        </button>
      </HoverCard.Content>
    </HoverCard.Root>
  );
};

export default URLListHovercard;