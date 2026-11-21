import { useState } from 'react';
import { ROLE_META } from '../data/valorantFallback';
import { Agent } from '../types/tactix';

interface AgentAvatarProps {
  agent: Agent;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function AgentAvatar({ agent, size = 'md', className = '' }: AgentAvatarProps) {
  const [errored, setErrored] = useState(false);
  const meta = ROLE_META[agent.role];
  const initials = agent.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'AG';

  if (agent.icon && !errored) {
    return (
      <span
        className={`clip-angle-sm inline-flex shrink-0 overflow-hidden bg-[#171E2B] ${SIZE_MAP[size]} ${className}`}
      >
        <img
          src={agent.icon}
          alt={agent.name}
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`clip-angle-sm inline-flex shrink-0 items-center justify-center font-display font-bold ${meta.bgClass} ${SIZE_MAP[size]} ${className}`}
      aria-label={agent.name}
    >
      {initials}
    </span>
  );
}
