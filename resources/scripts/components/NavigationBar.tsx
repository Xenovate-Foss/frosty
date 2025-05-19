import * as React from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faLayerGroup, faSignOutAlt, faBars, faChevronLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';

// Create a context for NavItems
export const NavContext = createContext({
    registerNavItem: () => {},
    navItems: [],
});

// Color scheme constants
const COLORS = {
    black: '#121212',
    red: '#e53e3e',
    blue: '#3182ce',
    textLight: '#f7fafc',
    textDim: '#cbd5e0',
};

const SidebarContainer = styled.div`
    ${tw`h-screen fixed left-0 top-0 shadow-xl flex flex-col transition-all duration-300 ease-in-out z-50`};
    background-color: ${COLORS.black};
    width: ${(props) => (props.expanded ? '250px' : '64px')};
    transform: ${(props) => (props.mobileHidden ? 'translateX(-100%)' : 'translateX(0)')};
`;

const SidebarHeader = styled.div`
    ${tw`flex items-center justify-between py-4 px-4 border-b`};
    border-color: rgba(255, 255, 255, 0.1);
`;

const ToggleButton = styled.button`
    ${tw`transition-colors duration-150 p-2 rounded-full`};
    color: ${COLORS.textDim};

    &:hover {
        color: ${COLORS.textLight};
        background-color: rgba(255, 255, 255, 0.1);
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
        ${tw`flex items-center py-3 px-4 no-underline cursor-pointer transition-all duration-150 relative overflow-hidden`};
        color: ${COLORS.textDim};

        &:before {
            content: '';
            ${tw`absolute left-0 h-full w-1 transform -translate-y-full transition-transform duration-300`};
            background-color: ${COLORS.red};
        }

        &:active,
        &:hover {
            color: ${COLORS.textLight};
            background-color: rgba(255, 255, 255, 0.05);

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

            .icon-container svg,
            .icon-container span {
                color: ${COLORS.blue};
            }
        }

        &.active {
            color: ${COLORS.textLight};
            background-color: rgba(255, 255, 255, 0.05);
        }

        .icon-container {
            ${tw`flex items-center justify-center w-6`};
        }

        .text {
            ${tw`ml-4 whitespace-nowrap transition-opacity duration-200`};
            opacity: ${(props) => (props.expanded ? '1' : '0')};
            visibility: ${(props) => (props.expanded ? 'visible' : 'hidden')};
        }

        svg,
        span {
            transition: transform 0.2s ease, color 0.2s ease;
        }

        &:hover svg,
        &:hover span,
        &.active svg,
        &.active span {
            transform: scale(1.1);
        }
    }

    .subnav-item {
        ${tw`flex items-center py-2 px-4 pl-8 no-underline cursor-pointer transition-all duration-150 relative overflow-hidden text-sm`};
        color: ${COLORS.textDim};

        &:before {
            content: '';
            ${tw`absolute left-0 h-full w-1 transform -translate-y-full transition-transform duration-300`};
            background-color: ${COLORS.blue};
        }

        &:hover {
            color: ${COLORS.textLight};

            &:before {
                transform: translateY(0);
            }
        }

        &.active {
            color: ${COLORS.textLight};
            background-color: rgba(255, 255, 255, 0.05);

            &:before {
                transform: translateY(0);
            }
        }

        svg,
        span {
            transition: transform 0.2s ease, color 0.2s ease;
        }

        &:hover svg,
        &:hover span,
        &.active svg,
        &.active span {
            transform: scale(1.1);
        }
    }
`;

const NavSectionLabel = styled.div`
    ${tw`px-4 pt-4 pb-1 text-sm font-semibold uppercase tracking-wider text-center`};
    color: ${COLORS.textDim};
    opacity: ${(props) => (props.expanded ? '1' : '0')};
    visibility: ${(props) => (props.expanded ? 'visible' : 'hidden')};
    height: ${(props) => (props.expanded ? 'auto' : '0')};
    overflow: hidden;
`;

const Overlay = styled.div`
    ${tw`fixed inset-0 bg-black transition-opacity duration-300 z-40`};
    opacity: ${(props) => (props.visible ? '0.5' : '0')};
    pointer-events: ${(props) => (props.visible ? 'auto' : 'none')};
`;

const LogoContainer = styled.div`
    ${tw`overflow-hidden transition-all duration-300`};
    max-width: ${(props) => (props.expanded ? '180px' : '0')};
`;

