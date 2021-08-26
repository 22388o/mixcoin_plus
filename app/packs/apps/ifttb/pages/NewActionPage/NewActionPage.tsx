import { Left as LeftIcon, Down as DownIcon } from '@icon-park/react';
import { FSwapActionThemeColor, FSwapLogoUrl } from 'apps/ifttb/constants';
import { useAppletForm } from 'apps/ifttb/contexts';
import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Popup } from 'zarm';
import { PandoLake } from 'pando-sdk-js';
import { IAsset } from 'pando-sdk-js/dist/lake/types';

let lakeAssets: IAsset[];
const pando = new PandoLake();
pando.assets().then((res) => {
  lakeAssets = res.data.assets.filter(
    (asset) => !asset.name.match(/^(4swap LP Token)/),
  );
});

export default function NewActionPage() {
  const history = useHistory();
  const { type } = useParams<{ type: string }>();

  return (
    <>
      <div
        className='relative p-4 text-xl font-bold'
        style={{ background: FSwapActionThemeColor }}
      >
        <LeftIcon
          onClick={() => history.goBack()}
          className='absolute pt-1 left-8'
          size='1.25rem'
        />
        <div className='text-center'>Create 4swap Action</div>
      </div>
      <div
        className='px-4 pt-4 pb-8 mb-4'
        style={{ background: FSwapActionThemeColor }}
      >
        <div className='flex justify-center mb-4'>
          <img className='w-12 h-12' src={FSwapLogoUrl} />
        </div>
        <div className='text-sm'>
          Use 4swap to swap asset or add / remove liquidity.
        </div>
      </div>
      {{ '4swap': <NewSwapTriggerComponent /> }[type]}
    </>
  );
}

function NewSwapTriggerComponent() {
  const [type, setType] = useState<null | 'swap' | 'add' | 'remove'>(null);
  const FswapTriggerItem = (props: {
    className?: string;
    children: JSX.Element | string;
    onClick?: () => any;
  }) => (
    <div
      onClick={props.onClick}
      className={`p-4 mb-4 text-center rounded ${props.className}`}
      style={{ background: FSwapActionThemeColor }}
    >
      {props.children}
    </div>
  );

  return (
    <>
      <div className='p-4 bg-white'>
        <FswapTriggerItem onClick={() => setType('swap')}>
          Swap
        </FswapTriggerItem>
        <FswapTriggerItem className='opacity-50'>
          Add liquidity
        </FswapTriggerItem>
        <FswapTriggerItem className='opacity-50'>
          Remove liquidity
        </FswapTriggerItem>
      </div>
      <Popup visible={Boolean(type)} onMaskClick={() => setType(null)}>
        <div className='relative overflow-scroll bg-white rounded-t-lg max-h-screen-3/4 min-h-screen-1/2'>
          <div className='sticky flex justify-center p-2'>
            <DownIcon size='2rem' />
          </div>
          {
            {
              swap: <SwapActionTrigger onClose={() => setType(null)} />,
            }[type]
          }
        </div>
      </Popup>
    </>
  );
}

