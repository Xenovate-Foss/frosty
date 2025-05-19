import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEthernet,
    faHdd,
    faMemory,
    faMicrochip,
    faServer,
    faBolt,
    faSync,
    faGamepad,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import Spinner from '@/components/elements/Spinner';
import styled, { keyframes } from 'styled-components/macro';
import isEqual from 'react-fast-compare';

// Animation keyframes
const pulse = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const statusGlow = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
  50% { box-shadow: 0 0 15px rgba(255, 255, 255, 0.8); }
  100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
`;

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const Icon = memo(
    styled(FontAwesomeIcon)<{ $alarm: boolean }>`
        ${(props) => (props.$alarm ? tw`text-red-400` : tw`text-neutral-500`)};
        transition: all 0.3s ease;

        &:hover {
            transform: scale(1.2);
            ${(props) => (props.$alarm ? tw`text-red-500` : tw`text-blue-400`)};
        }
    `,
    isEqual
);

const AnimatedIcon = styled(FontAwesomeIcon)`
    animation: ${float} 3s ease infinite;
    ${tw`text-blue-400`};
`;

const RotatingIcon = styled(FontAwesomeIcon)`
    animation: ${rotate} 8s linear infinite;
    ${tw`text-blue-500`};
`;

const IconDescription = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm ml-2`};
    ${(props) => (props.$alarm ? tw`text-white` : tw`text-neutral-400`)};
    transition: color 0.3s ease;

    &:hover {
        ${(props) => (props.$alarm ? tw`text-red-300` : tw`text-blue-300`)};
    }
`;

const StatusIndicatorBox = styled(GreyRowBox)<{ $status: ServerPowerState | undefined }>`
    ${tw`grid grid-cols-12 gap-4 relative bg-gradient-to-r from-blue-900 to-blue-800`};
    transition: all 0.3s ease;
    border: 1px solid transparent;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        ${tw`border-blue-500`};
    }

    & .status-bar {
        ${tw`w-2 absolute right-0 z-20 rounded-full m-1 opacity-70 transition-all duration-300`};
        height: calc(100% - 0.5rem);

        ${({ $status }) =>
            !$status || $status === 'offline'
                ? tw`bg-red-500`
                : $status === 'running'
                ? tw`bg-green-500`
                : tw`bg-yellow-500`};

        animation: ${pulse} 2s infinite ease-in-out;
    }

    &:hover .status-bar {
        ${tw`opacity-90 w-3`};
        animation: ${pulse} 1s infinite ease-in-out;
    }
`;

const ServerName = styled.p`
    ${tw`text-lg break-words font-semibold`};
    transition: color 0.3s ease;

    &:hover {
        ${tw`text-blue-400`};
    }
`;

const ServerDescription = styled.p`
    ${tw`text-sm text-neutral-300 break-words line-clamp-2`};
    transition: color 0.3s ease;

    &:hover {
        ${tw`text-blue-300`};
    }
`;

const ResourceBar = styled.div<{ $percentage: number; $alarm: boolean }>`
    ${tw`h-2 rounded-full mt-1 mb-2`};
    background: ${(props) =>
        props.$alarm
            ? 'linear-gradient(90deg, #ef4444 0%, #991b1b 100%)'
            : 'linear-gradient(90deg, #3b82f6 0%, #1e40af 100%)'};
    width: ${(props) => Math.min(100, Math.max(5, props.$percentage))}%;
    transition: width 1s ease-in-out;
`;

const StatusBadge = styled.span<{ $status: string }>`
    ${tw`rounded px-2 py-1 text-xs font-medium`};
    ${(props) => {
        switch (props.$status) {
            case 'running':
                return tw`bg-green-500 text-green-100`;
            case 'offline':
                return tw`bg-red-500 text-red-100`;
            case 'suspended':
                return tw`bg-red-500 text-red-100`;
            case 'transferring':
                return tw`bg-blue-500 text-blue-100`;
            case 'installing':
                return tw`bg-purple-500 text-purple-100`;
            default:
                return tw`bg-neutral-500 text-neutral-100`;
        }
    }}
    animation: ${statusGlow} 2s infinite;
`;

const StatsContainer = styled.div`
    ${tw`flex items-center justify-center flex-1`};
    transition: transform 0.3s ease;

    &:hover {
        transform: translateY(-3px);
    }
`;

const ServerIcon = styled.div`
    ${tw`mr-4 w-16 h-16 rounded-md overflow-hidden flex items-center justify-center bg-blue-700`};
    transition: all 0.3s ease;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);

    img {
        ${tw`w-full h-full object-cover`};
        transition: transform 0.5s ease;
    }

    &:hover img {
        transform: scale(1.1);
    }

    &:hover {
        box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3);
    }