const MobileToggleButton = styled.button`
    ${tw`fixed p-3 rounded-full shadow-lg z-40`};
    top: 16px;
    left: 16px;
    background-color: ${COLORS.black};
    color: ${COLORS.textDim};
    transition: transform 0.2s ease, background-color 0.2s ease;

    &:hover {
        transform: scale(1.05);
        color: ${COLORS.textLight};
        background-color: rgba(255, 255, 255, 0.1);
    }
`;

// Styled component for child items with animations
const ChildNavItem = styled(NavLink)`
    ${tw`flex items-center py-2 px-4 pl-8 no-underline cursor-pointer transition-all duration-150 relative overflow-hidden text-sm`};
    color: ${COLORS.textDim};

    &:before {
        content: '';
        ${tw`absolute left-0 h-full w-1 transform -translate-y-full transition-transform duration-300`};
        background-color: ${COLORS.blue};
    }

    &:hover {
        color: ${COLORS.textLight};
        background-color: rgba(255, 255, 255, 0.05);

        &:before {
            transform: translateY(0);
        }

        svg,
        span {
            transform: scale(1.1);
            color: ${COLORS.blue};
        }
    }

    &.active {
        color: ${COLORS.textLight};
        background-color: rgba(255, 255, 255, 0.05);

        &:before {
            transform: translateY(0);
        }

        svg,
        span {
            color: ${COLORS.blue};
        }
    }

    svg,
    span {
        transition: transform 0.2s ease, color 0.2s ease;
    }
`;

// Component for rendering navigation sections
const NavigationSection = ({ section, items, expanded }) => (
    <React.Fragment>
        <NavSectionLabel expanded={expanded}>{section}</NavSectionLabel>
        {items.map((item, index) => (
            <ChildNavItem key={`${item.path}-${index}`} to={item.path} activeClassName='active' exact={item.exact}>
                {item.icon && (
                    <div className='icon-container mr-2'>
                        <FontAwesomeIcon icon={item.icon} />
                    </div>
                )}
                <span>{item.label}</span>
            </ChildNavItem>
        ))}
    </React.Fragment>
);

// Component to wrap children with animation styles
const AnimatedChildren = ({ children, expanded }) => {
    // Clone each child and apply animation styles
    const enhancedChildren = React.Children.map(children, (child) => {
        // Skip if child is not a valid element
        if (!React.isValidElement(child)) return child;

        // Add animation classes to child
        return React.cloneElement(child, {
            className: `${child.props.className || ''} animated-nav-item`,
            style: {
                ...(child.props.style || {}),
                transition: 'transform 0.2s ease, color 0.2s ease',
            },
        });
    });

    return enhancedChildren;
};

interface NavigationBarProps {
    children?: React.ReactNode;
    section?: string;
}

