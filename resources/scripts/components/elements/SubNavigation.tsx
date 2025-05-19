import React, { useEffect, useContext } from 'react';
import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';
import { NavContext } from '@/components/NavigationBar';

// Keep the original styled component for backward compatibility
const SubNavigationStyled = styled.div`
    ${tw`right-5 w-full bg-neutral-900 shadow overflow-x-auto`};

    & > div {
        ${tw`block items-center text-sm mx-auto px-2`};
        max-width: 1200px;

        & > a,
        & > div {
            ${tw`inline-block py-3 px-4 text-neutral-300 no-underline whitespace-nowrap transition-all duration-150`};

            &:not(:first-of-type) {
                ${tw`ml-2`};
            }

            &:hover {
                ${tw`text-neutral-100`};
            }

            &:active,
            &.active {
                ${tw`text-neutral-100`};
                box-shadow: inset 0 -2px ${theme`colors.cyan.600`.toString()};
            }
        }
    }
`;

interface SubNavigationProps {
    children?: React.ReactNode;
    section?: string;
    renderAsComponent?: boolean; // Option to render as styled component
}

const SubNavigation: React.FC<SubNavigationProps> = ({
    children,
    section = 'Navigation',
    renderAsComponent = false,
}) => {
    const navContext = useContext(NavContext);

    useEffect(() => {
        if (!navContext) {
            console.warn(
                'SubNavigation: NavContext not found. Make sure NavigationBar is rendered above this component.'
            );
            return;
        }

        const { registerNavItem } = navContext;

        // Register items using context (preferred method)
        React.Children.forEach(children, (child) => {
            if (!child || !React.isValidElement(child) || !child.props) return;

            if (child.props.to || child.props.href) {
                registerNavItem({
                    label: child.props.children,
                    path: child.props.to || child.props.href,
                    section: section,
                    exact: child.props.exact || false,
                });
            }
        });

        // Also set on window object for backward compatibility
        if (typeof window !== 'undefined') {
            window.navigator = window.navigator || {};
            window.navigator.navBar = { children, section };
        }

        // Cleanup function to remove items when component unmounts
        return () => {
            if (typeof window !== 'undefined' && window.navigator?.navBar?.section === section) {
                delete window.navigator.navBar;
            }
        };
    }, [children, section, navContext]);

    // Option to render as the original styled component if needed
    if (renderAsComponent && children) {
        return (
            <SubNavigationStyled>
                <div>{children}</div>
            </SubNavigationStyled>
        );
    }

    // Default behavior: register items and return null (items will appear in sidebar)
    return null;
};

export default SubNavigation;
