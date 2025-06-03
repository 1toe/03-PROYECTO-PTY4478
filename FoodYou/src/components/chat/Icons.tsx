import React from 'react';
import { IonIcon } from '@ionic/react';
import {
  send,
  person,
  warningOutline,
  search,
  refresh,
  trashBinOutline,
} from 'ionicons/icons';
import manzanitaSvg from '../../assets/manzanita.svg';

export const LoadingSpinner: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`animate-spin ${props.className || ''}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const SendIcon: React.FC<{ className?: string; color?: string }> = ({ className, color }) => (
  <IonIcon icon={send} className={className} style={{ color }} />
);

export const UserIcon: React.FC<{ className?: string; color?: string }> = ({ className, color }) => (
  <IonIcon icon={person} className={className} style={{ color }} />
);

export const BotIcon: React.FC<{ className?: string; color?: string }> = ({ className, color }) => (
  <img 
    src={manzanitaSvg} 
    alt="Manzanita AI" 
    className={className} 
    style={{ 
      width: '24px', 
      height: '24px', 
      color,
      verticalAlign: 'middle'
    }} 
  />
);

export const ResetChatIcon: React.FC<{ className?: string; color?: string }> = ({ className, color }) => (
  <IonIcon icon={trashBinOutline} className={className} style={{ color }} />
);

export const AlertTriangleIcon: React.FC<{ className?: string; color?: string }> = ({ className, color }) => (
  <IonIcon icon={warningOutline} className={className} style={{ color }} />
);

export const SearchIcon: React.FC<{ className?: string; color?: string }> = ({ className, color }) => (
  <IonIcon icon={search} className={className} style={{ color }} />
);

export const RefreshIcon: React.FC<{ className?: string; color?: string }> = ({ className, color }) => (
  <IonIcon icon={refresh} className={className} style={{ color }} />
);