export default ({ children, section }: NavigationBarProps) => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileHidden, setMobileHidden] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [navItems, setNavItems] = useState([]);

    // Group nav items by section
    const navSections = navItems.reduce((groups, item) => {
        const group = groups[item.section] || [];
        group.push(item);
        groups[item.section] = group;
        return groups;
    }, {});

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

    // Handle navbar registration from global window property
    useEffect(() => {
        if (window.navigator?.navBar) {
            const { children: navChildren, section: navSection } = window.navigator.navBar;

            // Clear existing items for this section to avoid duplicates
            setNavItems((prevItems) => prevItems.filter((item) => item.section !== navSection));

            // Process children to extract navigation items
            React.Children.forEach(navChildren, (child) => {
                if (!child || !child.props) return;

                // Only process components that have 'to' or 'href' props (links)
                if (child.props.to || child.props.href) {
                    const newItem = {
                        label: child.props.children,
                        path: child.props.to || child.props.href,
                        section: navSection,
                        exact: child.props.exact || false,
                        icon: child.props.icon || null,
                    };

                    setNavItems((prevItems) => [...prevItems, newItem]);
                }
            });
        }
    }, [window.navigator?.navBar]);

    // Function to register navigation items (kept for backward compatibility)
    const registerNavItem = (item) => {
        setNavItems((prevItems) => {
            const exists = prevItems.some((prevItem) => prevItem.path === item.path && prevItem.label === item.label);

            if (exists) {
                return prevItems;
            }

            return [...prevItems, item];
        });
    };

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

    // Add CSS for global animations
    useEffect(() => {
        // Create a style element
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
            .animated-nav-item svg,
            .animated-nav-item span {
                transition: transform 0.2s ease, color 0.2s ease;
            }
            
            .animated-nav-item:hover svg,
            .animated-nav-item:hover span,
            .animated-nav-item.active svg,
            .animated-nav-item.active span {
                transform: scale(1.1);
                color: ${COLORS.blue};
            }
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    return (
        <NavContext.Provider value={{ registerNavItem, navItems }}>
            <SpinnerOverlay visible={isLoggingOut} />
            <Overlay visible={isMobile && !mobileHidden} onClick={() => setMobileHidden(true)} />

            {/* Mobile toggle button */}
            {isMobile && mobileHidden && (
                <MobileToggleButton
                    onClick={() => {
                        setMobileHidden(false);
                        setExpanded(true);
                    }}
                    aria-label='Open menu'
                >
                    <FontAwesomeIcon icon={faBars} size='lg' />
                </MobileToggleButton>
            )}

            <SidebarContainer expanded={expanded} mobileHidden={isMobile && mobileHidden}>
                <SidebarHeader>
                    <LogoContainer expanded={expanded}>
                        <Link
                            to={'/'}
                            className={'text-xl font-header no-underline transition-colors duration-150'}
                            style={{ color: COLORS.textLight }}
                        >
                            {name}
                        </Link>
                    </LogoContainer>
                    <ToggleButton onClick={toggleSidebar} aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
                        <FontAwesomeIcon icon={expanded ? faChevronLeft : faBars} />
                    </ToggleButton>
                </SidebarHeader>

                <SidebarNavigation expanded={expanded}>
                    <NavLink to={'/'} exact className='group'>
                        <div className='icon-container'>
                            <FontAwesomeIcon
                                icon={faLayerGroup}
                                className='group-hover:scale-110 transition-transform duration-200'
                            />
                        </div>
                        <span className='text'>Dashboard</span>
                    </NavLink>

                    {/* Render children directly when passed in */}
                    {children && section && (
                        <React.Fragment>
                            <NavSectionLabel expanded={expanded}>{section}</NavSectionLabel>
                            <AnimatedChildren expanded={expanded}>{children}</AnimatedChildren>
                        </React.Fragment>
                    )}

                    {/* Render registered nav items by section */}
                    {Object.entries(navSections).map(([sectionName, items]) => (
                        <NavigationSection key={sectionName} section={sectionName} items={items} expanded={expanded} />
                    ))}

                    <Tooltip placement={expanded ? 'bottom' : 'right'} content={'Search'}>
                        <div className='w-full relative'>
                            {showSearch ? (
                                <div className='px-4 py-2'>
                                    <SearchContainer />
                                </div>
                            ) : (
                                <button
                                    className='w-full flex items-center py-3 px-4'
                                    onClick={() => {
                                        setShowSearch(true);
                                        if (isMobile) {
                                            setMobileHidden(true);
                                        }
                                    }}
                                >
                                    <div className='icon-container'>
                                        <FontAwesomeIcon
                                            icon={faSearch}
                                            className='group-hover:scale-110 transition-transform duration-200'
                                        />
                                    </div>
                                    <span className='text'>Search</span>
                                </button>
                            )}
                        </div>
                    </Tooltip>

                    {rootAdmin && (
                        <Tooltip placement={expanded ? 'bottom' : 'right'} content={'Admin'}>
                            <a href={'/admin'} rel={'noreferrer'} className='group'>
                                <div className='icon-container'>
                                    <FontAwesomeIcon
                                        icon={faCogs}
                                        className='group-hover:scale-110 transition-transform duration-200'
                                    />
                                </div>
                                <span className='text'>Admin</span>
                            </a>
                        </Tooltip>
                    )}

                    <Tooltip placement={expanded ? 'bottom' : 'right'} content={'Account Settings'}>
                        <NavLink to={'/account'} className='group'>
                            <div className='icon-container'>
                                <span
                                    className={
                                        'flex items-center justify-center w-5 h-5 group-hover:scale-110 transition-transform duration-200'
                                    }
                                >
                                    <Avatar.User />
                                </span>
                            </div>
                            <span className='text'>Account</span>
                        </NavLink>
                    </Tooltip>

                    <Tooltip placement={expanded ? 'bottom' : 'right'} content={'Sign Out'}>
                        <button onClick={onTriggerLogout} className='group'>
                            <div className='icon-container'>
                                <FontAwesomeIcon
                                    icon={faSignOutAlt}
                                    className='group-hover:scale-110 transition-transform duration-200'
                                />
                            </div>
                            <span className='text'>Sign Out</span>
                        </button>
                    </Tooltip>
                </SidebarNavigation>
            </SidebarContainer>
        </NavContext.Provider>
    );
};