function SwapActionTrigger(props: { onClose: () => any }) {
  const history = useHistory();

  const { appletForm, setAppletForm } = useAppletForm();
  const [payAsset, setPayAsset] = useState<null | IAsset>(null);
  const [payAmount, setPayAmount] = useState<null | string>('');
  const [fillAsset, setFillAsset] = useState<null | IAsset>(null);
  const [selectingAsset, setSelectingAsset] = useState<
    null | 'payAsset' | 'fillAsset'
  >(null);
  const [slippage, setSlippage] = useState<0.001 | 0.003 | 0.005>(0.001);

  const validateParams = () => {
    if (
      !payAsset?.id ||
      !fillAsset?.id ||
      !parseFloat(payAmount) ||
      !slippage
    ) {
      return false;
    }

    return true;
  };

  const createAction = () => {
    if (validateParams()) {
      const action = {
        description: `Swap ${payAmount} ${payAsset.symbol} to ${fillAsset.symbol}`,
        payAssetId: payAsset.id,
        fillAssetId: fillAsset.id,
        payAmount: parseFloat(payAmount),
        slippage,
      };
      setAppletForm({
        ...appletForm,
        applet4swapAction: action,
      });
      props.onClose();
      history.replace('/new');
    }
  };

  return (
    <div className='p-4'>
      <div className='mb-4'>
        <div className='flex items-center w-full bg-gray-100 rounded-full'>
          <div
            className='flex items-center space-x-2'
            onClick={() => setSelectingAsset('payAsset')}
          >
            {payAsset ? (
              <>
                <div className='relative'>
                  <img
                    className='p-1 rounded-full w-14 h-14'
                    src={payAsset.logo}
                  />
                  <img
                    className='absolute bottom-0 right-0 w-6 h-6 rounded'
                    src={payAsset.chain.logo}
                  />
                </div>
                <span>{payAsset.symbol}</span>
              </>
            ) : (
              <div className='p-4 text-xl font-bold text-center text-gray-300 bg-gray-100 rounded-full w-14 h-14'>
                ?
              </div>
            )}
          </div>
          <input
            className='flex-1 p-4 text-right bg-gray-100 rounded-r-full'
            placeholder='FROM'
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
        </div>
        {payAsset && (
          <div className='text-sm text-right text-gray-500'>
            ≈ ${(payAsset.price * parseFloat(payAmount))?.toFixed(2)}
          </div>
        )}
      </div>
      <div className='flex items-center w-full mb-4 bg-gray-100 rounded-full'>
        <div
          className='flex items-center space-x-2'
          onClick={() => setSelectingAsset('fillAsset')}
        >
          {fillAsset ? (
            <>
              <div className='relative'>
                <img
                  className='p-1 rounded-full w-14 h-14'
                  src={fillAsset.logo}
                />
                <img
                  className='absolute bottom-0 right-0 w-6 h-6 rounded'
                  src={fillAsset.chain.logo}
                />
              </div>
              <span>{fillAsset.symbol}</span>
            </>
          ) : (
            <div className='p-4 text-xl font-bold text-center text-gray-300 bg-gray-100 rounded-full w-14 h-14'>
              ?
            </div>
          )}
        </div>
        <input
          className='flex-1 p-4 text-right bg-gray-100 rounded-r-full'
          placeholder='TO'
          disabled
        />
      </div>
      <div className='flex items-center mb-8 space-x-4'>
        <div className='text-gray-500'>Slipage:</div>
        <div className='flex items-center justify-around flex-1 text-xs'>
          <div
            className={`py-1 px-4 border cursor-pointer rounded ${
              slippage === 0.001 ? 'bg-dark text-white' : 'bg-white'
            }`}
            onClick={() => setSlippage(0.001)}
          >
            0.1%
          </div>
          <div
            className={`py-1 px-4 border cursor-pointer rounded ${
              slippage === 0.003 ? 'bg-dark text-white' : 'bg-white'
            }`}
            onClick={() => setSlippage(0.003)}
          >
            0.3%
          </div>
          <div
            className={`py-1 px-4 border cursor-pointer rounded ${
              slippage === 0.005 ? 'bg-dark text-white' : 'bg-white'
            }`}
            onClick={() => setSlippage(0.005)}
          >
            0.5%
          </div>
        </div>
      </div>
      <div
        className={`w-full p-4 text-xl text-center rounded-full cursor-pointer ${
          validateParams() ? 'opacity-100' : 'opacity-50'
        }`}
        style={{ background: FSwapActionThemeColor }}
        onClick={() => createAction()}
      >
        Create Action
      </div>
      <Popup
        visible={Boolean(selectingAsset)}
        onMaskClick={() => setSelectingAsset(null)}
      >
        <div className='relative pt-12 overflow-y-scroll bg-white min-h-screen-1/2 max-h-screen-3/4'>
          <div className='fixed top-0 z-10 flex justify-center w-full p-2 bg-white'>
            <DownIcon size='2rem' />
          </div>
          {(lakeAssets || []).map((asset) => (
            <div
              key={asset.id}
              className='flex items-center p-4 space-x-4'
              onClick={() => {
                switch (selectingAsset) {
                  case 'payAsset':
                    if (asset.id != fillAsset?.id) {
                      setPayAsset(asset);
                      setPayAmount('1');
                      setSelectingAsset(null);
                    }
                    break;
                  case 'fillAsset':
                    if (asset.id != payAsset?.id) {
                      setFillAsset(asset);
                      setSelectingAsset(null);
                    }
                    break;
                }
              }}
            >
              <div className='relative'>
                <img className='w-8 h-8 rounded-full' src={asset.logo} />
                <img
                  className='absolute bottom-0 right-0 w-4 h-4 rounded-full'
                  src={asset.chain.logo}
                />
              </div>
              <span>{asset.symbol}</span>
            </div>
          ))}
        </div>
      </Popup>
    </div>
  );
}

function AddLiquidityActionTrigger() {}

function RemoveLiquidityActionTrigger() {}
