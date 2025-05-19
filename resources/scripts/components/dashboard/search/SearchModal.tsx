import React, { useEffect, useRef, useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Field, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { object, string } from 'yup';
import debounce from 'debounce';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import InputSpinner from '@/components/elements/InputSpinner';
import getServers from '@/api/getServers';
import { Server } from '@/api/server/getServer';
import { ApplicationStore } from '@/state';
import { Link } from 'react-router-dom';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Input from '@/components/elements/Input';
import { ip } from '@/lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';

type Props = RequiredModalProps;

interface Values {
    term: string;
}

const SearchContainer = styled.div`
    ${tw`bg-black rounded-lg shadow-xl border border-blue-900`};
`;

const SearchHeader = styled.div`
    ${tw`bg-gradient-to-r from-blue-900 to-black p-4 rounded-t-lg`};
    border-bottom: 2px solid #ff3e3e;
`;

const ServerResult = styled(motion(Link))`
    ${tw`flex items-center bg-black p-4 rounded border-l-4 border-blue-800 no-underline transition-all duration-150 relative overflow-hidden`};

    &:hover {
        ${tw`shadow-lg border-red-500`};
        transform: translateY(-2px);
        background: linear-gradient(90deg, rgba(0, 0, 0, 0.9) 0%, rgba(17, 24, 39, 1) 100%);

        &:after {
            opacity: 1;
        }
    }

    &:after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 5px;
        height: 100%;
        background: linear-gradient(to bottom, #0066ff, #ff0000);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    &:not(:last-of-type) {
        ${tw`mb-3`};
    }
`;

const StyledInput = styled(Input)`
    ${tw`bg-black text-blue-100 border-2 border-blue-900 rounded`};
    transition: all 0.3s ease;

    &:focus {
        ${tw`border-red-500 shadow-lg`};
        box-shadow: 0 0 15px rgba(0, 102, 255, 0.3);
    }
`;

const Badge = styled(motion.span)`
    ${tw`text-xs py-1 px-2 rounded inline-flex items-center justify-center`};
    background: linear-gradient(135deg, #0066ff 0%, #001a33 100%);
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const NoResults = styled(motion.div)`
    ${tw`text-center p-8 text-gray-400`};
`;

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24,
        },
    },
};

const SearchWatcher = () => {
    const { values, submitForm } = useFormikContext<Values>();

    useEffect(() => {
        if (values.term.length >= 3) {
            submitForm();
        }
    }, [values.term]);

    return null;
};

export default ({ ...props }: Props) => {
    const ref = useRef<HTMLInputElement>(null);
    const isAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [servers, setServers] = useState<Server[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { clearAndAddHttpError, clearFlashes } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes
    );

    const search = debounce(({ term }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('search');
        setIsSearching(true);

        getServers({ query: term, type: isAdmin ? 'admin-all' : undefined })
            .then((servers) => setServers(servers.items.filter((_, index) => index < 5)))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'search', error });
            })
            .then(() => {
                setSubmitting(false);
                setIsSearching(false);
            })
            .then(() => ref.current?.focus());
    }, 500);

    useEffect(() => {
        if (props.visible) {
            if (ref.current) ref.current.focus();
            // Reset servers when modal opens
            setServers([]);
        }
    }, [props.visible]);

    // Formik does not support an innerRef on custom components.
    const InputWithRef = (props: any) => <StyledInput autoFocus {...props} ref={ref} />;

    return (
        <Formik
            onSubmit={search}
            validationSchema={object().shape({
                term: string().min(3, 'Please enter at least three characters to begin searching.'),
            })}
            initialValues={{ term: '' } as Values}
        >
            {({ isSubmitting, values }) => (
                <Modal {...props}>
                    <SearchContainer>
                        <SearchHeader>
                            <h2 css={tw`text-lg font-bold text-blue-100 mb-1`}>Server Search</h2>
                            <p css={tw`text-xs text-blue-300`}>Find your server quickly</p>
                        </SearchHeader>
                        <Form css={tw`p-4`}>
                            <FormikFieldWrapper
                                name={'term'}
                                label={'Search term'}
                                description={'Enter a server name, uuid, or allocation to begin searching.'}
                                css={tw`text-blue-100`}
                            >
                                <SearchWatcher />
                                <InputSpinner visible={isSubmitting}>
                                    <Field as={InputWithRef} name={'term'} placeholder='Search servers...' />
                                </InputSpinner>
                            </FormikFieldWrapper>
                        </Form>

                        <AnimatePresence>
                            {isSearching && (
                                <motion.div
                                    css={tw`flex justify-center items-center p-6`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.div
                                        css={tw`w-10 h-10 border-4 border-blue-600 border-t-red-500 rounded-full`}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {!isSearching && servers.length > 0 && (
                                <motion.div
                                    css={tw`px-4 pb-4`}
                                    variants={staggerContainer}
                                    initial='hidden'
                                    animate='show'
                                    exit={{ opacity: 0 }}
                                >
                                    {servers.map((server) => (
                                        <ServerResult
                                            key={server.uuid}
                                            to={`/server/${server.id}`}
                                            onClick={() => props.onDismissed()}
                                            variants={itemVariant}
                                        >
                                            <div css={tw`flex-1 mr-4`}>
                                                <p css={tw`text-sm font-medium text-blue-100`}>{server.name}</p>
                                                <p css={tw`mt-1 text-xs text-gray-400`}>
                                                    {server.allocations
                                                        .filter((alloc) => alloc.isDefault)
                                                        .map((allocation) => (
                                                            <span key={allocation.ip + allocation.port.toString()}>
                                                                {allocation.alias || ip(allocation.ip)}:
                                                                {allocation.port}
                                                            </span>
                                                        ))}
                                                </p>
                                            </div>
                                            <div css={tw`flex-none text-right`}>
                                                <Badge whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    {server.node}
                                                </Badge>
                                            </div>
                                        </ServerResult>
                                    ))}
                                </motion.div>
                            )}

                            {!isSearching && values.term.length >= 3 && servers.length === 0 && (
                                <NoResults
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    css={tw`pb-6`}
                                >
                                    <motion.div
                                        css={tw`text-red-500 text-5xl mb-2`}
                                        initial={{ rotateY: 0 }}
                                        animate={{ rotateY: 360 }}
                                        transition={{ duration: 1 }}
                                    >
                                        😕
                                    </motion.div>
                                    <h3 css={tw`text-blue-400 font-medium`}>No servers found</h3>
                                    <p css={tw`text-sm`}>Try a different search term</p>
                                </NoResults>
                            )}
                        </AnimatePresence>
                    </SearchContainer>
                </Modal>
            )}
        </Formik>
    );
};
