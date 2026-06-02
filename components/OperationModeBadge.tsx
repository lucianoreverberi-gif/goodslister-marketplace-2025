import React from 'react';
import { ShieldCheck, ShieldAlert, FileSignature } from 'lucide-react';

interface OperationModeBadgeProps {
  mode: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const OperationModeBadge: React.FC<OperationModeBadgeProps> = ({
  mode,
  size = 'md',
  showLabel = true,
}) => {
  // Get Mode Configs
  let bgColor = '';
  let textColor = '';
  let borderColor = '';
  let Icon = ShieldCheck;
  let shortLabel = '';
  let longLabel = '';

  switch (mode) {
    case 1:
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      borderColor = 'border-green-300';
      Icon = ShieldCheck;
      shortLabel = 'Peer Waiver';
      longLabel = 'Protected by Goodslister Waiver';
      break;
    case 2:
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      borderColor = 'border-blue-300';
      Icon = ShieldAlert;
      shortLabel = 'P2P Insured';
      longLabel = 'Peer-to-Peer Insurance Required';
      break;
    case 3:
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
      borderColor = 'border-orange-300';
      Icon = FileSignature;
      shortLabel = 'Charter';
      longLabel = 'Bareboat Charter Agreement';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      borderColor = 'border-gray-300';
      Icon = ShieldCheck;
      shortLabel = 'Standard';
      longLabel = 'Standard Protection';
  }

  // Size Styling
  let sizeClass = '';
  let iconSize = 14;

  if (size === 'sm') {
    sizeClass = 'px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold';
    iconSize = 12;
  } else if (size === 'lg') {
    sizeClass = 'px-3 py-1.5 text-sm font-semibold';
    iconSize = 18;
  } else {
    // md
    sizeClass = 'px-2.5 py-1 text-xs font-semibold';
    iconSize = 15;
  }

  const label = size === 'sm' ? shortLabel : longLabel;

  return (
    <div
      className={`inline-flex items-center gap-1 border rounded-full ${bgColor} ${textColor} ${borderColor} ${sizeClass} transition-colors duration-200`}
    >
      <Icon size={iconSize} className="flex-shrink-0" />
      {showLabel && <span className="leading-none whitespace-nowrap">{label}</span>}
    </div>
  );
};
