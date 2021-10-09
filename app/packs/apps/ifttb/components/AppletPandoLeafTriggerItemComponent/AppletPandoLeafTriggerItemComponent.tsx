import { PandoLeafLogoUrl } from 'apps/ifttb/constants';
import { AppletPandoLeafTrigger } from 'graphqlTypes';
import React from 'react';

export default function AppletPandoLeafTriggerItemComponent(props: {
  trigger: Partial<AppletPandoLeafTrigger> | any;
  onClick?: () => any;
}) {
  const { trigger, onClick } = props;
  return (
    <div
      className='flex items-start p-4 mb-8 text-lg font-bold rounded-lg cursor-pointer bg-gray-50 space-x-2'
      onClick={onClick}
    >
      <span className='text-xl'>If</span>
      <img className='rounded-full w-7 h-7' src={PandoLeafLogoUrl} />
      <span className='leading-7'>{trigger.params.description}</span>
    </div>
  );
}
