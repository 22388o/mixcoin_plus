import { Down as DownIcon } from '@icon-park/react';
import { useDebounce } from 'ahooks';
import { FSwapActionThemeColor } from 'apps/ifttb/constants';
import { PandoLake } from 'pando-sdk-js';
import { IAsset } from 'pando-sdk-js/dist/lake/types';
import React, { useState } from 'react';
import { Picker, Popup } from 'zarm';

let lakeAssets: IAsset[];
const pando = new PandoLake();
pando.assets().then((res) => {
  lakeAssets = res.data.assets.filter(
    (asset) => !asset.symbol.match(/^s(\S+-\S+)/),
  );
});

export default function Editing4swapPriceTriggerComponent(props: {
  onFinish: (trigger) => any;
}) {
  const [baseAsset, setBaseAsset] = useState<null | IAsset>(null);
  const [quoteAsset, setQuoteAsset] = useState<null | IAsset>(null);
  const [selectingAsset, setSelectingAsset] = useState<
    null | 'baseAsset' | 'quoteAsset'
  >(null);
  const [targetIndex, setTargetIndex] = useState<'ask_price' | 'bid_price'>(
    'ask_price',
  );
  const [choosingTargetIndex, setChoosingTargetIndex] = useState(false);
  const [compareAction, setCompareAction] = useState<
    'larger_than' | 'less_than'
  >('larger_than');
  const [choosingCompareAction, setChoosingCompareAction] = useState(false);
  const [targetValue, setTargetValue] = useState('');

  const validateParams = () => {
    if (
      !baseAsset ||
      !quoteAsset ||
      !targetIndex ||
      !parseFloat(targetValue) ||
      parseFloat(targetValue) < 0.000_000_01 ||
      !compareAction
    ) {
      return false;
    }
    return true;
  };

  const createTrigger = () => {
    const trigger = {
      description: `price of ${
        targetIndex === 'ask_price' ? 'selling' : 'buying'
      } ${baseAsset.symbol} ${
        compareAction === 'larger_than' ? '>=' : '<='
      } ${targetValue} ${quoteAsset.symbol}`,
      baseAssetId: baseAsset.id,
      quoteAssetId: quoteAsset.id,
      targetIndex,
      targetValue: parseFloat(targetValue),
      compareAction,
    };
    props.onFinish(trigger);
  };

  return (
    <div className='p-4'>
      <div className='mb-8 text-lg'>
        <div className='flex items-center justify-center mb-4 space-x-4'>
          <div
            className='flex items-center space-x-2'
            onClick={() => setSelectingAsset('baseAsset')}
          >
            {baseAsset ? (
              <>
                <div className='relative'>
                  <img
                    className='w-12 h-12 p-1 rounded-full'
                    src={baseAsset.logo}
                  />
                  <img
                    className='absolute bottom-0 right-0 w-4 h-4 rounded'
                    src={baseAsset.chain.logo}
                  />
                </div>
                <span>{baseAsset.symbol}</span>
              </>
            ) : (
              <div className='w-12 h-12 p-3 text-xl font-bold text-center text-gray-300 bg-gray-100 rounded-full'>
                ?
              </div>
            )}
          </div>
          <span>/</span>
          <div
            className='flex items-center space-x-2'
            onClick={() => setSelectingAsset('quoteAsset')}
          >
            {quoteAsset ? (
              <>
                <div className='relative'>
                  <img
                    className='w-12 h-12 p-1 rounded-full'
                    src={quoteAsset.logo}
                  />
                  <img
                    className='absolute bottom-0 right-0 w-4 h-4 rounded'
                    src={quoteAsset.chain.logo}
                  />
                </div>
                <span>{quoteAsset.symbol}</span>
              </>
            ) : (
              <div className='w-12 h-12 p-3 text-xl font-bold text-center text-gray-300 bg-gray-100 rounded-full'>
                ?
              </div>
            )}
          </div>
        </div>
        {baseAsset && quoteAsset && (
          <>
            <div className='mb-4'>Run your applet when</div>
            <div
              className='flex items-center justify-center mb-2 space-x-4'
              onClick={() => setChoosingTargetIndex(true)}
            >
              <span className='font-bold'>
                Price of {targetIndex === 'ask_price' ? 'selling' : 'buying'}{' '}
                {baseAsset.symbol}
              </span>
            </div>
            <div
              className='mb-2 font-bold text-center'
              onClick={() => setChoosingCompareAction(true)}
            >
              {compareAction === 'larger_than' ? '>=' : '<='}
            </div>
            <Picker
              visible={choosingCompareAction}
              value={compareAction}
              dataSource={[
                {
                  value: 'larger_than',
                  label: '>=',
                },
                {
                  value: 'less_than',
                  label: '<=',
                },
              ]}
              onOk={(selected: any) => {
                setCompareAction(selected[0].value);
                setChoosingCompareAction(false);
              }}
              onCancel={() => setChoosingTargetIndex(false)}
              itemRender={(data) => data.label}
            />
            <div className='flex items-center justify-center space-x-4'>
              <input
                className='py-2 text-right border-b w-36'
                value={targetValue}
                placeholder='input target price'
                onChange={(e) => setTargetValue(e.target.value)}
              />
              <span>{quoteAsset.symbol}</span>
            </div>
            <Picker
              visible={choosingTargetIndex}
              value={targetIndex}
              dataSource={[
                {
                  value: 'ask_price',
                  label: `Price of selling ${baseAsset.symbol}`,
                },
                {
                  value: 'bid_price',
                  label: `Price of buying ${baseAsset.symbol}`,
                },
              ]}
              onOk={(selected: any) => {
                setTargetIndex(selected[0].value);
                setChoosingTargetIndex(false);
              }}
              onCancel={() => setChoosingTargetIndex(false)}
              itemRender={(data) => data.label}
            />
          </>
        )}
      </div>
      <div
        className={`w-full p-4 text-xl text-center rounded-full cursor-pointer ${
          validateParams() ? 'opacity-100' : 'opacity-50'
        }`}
        style={{ background: FSwapActionThemeColor }}
        onClick={() => createTrigger()}
      >
        Create Trigger
      </div>
      <Popup
        visible={Boolean(selectingAsset)}
        onMaskClick={() => setSelectingAsset(null)}
      >
        <LakeAssetsList
          onClick={(asset) => {
            switch (selectingAsset) {
              case 'baseAsset':
                if (asset.id != quoteAsset?.id) {
                  setBaseAsset(asset);
                  setSelectingAsset(null);
                }
                break;
              case 'quoteAsset':
                if (asset.id != baseAsset?.id) {
                  setQuoteAsset(asset);
                  setSelectingAsset(null);
                }
                break;
            }
          }}
        />
      </Popup>
    </div>
  );
}

function LakeAssetsList(props: { onClick: (asset) => any }) {
  const [query, setQuery] = useState('');
  const deboundedQuery = useDebounce(query, { wait: 500 });
  const assets = deboundedQuery
    ? lakeAssets.filter(
        (asset) =>
          asset.symbol.match(new RegExp(deboundedQuery, 'i')) ||
          asset.name.match(new RegExp(deboundedQuery, 'i')),
      )
    : lakeAssets;
  return (
    <div className='relative pt-12 overflow-y-scroll bg-white min-h-screen-1/2 max-h-screen-3/4'>
      <div className='fixed top-0 z-10 flex justify-center w-full p-2 bg-white'>
        <DownIcon size='2rem' />
      </div>
      <div className='px-4'>
        <input
          className='block w-full p-4 mb-4 bg-gray-100 rounded'
          placeholder='Search'
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      </div>
      {(assets || []).map((asset) => (
        <div
          key={asset.id}
          className='flex items-center p-4 space-x-4'
          onClick={() => props.onClick(asset)}
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
  );
}
