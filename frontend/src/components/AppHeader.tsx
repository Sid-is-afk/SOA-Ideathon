import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';
import { Shield, Briefcase, Navigation, LogOut, Globe, ChevronDown, Check } from 'lucide-react';

interface AppHeaderProps {
  user: User | null;
  activeRole?: UserRole | 'shipper';
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, activeRole }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { language, setLanguage, t, languages, currentLanguageOption } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    navigate('/');
  };

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize role
  const normalizedRole: UserRole = activeRole === 'shipper' ? 'business' : (activeRole || user?.role || 'admin');

  // Premium Role Theming Configurations
  const roleThemes = {
    admin: {
      bg: 'bg-gradient-to-r from-[#112A26] to-[#163832]',
      border: 'border-[#245249]',
      roleLabel: 'PLATFORM ADMIN',
      roleBadge: 'bg-[#245249]/60 text-[#E5EBE3] border-[#5C7A50]/50 shadow-[0_0_15px_rgba(92,122,80,0.3)]',
      icon: Shield,
    },
    business: {
      bg: 'bg-gradient-to-r from-[#4A6340] to-[#5C7A50]',
      border: 'border-[#769669]',
      roleLabel: t('shipper.roleBadge', 'BUSINESS / SHIPPER'),
      roleBadge: 'bg-[#435A3A]/60 text-[#F3F5F2] border-[#769669]/50 shadow-[0_0_15px_rgba(118,150,105,0.3)]',
      icon: Briefcase,
    },
    agent: {
      bg: 'bg-gradient-to-r from-[#B5721C] to-[#D98E2B]',
      border: 'border-[#EBB05E]/50',
      roleLabel: t('driver.roleBadge', 'DELIVERY AGENT'),
      roleBadge: 'bg-[#B5721C]/60 text-[#FFFFFF] border-[#EBB05E]/50 shadow-[0_0_15px_rgba(235,176,94,0.3)]',
      icon: Navigation,
    },
  };

  const theme = roleThemes[normalizedRole];
  const IconComponent = theme.icon;

  // Render language selector ONLY for Shipper (business) or Delivery Agent (agent)
  const showLanguageSelector = normalizedRole === 'business' || normalizedRole === 'agent';

  return (
    <header className={`${theme.bg} text-[#FFFFFF] border-b ${theme.border} transition-all duration-500 ease-in-out select-none shadow-lg relative z-50`}>
      
      {/* Aesthetic Glass Highlights */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
      <div className="absolute -top-[50%] -left-[10%] w-[40%] h-[200%] bg-white/5 rotate-12 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand & Platform Identity */}
          <div className="flex items-center gap-2.5 sm:gap-4 transition-all duration-300">
            
            {/* Logo Link */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
              
              {/* Logo Emblem Container */}
              <div className="relative flex-shrink-0 group w-9 h-9 sm:w-11 sm:h-11">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Perfect Circle Boundary */}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white shadow-md border border-white/30 flex items-center justify-center p-0.5">
                  <img 
                    src="/karwaan-logo.png" 
                    alt="Karwaan Logo" 
                    className="w-full h-full object-contain transform transition-transform duration-300 group-hover:scale-110" 
                  />
                </div>
              </div>

              {/* Title & Badges */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-lg sm:text-2xl tracking-tight text-[#FFFFFF] drop-shadow-md">
                    {t('common.platformTitle', 'KARWAAN')}
                  </span>
                  {/* Modernized pill badge */}
                  <span className="hidden md:inline-flex items-center font-mono text-[9px] sm:text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-black/25 text-[#FFFFFF] border border-white/10 backdrop-blur-md shadow-inner">
                    {t('common.agriLogistics', 'AGRI-LOGISTICS')}
                  </span>
                </div>
                {/* Subtitle - visible on larger desktops */}
                <span className="text-[11px] font-sans font-medium text-white/80 -mt-0.5 hidden xl:block tracking-wide">
                  {t('common.platformSubtitle', 'Multimodal Perishables Consolidation Network')}
                </span>
              </div>
            </Link>

            {/* Current Role Glowing Banner Chip */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border backdrop-blur-md ${theme.roleBadge} ml-1 sm:ml-2 transition-all`}>
              <IconComponent className="w-4 h-4 opacity-90" />
              <span className="tracking-wide">{theme.roleLabel}</span>
            </div>
          </div>

          {/* Right Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Language Selector Dropdown - ONLY for Shipper / Agent */}
            {showLanguageSelector && (
              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-black/20 hover:bg-black/35 border border-white/20 text-white text-xs font-medium backdrop-blur-md transition-all shadow-sm active:scale-95 cursor-pointer group"
                  title="Select Corridor Language"
                >
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D98E2B] group-hover:rotate-45 transition-transform duration-300" />
                  <span className="font-semibold text-xs tracking-wide">
                    {currentLanguageOption.flag} {currentLanguageOption.nativeName}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#163832] border border-[#5C7A50]/40 rounded-2xl shadow-2xl py-2 z-[100] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D98E2B]">
                        {t('common.selectLanguage', 'Corridor Languages')}
                      </span>
                    </div>
                    {languages.map((lang) => {
                      const isSelected = lang.code === language;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code as SupportedLanguage);
                            setIsLangOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-white/15 text-white font-bold' : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{lang.flag}</span>
                            <div>
                              <div className="leading-tight font-medium text-white">{lang.nativeName}</div>
                              <div className="text-[10px] text-white/50 font-mono leading-tight">{lang.corridor}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#D98E2B]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* User Profile Capsule */}
            {user && (
              <div className="hidden sm:flex items-center gap-3 bg-black/15 pl-2 pr-3 py-1.5 rounded-full border border-white/10 shadow-inner backdrop-blur-sm hover:bg-black/25 transition-colors cursor-default">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm font-mono uppercase shadow-sm border border-white/10">
                  {(user.name || user.email || 'U').charAt(0)}
                </div>
                <div className="flex flex-col text-left justify-center">
                  <span className="text-xs font-bold text-[#FFFFFF] leading-tight tracking-wide">
                    {user.name || user.email}
                  </span>
                  <span className="text-[10px] text-white/70 font-mono leading-tight truncate max-w-[120px]">
                    {user.businessName || user.title || 'User Profile'}
                  </span>
                </div>
              </div>
            )}

            {/* Logout Button (on Business side) */}
            {normalizedRole === 'business' && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold bg-white text-[#1A211E] px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-red-50 hover:text-[#B3462C] hover:border-red-200 transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_15px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 flex items-center gap-1.5 sm:gap-2 active:scale-95 cursor-pointer border border-transparent"
              >
                <span>{t('common.logout', 'Logout')}</span>
                <LogOut className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};