`;

type Timer = ReturnType<typeof setInterval>;

export default ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);

    // You can set the server image based on server type or use a custom field
    // For example, you could map game types to specific images
    const getServerImageByType = () => {
        const serverType = server.container?.image?.toLowerCase() || '';

        // Map different server types to appropriate images
        if (serverType.includes('minecraft')) {
            return '/api/placeholder/160/160?text=MC';
        } else if (serverType.includes('valheim')) {
            return '/api/placeholder/160/160?text=VH';
        } else if (serverType.includes('terraria')) {
            return '/api/placeholder/160/160?text=TR';
        } else if (serverType.includes('rust')) {
            return '/api/placeholder/160/160?text=RS';
        } else {
            // Default placeholder with server name's first letter
            return `/api/placeholder/160/160?text=${encodeURIComponent(server.name.charAt(0))}`;
        }
    };

    // Use server.image if it exists, otherwise use a type-based image
    const serverImage = server.image || getServerImageByType();

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';

    // Calculate percentages for resource bars
    const cpuPercentage = stats?.cpuUsagePercent || 0;
    const memoryPercentage =
        server.limits.memory !== 0 && stats ? (stats.memoryUsageInBytes / mbToBytes(server.limits.memory)) * 100 : 0;
    const diskPercentage =
        server.limits.disk !== 0 && stats ? (stats.diskUsageInBytes / mbToBytes(server.limits.disk)) * 100 : 0;

    return (
        <StatusIndicatorBox
            as={Link}
            to={`/server/${server.id}`}
            className={className}
            $status={stats?.status}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div css={tw`flex items-center col-span-12 sm:col-span-5 lg:col-span-6`}>
                <ServerIcon>
                    {!imageError ? (
                        <img
                            src={serverImage}
                            alt={`${server.name} icon`}
                            onError={() => setImageError(true)}
                            css={isHovered ? tw`brightness-110` : tw``}
                        />
                    ) : // Fallback to server icon if image fails to load
                    isHovered ? (
                        <FontAwesomeIcon icon={faServer} css={tw`text-blue-300 text-3xl`} />
                    ) : (
                        <FontAwesomeIcon icon={faServer} css={tw`text-blue-400 text-3xl`} />
                    )}
                </ServerIcon>
                <div>
                    <ServerName>{server.name}</ServerName>
                    {!!server.description && <ServerDescription>{server.description}</ServerDescription>}
                </div>
            </div>
            <div css={tw`flex-1 ml-4 lg:block lg:col-span-2 hidden`}>
                <div css={tw`flex justify-center items-center`}>
                    <FontAwesomeIcon icon={faEthernet} css={tw`text-blue-500`} />
                    <p css={tw`text-sm text-neutral-400 ml-2 hover:text-blue-300 transition-colors duration-300`}>
                        {server.allocations
                            .filter((alloc) => alloc.isDefault)
                            .map((allocation) => (
                                <React.Fragment key={allocation.ip + allocation.port.toString()}>
                                    {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                </React.Fragment>
                            ))}
                    </p>
                </div>
            </div>
            <div css={tw`hidden col-span-7 lg:col-span-4 sm:flex items-baseline justify-center`}>
                {!stats || isSuspended ? (
                    isSuspended ? (
                        <div css={tw`flex-1 text-center`}>
                            <StatusBadge $status='suspended'>
                                {server.status === 'suspended' ? 'Suspended' : 'Connection Error'}
                            </StatusBadge>
                        </div>
                    ) : server.isTransferring || server.status ? (
                        <div css={tw`flex-1 text-center`}>
                            <StatusBadge $status={server.isTransferring ? 'transferring' : server.status || ''}>
                                {server.isTransferring
                                    ? 'Transferring'
                                    : server.status === 'installing'
                                    ? 'Installing'
                                    : server.status === 'restoring_backup'
                                    ? 'Restoring Backup'
                                    : 'Unavailable'}
                            </StatusBadge>
                        </div>
                    ) : (
                        <div css={tw`flex-1 flex justify-center items-center`}>
                            <RotatingIcon icon={faSync} />
                            <p css={tw`ml-2 text-blue-400`}>Loading...</p>
                        </div>
                    )
                ) : (
                    <>
                        <StatsContainer css={tw`ml-4 sm:block hidden`}>
                            <div css={tw`flex justify-center`}>
                                <Icon icon={faMicrochip} $alarm={alarms.cpu} />
                                <IconDescription $alarm={alarms.cpu}>
                                    {stats.cpuUsagePercent.toFixed(2)} %
                                </IconDescription>
                            </div>
                            <ResourceBar $percentage={cpuPercentage} $alarm={alarms.cpu} />
                            <p
                                css={tw`text-xs text-neutral-600 text-center transition-colors duration-300 hover:text-blue-300`}
                            >
                                of {cpuLimit}
                            </p>
                        </StatsContainer>
                        <StatsContainer css={tw`ml-4 sm:block hidden`}>
                            <div css={tw`flex justify-center`}>
                                <Icon icon={faMemory} $alarm={alarms.memory} />
                                <IconDescription $alarm={alarms.memory}>
                                    {bytesToString(stats.memoryUsageInBytes)}
                                </IconDescription>
                            </div>
                            <ResourceBar $percentage={memoryPercentage} $alarm={alarms.memory} />
                            <p
                                css={tw`text-xs text-neutral-600 text-center transition-colors duration-300 hover:text-blue-300`}
                            >
                                of {memoryLimit}
                            </p>
                        </StatsContainer>
                        <StatsContainer css={tw`ml-4 sm:block hidden`}>
                            <div css={tw`flex justify-center`}>
                                <Icon icon={faHdd} $alarm={alarms.disk} />
                                <IconDescription $alarm={alarms.disk}>
                                    {bytesToString(stats.diskUsageInBytes)}
                                </IconDescription>
                            </div>
                            <ResourceBar $percentage={diskPercentage} $alarm={alarms.disk} />
                            <p
                                css={tw`text-xs text-neutral-600 text-center transition-colors duration-300 hover:text-blue-300`}
                            >
                                of {diskLimit}
                            </p>
                        </StatsContainer>
                    </>
                )}
            </div>
            <div className={'status-bar'} />
        </StatusIndicatorBox>
    );
};
