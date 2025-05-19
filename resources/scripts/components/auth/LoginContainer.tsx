import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import styled, { keyframes } from 'styled-components/macro';

interface Values {
    username: string;
    password: string;
}

// Animations that match the FormContainer theme
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const glowEffect = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(37, 99, 235, 0.2);
  }
  50% {
    box-shadow: 0 0 15px rgba(37, 99, 235, 0.5);
  }
  100% {
    box-shadow: 0 0 5px rgba(37, 99, 235, 0.2);
  }
`;

const pulseText = keyframes`
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.8;
  }
`;

const shimmerBorder = keyframes`
  0% {
    border-color: rgba(29, 78, 216, 0.7);
  }
  50% {
    border-color: rgba(59, 130, 246, 0.9);
  }
  100% {
    border-color: rgba(29, 78, 216, 0.7);
  }
`;

// Styled components
const AnimatedField = styled.div`
    animation: ${fadeInUp} 0.5s ease-out forwards;
    opacity: 0;
`;

const AnimatedButton = styled(Button)`
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        animation: ${glowEffect} 2s infinite;
    }

    &:active:not(:disabled) {
        transform: translateY(1px);
    }

    &:before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(29, 78, 216, 0) 60%);
        opacity: 0;
        transform: scale(0.5);
        transition: all 0.5s ease-out;
    }

    &:hover:not(:disabled):before {
        opacity: 1;
        transform: scale(1);
    }
`;

const ForgotPasswordLink = styled(Link)`
    position: relative;
    display: inline-block;
    transition: all 0.3s ease;
    animation: ${pulseText} 4s infinite;

    &:after {
        content: '';
        position: absolute;
        width: 0;
        height: 1px;
        bottom: -2px;
        left: 50%;
        background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 1), transparent);
        transition: all 0.3s ease;
    }

    &:hover {
        text-shadow: 0 0 8px rgba(239, 68, 68, 0.5);

        &:after {
            width: 100%;
            left: 0;
        }
    }
`;

const EnhancedLoginFormContainer = styled(LoginFormContainer)`
    animation: ${fadeInUp} 0.7s ease-out, ${shimmerBorder} 4s infinite;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.9), 0 0 15px rgba(59, 130, 246, 0.2);
    transform: perspective(1000px) rotateX(0deg);
    transition: all 0.5s ease;

    &:hover {
        box-shadow: 0 20px 30px -10px rgba(15, 23, 42, 0.9), 0 0 20px rgba(59, 130, 246, 0.4);
        transform: perspective(1000px) rotateX(2deg) translateY(-5px);
    }
`;

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();

        // Add staggered animations to form elements
        const animateElements = () => {
            const elements = document.querySelectorAll('.animate-field');
            elements.forEach((el, index) => {
                (el as HTMLElement).style.animationDelay = `${0.3 + index * 0.15}s`;
            });
        };

        setTimeout(animateElements, 100);
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        // Add a slight delay to show the loading animation
        setTimeout(() => {
            login({ ...values, recaptchaData: token })
                .then((response) => {
                    if (response.complete) {
                        // Add a success animation before redirecting
                        const form = document.querySelector('.login-form-container');
                        if (form) {
                            form.classList.add('success-animation');
                            setTimeout(() => {
                                // @ts-expect-error this is valid
                                window.location = response.intended || '/';
                            }, 500);
                            return;
                        }
                        // @ts-expect-error this is valid
                        window.location = response.intended || '/';
                        return;
                    }

                    history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
                })
                .catch((error) => {
                    console.error(error);

                    setToken('');
                    if (ref.current) ref.current.reset();

                    // Add error shake animation
                    const form = document.querySelector('.login-form-container');
                    if (form) {
                        form.classList.add('error-animation');
                        setTimeout(() => form.classList.remove('error-animation'), 500);
                    }

                    setSubmitting(false);
                    clearAndAddHttpError({ error });
                });
        }, 300);
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <EnhancedLoginFormContainer
                    title={'Login to Continue'}
                    css={tw`w-full flex bg-gray-900 shadow-xl static`}
                    className='login-form-container'
                >
                    <AnimatedField className='animate-field text-white border-blue-800 bg-dark'>
                        <Field
                            className='border border-blue-900 text-white'
                            type={'text'}
                            label={'Username or Email'}
                            name={'username'}
                            disabled={isSubmitting}
                        />
                    </AnimatedField>
                    <AnimatedField css={tw`mt-6`} className='animate-field'>
                        <Field type={'password'} label={'Password'} name={'password'} disabled={isSubmitting} />
                    </AnimatedField>
                    <AnimatedField css={tw`mt-6`} className='animate-field'>
                        <AnimatedButton
                            type={'submit'}
                            size={'xlarge'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Login
                        </AnimatedButton>
                    </AnimatedField>
                    <AnimatedField css={tw`mt-6 text-center`} className='animate-field'>
                        <ForgotPasswordLink
                            to={'/auth/password'}
                            css={tw`text-xs text-red-500 tracking-wide no-underline uppercase hover:text-neutral-600`}
                        >
                            Forgot password?
                        </ForgotPasswordLink>
                    </AnimatedField>
                    {recaptchaEnabled && (
                        <div css={tw`top-20 left-full right-0 bottom-0 absolute`}>
                            <Reaptcha
                                ref={ref}
                                size={'invisible'}
                                sitekey={siteKey || '_invalid_key'}
                                onVerify={(response) => {
                                    setToken(response);
                                    submitForm();
                                }}
                                onExpire={() => {
                                    setSubmitting(false);
                                    setToken('');
                                }}
                            />
                        </div>
                    )}
                </EnhancedLoginFormContainer>
            )}
        </Formik>
    );
};

// Add global CSS for error animation
const injectGlobalStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes success-glow {
            0% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.2); }
            100% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.8); }
        }
        
        .error-animation {
            animation: shake 0.5s ease-in-out;
            border-color: #ef4444 !important;
        }
        
        .success-animation {
            animation: success-glow 0.5s ease-in forwards;
            border-color: #22c55e !important;
            transform: scale(1.02);
        }
    `;
    document.head.appendChild(style);
};

// Inject global styles on component mount
if (typeof window !== 'undefined') {
    injectGlobalStyles();
}

export default LoginContainer;
