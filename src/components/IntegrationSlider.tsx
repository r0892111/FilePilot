import React from 'react';
import { 
  FileText, 
  File, 
  FileSpreadsheet,
  Cloud,
  HardDrive,
  Folder,
  Archive
} from 'lucide-react';

interface Integration {
  name: string;
  logo?: string;
  icon?: React.ComponentType<any>;
  color: string;
  url: string;
  description: string;
  category: 'platform' | 'filetype';
}

const integrations: Integration[] = [
  // Platforms
  {
    name: 'Google Drive',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg',
    color: '#4285F4',
    url: '/docs/integrations/google-drive',
    description: 'Cloud storage and collaboration',
    category: 'platform'
  },
  {
    name: 'Dropbox',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Dropbox_logo_2017.svg',
    color: '#0061FF',
    url: '/docs/integrations/dropbox',
    description: 'File sync and sharing',
    category: 'platform'
  },
  // File Types
  {
    name: 'Microsoft Word',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Microsoft_Office_Word_%282019%E2%80%93present%29.svg',
    color: '#2B579A',
    url: '/docs/file-types/word',
    description: 'Word documents (.docx, .doc)',
    category: 'filetype'
  },
  {
    name: 'Microsoft Excel',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg',
    color: '#217346',
    url: '/docs/file-types/excel',
    description: 'Spreadsheets (.xlsx, .xls)',
    category: 'filetype'
  },
  {
    name: 'PDF Documents',
    icon: FileText,
    color: '#DC2626',
    url: '/docs/file-types/pdf',
    description: 'Portable Document Format',
    category: 'filetype'
  },
  {
    name: 'OneDrive',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg',
    color: '#0078D4',
    url: '/docs/integrations/onedrive',
    description: 'Microsoft cloud storage',
    category: 'platform'
  },
  {
    name: 'Text Files',
    icon: File,
    color: '#6B7280',
    url: '/docs/file-types/text',
    description: 'TXT, RTF, CSV formats',
    category: 'filetype'
  },
  {
    name: 'Archives',
    icon: Archive,
    color: '#F59E0B',
    url: '/docs/file-types/archives',
    description: 'ZIP, RAR, 7Z formats',
    category: 'filetype'
  },
  {
    name: 'Box',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Box%2C_Inc._logo.svg',
    color: '#0061D5',
    url: '/docs/integrations/box',
    description: 'Enterprise cloud storage',
    category: 'platform'
  },
  {
    name: 'More Formats',
    icon: Folder,
    color: '#10B981',
    url: '/docs/file-types/all',
    description: '50+ supported file types',
    category: 'filetype'
  }
];

export function IntegrationSlider() {
  // Duplicate the integrations array to create seamless loop
  const duplicatedIntegrations = [...integrations, ...integrations];

  const handleLogoClick = (integration: Integration) => {
    // In a real app, this would navigate to the integration docs
    console.log(`Navigate to ${integration.url}`);
    // For demo purposes, show an alert
    alert(`Learn more about ${integration.name} support`);
  };

  const renderIcon = (integration: Integration) => {
    if (integration.logo) {
      return (
        <img
          src={integration.logo}
          alt={`${integration.name} logo`}
          className="w-8 h-8 object-contain transition-all duration-300 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs';
            fallback.style.backgroundColor = integration.color;
            fallback.textContent = integration.name.charAt(0);
            target.parentNode?.appendChild(fallback);
          }}
        />
      );
    } else if (integration.icon) {
      const IconComponent = integration.icon;
      return (
        <IconComponent 
          className="w-8 h-8 transition-all duration-300 group-hover:scale-110" 
          style={{ color: integration.color }}
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-gray-50 via-white to-gray-50 py-6 sm:py-8">
      <div className="relative">
        {/* Fade overlays for seamless effect */}
        <div className="absolute left-0 top-0 w-12 sm:w-24 h-full bg-gradient-to-r from-white via-white/90 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-12 sm:w-24 h-full bg-gradient-to-l from-white via-white/90 to-transparent z-10 pointer-events-none"></div>
        
        {/* Scrolling container */}
        <div className="flex animate-scroll-left">
          {duplicatedIntegrations.map((integration, index) => (
            <div
              key={`${integration.name}-${index}`}
              className="flex-shrink-0 mx-3 sm:mx-6 group cursor-pointer"
              onClick={() => handleLogoClick(integration)}
              role="button"
              tabIndex={0}
              aria-label={`${integration.name} - ${integration.description}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLogoClick(integration);
                }
              }}
            >
              <div className="flex flex-col items-center space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-xl transition-all duration-300 group-hover:bg-white group-hover:shadow-lg group-hover:scale-105 group-focus:bg-white group-focus:shadow-lg group-focus:scale-105 min-w-[100px] sm:min-w-[120px]">
                {/* Logo/Icon container */}
                <div 
                  className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg transition-all duration-300 group-hover:shadow-md border border-gray-100 group-hover:border-gray-200"
                  style={{ backgroundColor: `${integration.color}08` }}
                >
                  {renderIcon(integration)}
                </div>
                
                {/* Integration info */}
                <div className="text-center">
                  <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-gray-800 transition-colors mb-1">
                    {integration.name}
                  </div>
                  <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-24 sm:max-w-28 leading-tight hidden sm:block">
                    {integration.description}
                  </div>
                  
                  {/* Category badge */}
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block ${
                    integration.category === 'platform' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {integration.category === 'platform' ? 'Platform' : 'File Type'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Integration stats */}
      <div className="flex flex-wrap justify-center items-center mt-6 sm:mt-8 gap-3 sm:gap-8">
        <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
          <Cloud className="w-4 h-4 text-blue-600 mr-2" />
          <span className="text-xs sm:text-sm font-medium text-blue-800">
            4+ Cloud Platforms
          </span>
        </div>
        
        <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-50 rounded-full border border-green-100">
          <FileText className="w-4 h-4 text-green-600 mr-2" />
          <span className="text-xs sm:text-sm font-medium text-green-800">
            50+ File Formats
          </span>
        </div>
        
        <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-purple-50 rounded-full border border-purple-100">
          <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
          <span className="text-xs sm:text-sm font-medium text-purple-800">
            Always Growing
          </span>
        </div>
      </div>
    </div>
  );
}