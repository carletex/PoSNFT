import { Button, InputNumber, Space, Typography } from 'antd';
import { TTransactorFunc } from 'eth-components/functions';
import { useBlockNumber, useContractReader, useEventListener, useSignerAddress } from 'eth-hooks';
import { IEthersContext } from 'eth-hooks/models';
import { ethers } from 'ethers';
import moment from 'moment';
import React, { FC, useState } from 'react';

import { IScaffoldAppProviders } from '~~/components/main/hooks/useScaffoldAppProviders';
import { LastMintedTable } from '~~/components/pages';
import { getEstimatedTimestampForBlock } from '~~/functions/getEstimatedTimestampForBlock';
import { PosNFT } from '~~/generated/contract-types';
const { Text, Link } = Typography;

export interface IMintPageProps {
  tx: TTransactorFunc | undefined;
  contract: PosNFT | undefined;
  ethersAppContext: IEthersContext;
  scaffoldAppProviders: IScaffoldAppProviders;
}

/**
 * Home / Mint page
 * @returns
 */
export const MintPage: FC<IMintPageProps> = ({ tx, contract, ethersAppContext, scaffoldAppProviders }) => {
  const [selectedBlock, setSelectedBlock] = useState(0);
  const [currentMainnetBlock, setCurrentMainnetBlock] = useState(0);

  const [totalCount] = useContractReader(contract, contract?.totalCounter);
  const [mintEvents] = useEventListener(contract, 'Transfer', 0);

  const [address] = useSignerAddress(ethersAppContext.signer);

  useBlockNumber(scaffoldAppProviders.mainnetAdaptor?.provider, (blockNumber) =>
    setCurrentMainnetBlock(blockNumber ?? 0)
  );

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex', margin: '20px auto', maxWidth: '800px' }}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        PoS NFT
      </Typography.Title>

      <Text>Guess what the first PoS Block would be and get the 90% (*) of all minting proceeds.</Text>
      <Text>
        (*) 10% will be used for public goods on the{' '}
        <Link href="https://buidlguidl.com/" target="_blank">
          BuidlGuidl
        </Link>
      </Text>

      <Text style={{ fontSize: '20px' }}>
        <strong>Current Mainnet Block</strong>:{' '}
        <span style={{ cursor: 'pointer' }} onClick={(): void => setSelectedBlock(currentMainnetBlock)}>
          {currentMainnetBlock}
        </span>
      </Text>

      <Text style={{ fontSize: '20px' }}>
        <strong>Total minted</strong>: {totalCount ? totalCount.toString() : '-'}{' '}
      </Text>

      <div>
        {ethersAppContext.signer && address ? (
          <Space direction="vertical">
            <InputNumber
              min={0}
              value={selectedBlock}
              style={{ minWidth: '200px' }}
              onChange={(number): void => {
                setSelectedBlock(number);
              }}
            />
            <Button
              type="primary"
              onClick={async () => {
                try {
                  const txCur = await tx?.(
                    contract?.mint(address, selectedBlock, {
                      value: ethers.utils.parseEther('0.01'),
                    })
                  );
                  await txCur?.wait();
                } catch (e) {
                  console.log('mint failed', e);
                }
              }}>
              MINT for Ξ0.01
            </Button>
            {selectedBlock > currentMainnetBlock && (
              <Text>
                <strong>Estimation</strong>:{' '}
                {moment(getEstimatedTimestampForBlock(currentMainnetBlock, selectedBlock)).format('MMMM Do YYYY')}
              </Text>
            )}
          </Space>
        ) : (
          <Button
            type="primary"
            onClick={(): void => ethersAppContext.openModal(scaffoldAppProviders.createLoginConnector()!)}>
            CONNECT WALLET
          </Button>
        )}
      </div>

      <div style={{ margin: '25px 0 50px 0' }}>
        <Space direction="vertical">
          <Typography.Title level={3} style={{ margin: 0 }}>
            Last 25 minted
          </Typography.Title>
          <LastMintedTable events={mintEvents} scaffoldAppProviders={scaffoldAppProviders} />
        </Space>
      </div>
    </Space>
  );
};

export default MintPage;
