import React, { forwardRef, useEffect } from 'react';
import { Form } from 'formik';
import styled, { keyframes } from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

// Dark blue theme colors
const colors = {
    primary: '#3B82F6', // blue-500
    primaryLight: '#60A5FA', // blue-400
    primaryDark: '#1D4ED8', // blue-700
    background: '#0F172A', // slate-900
    cardBg: '#1E293B', // slate-800
    textPrimary: '#F1F5F9', // slate-100
    textSecondary: '#94A3B8', // slate-400
    accent: '#2563EB', // blue-600
    borderHighlight: '#1E40AF', // blue-800
};

// Cool animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const glowPulse = keyframes`
  0% {
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.8), 0 0 15px rgba(59, 130, 246, 0.1);
  }
  50% {
    box-shadow: 0 4px 25px rgba(15, 23, 42, 0.9), 0 0 25px rgba(59, 130, 246, 0.4);
  }
  100% {
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.8), 0 0 15px rgba(59, 130, 246, 0.1);
  }
`;

const borderGlow = keyframes`
  0% {
    border-color: ${colors.borderHighlight};
  }
  50% {
    border-color: ${colors.primaryLight};
  }
  100% {
    border-color: ${colors.borderHighlight};
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const Container = styled.div`
    animation: ${fadeIn} 0.8s ease-out;

    ${breakpoint('sm')`
        ${tw`w-4/5 mx-auto`}
    `};

    ${breakpoint('md')`
        ${tw`p-10`}
    `};

    ${breakpoint('lg')`
        ${tw`w-3/5`}
    `};

    ${breakpoint('xl')`
        ${tw`w-full`}
        max-width: 700px;
    `};
`;

const FormContainer = styled.div`
    background-color: ${colors.cardBg};
    border: 1px solid ${colors.borderHighlight};
    animation: ${glowPulse} 4s infinite ease-in-out, ${borderGlow} 6s infinite ease-in-out;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
        transform: translateY(-5px) scale(1.01);
    }
`;

const FormTitle = styled.h2`
    color: ${colors.primary};
    text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
    background: linear-gradient(
        90deg,
        ${colors.primary},
        ${colors.primaryLight},
        ${colors.primary},
        ${colors.primaryDark},
        ${colors.primary}
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${shimmer} 8s linear infinite;
`;

/*&:after {
    content: '';
    position: absolute;
    top: 0;
    right: -2px;
    width: 2px;
    height: 50%;
    background: linear-gradient(to bottom, ${colors.accent}, transparent);
    animation: ${float} 4s infinite ease-in-out;
}
border-right: 2px solid ${colors.accent};
*/

const LogoContainer = styled.div`
    position: relative;

    img {
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
        transition: all 0.5s ease;
        animation: ${float} 6s infinite ease-in-out;

        &:hover {
            filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.8));
            transform: scale(1.05);
        }
    }
`;

const Footer = styled.p`
    color: ${colors.textSecondary};
    animation: ${fadeIn} 1s ease-out 0.5s backwards;

    a {
        color: ${colors.textSecondary};
        text-decoration: none;
        transition: color 0.3s ease, text-shadow 0.3s ease;

        &:hover {
            color: ${colors.primary};
            text-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
        }
    }
`;

// Create a wrapper for form inputs with animations
const FormInputAnimation = styled.div`
    opacity: 0;
    transform: translateY(20px);
    animation: ${fadeIn} 0.4s ease-out forwards;
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => {
    // Add staggered animations to child elements
    useEffect(() => {
        const formElements = document.querySelectorAll('.form-input-wrapper');
        formElements.forEach((element, index) => {
            (element as HTMLElement).style.animationDelay = `${0.2 + index * 0.1}s`;
        });
    }, []);

    // Wrap each child in an animation wrapper
    const animatedChildren = React.Children.map(props.children, (child, index) => {
        if (React.isValidElement(child)) {
            return (
                <FormInputAnimation className='form-input-wrapper' style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                    {child}
                </FormInputAnimation>
            );
        }
        return child;
    });

    return (
        <Container>
            {title && <FormTitle css={tw`text-3xl text-center font-medium py-4`}>{title}</FormTitle>}
            <FlashMessageRender css={tw`mb-2 px-1`} />
            <Form {...props} ref={ref}>
                <FormContainer css={tw`m-2 md:flex w-full rounded-lg p-6 md:pl-0 mx-1`}>
                    <LogoContainer css={tw`flex-none select-none mb-6 md:mb-0 self-center md:pr-6`}>
                        <img src={'/assets/svgs/pterodactyl.svg'} css={tw`block w-48 md:w-64 mx-auto`} />
                    </LogoContainer>
                    <div css={tw`flex-1 m-4 p-6 md:ml-8`}>{animatedChildren}</div>
                </FormContainer>
            </Form>
            <Footer css={tw`text-center text-xs mt-4`}>
                &copy; 2015 - {new Date().getFullYear()}&nbsp;
                <a rel={'noopener nofollow noreferrer'} href={'https://pterodactyl.io'} target={'_blank'}>
                    Pterodactyl Software & frosty theme by xenovate
                </a>
            </Footer>
        </Container>
    );
});
