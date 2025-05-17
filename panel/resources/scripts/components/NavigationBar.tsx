import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCogs, 
  faLayerGroup, 
  faSignOutAlt,
  faBars,
  faChevronLeft,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw, { theme } from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';

const SidebarContainer = styled.div`
  ${tw`bg-neutral-900 h-screen fixed left-0 top-0 shadow-xl flex flex-col transition-all duration-300 ease-in-out z-50`};
  width: ${props => props.expanded ? '250px' : '64px'};
  transform: ${props => props.mobileHidden ? 'translateX(-100%)' : 'translateX(0)'};
`;

const SidebarHeader = styled.div`
  ${tw`flex items-center justify-between py-4 px-4 border-b border-neutral-800`};
`;

const ToggleButton = styled.button`
  ${tw`text-neutral-300 hover:text-neutral-100 transition-colors duration-150 p-2 rounded-full`};
  
  &:hover {
    ${tw`bg-neutral-800`};
    transform: scale(1.1);
  }
`;

const SidebarNavigation = styled.div`
  ${tw`flex flex-col w-full mt-4 overflow-y-auto`};
  
  & > a,
  & > button,
  & > .navigation-link,
  & > div > a,
  & > div > button {
    ${tw`flex items-center py-3 px-4 no-underline text-neutral-300 cursor-pointer transition-all duration-150 relative overflow-hidden`};

    &:before {
      content: '';
      ${tw`absolute left-0 h-full w-1 bg-cyan-600 transform -translate-y-full transition-transform duration-300`};
    }

    &:active,
    &:hover {
      ${tw`text-neutral-100 bg-neutral-800`};
      &:before {
        transform: translateY(0);
      }
    }

    &:active,
    &:hover,
    &.active {
      &:before {
        transform: translateY(0);
      }
    }
    
    .icon-container {
      ${tw`flex items-center justify-center w-6`};
    }
    
    .text {
      ${tw`ml-4 whitespace-nowrap transition-opacity duration-200`};
      opacity: ${props => props.expanded ? '1' : '0'};
      visibility: ${props => props.expanded ? 'visible' : 'hidden'};
    }
  }
`;

const Overlay = styled.div`
  ${tw`fixed inset-0 bg-black transition-opacity duration-300 z-40`};
  opacity: ${props => props.visible ? '0.5' : '0'};
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
`;

const LogoContainer = styled.div`
  ${tw`overflow-hidden transition-all duration-300`};
  max-width: ${props => props.expanded ? '180px' : '0'};
`;

const MobileToggleButton = styled.button`
  ${tw`fixed bg-neutral-800 hover:bg-neutral-700 text-neutral-200 p-3 rounded-full shadow-lg z-40`};
  top: 16px;
  left: 16px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

export default () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileHidden, setMobileHidden] = useState(true);
    const [showSearch, setShowSearch] = usestate(false);

    useEffect(() => {
      const checkScreenSize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (mobile) {
          setExpanded(false);
          setMobileHidden(true);
        } else {
          setMobileHidden(false);
        }
      };
      
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      
      return () => {
        window.removeEventListener('resize', checkScreenSize);
      };
    }, []);

    const toggleSidebar = () => {
      if (isMobile) {
        setMobileHidden(!mobileHidden);
      } else {
        setExpanded(!expanded);
      }
    };

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
      <>
        <SpinnerOverlay visible={isLoggingOut} />
        <Overlay visible={isMobile && !mobileHidden} onClick={() => setMobileHidden(true)} />
        
        {/* Mobile toggle button - Always visible on mobile when sidebar is hidden */}
        {isMobile && mobileHidden && (
          <MobileToggleButton 
            onClick={() => setMobileHidden(false)}
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} size="lg" />
          </MobileToggleButton>
        )}
        
        <SidebarContainer expanded={expanded} mobileHidden={isMobile && mobileHidden}>
          <SidebarHeader>
            <LogoContainer expanded={expanded}>
              <Link
                to={'/'}
                className={'text-xl font-header no-underline text-neutral-200 hover:text-neutral-100 transition-colors duration-150'}
              >
                {name}
              </Link>
            </LogoContainer>
            <ToggleButton onClick={toggleSidebar} aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}>
              <FontAwesomeIcon icon={expanded ? faChevronLeft : faBars} />
            </ToggleButton>
          </SidebarHeader>
          
          <SidebarNavigation expanded={expanded}>
            <NavLink to={'/'} exact className="group">
              <div className="icon-container">
                <FontAwesomeIcon icon={faLayerGroup} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              <span className="text">Dashboard</span>
            </NavLink>
            
            <Tooltip placement={expanded ? 'bottom' : 'right'} content={'Search'}>
              <div className="w-full relative">
                {showSearch ? (
                  <div className="px-4 py-2">
                    <SearchContainer />
                  </div>
                ) : (
                  <button className="w-full flex items-center py-3 px-4" onClick={() => {setShowSearch(true); setMobileHidden(true); setExpanded(false)}}>
                    <div className="icon-container">
                      <FontAwesomeIcon icon={faSearch} className="group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <span className="text">Search</span>
                  </button>
                )}
              </div>
            </Tooltip>
            
            {rootAdmin && (
              <Tooltip placement={expanded ? 'bottom' : 'right'} content={'Admin'}>
                <a href={'/admin'} rel={'noreferrer'} className="group">
                  <div className="icon-container">
                    <FontAwesomeIcon icon={faCogs} className="group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <span className="text">Admin</span>
                </a>
              </Tooltip>
            )}
            
            <Tooltip placement={expanded ? 'bottom' : 'right'} content={'Account Settings'}>
              <NavLink to={'/account'} className="group">
                <div className="icon-container">
                  <span className={'flex items-center justify-center w-5 h-5 group-hover:scale-110 transition-transform duration-200'}>
                    <Avatar.User />
                  </span>
                </div>
                <span className="text">Account</span>
              </NavLink>
            </Tooltip>
            
            <Tooltip placement={expanded ? 'bottom' : 'right'} content={'Sign Out'}>
              <button onClick={onTriggerLogout} className="group">
                <div className="icon-container">
                  <FontAwesomeIcon icon={faSignOutAlt} className="group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span className="text">Sign Out</span>
              </button>
            </Tooltip>
          </SidebarNavigation>
        </SidebarContainer>
        
        {/* Main content container - add this to your layout */}
        <div className={`transition-all duration-300 ${!isMobile && expanded ? 'ml-64' : !isMobile ? 'ml-16' : 'ml-0'}`}>
          {/* Your main content goes here */}
        </div>
      </>
    );
};