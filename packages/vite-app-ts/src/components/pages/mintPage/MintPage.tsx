import { Button, InputNumber, Space, Typography } from 'antd';
import { TTransactorFunc } from 'eth-components/functions';
import { useContractReader, useEventListener, useSignerAddress } from 'eth-hooks';
import { IEthersContext } from 'eth-hooks/models';
import { ethers } from 'ethers';
import React, { FC, useState } from 'react';

import { PosNFT } from '~~/generated/contract-types';
import LastMintedTable from './LastMintedTable';

const { Text, Link } = Typography;

export interface IMintPageProps {
  tx: TTransactorFunc | undefined;
  contract: PosNFT | undefined;
  ethersAppContext: IEthersContext;
}

/**
 * Home / Mint page
 * @returns
 */
export const MintPage: FC<IMintPageProps> = ({ tx, contract, ethersAppContext }) => {
  const [selectedBlock, setSelectedBlock] = useState(0);

  const [totalCount] = useContractReader(contract, contract?.totalCounter);
  const [mintEvents] = useEventListener(contract, 'Transfer', 0);

  const [address] = useSignerAddress(ethersAppContext.signer);

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
          </Space>
        ) : (
          <Button type="primary" onClick={() => console.log('loadWeb3Modal')}>
            CONNECT WALLET
          </Button>
        )}
      </div>

      <div>
        <Text>
          <strong>Total minted</strong>: {totalCount ? totalCount.toString() : '-'}{' '}
        </Text>
      </div>

      <div style={{ marginTop: '25px' }}>
        <Space direction="vertical">
          <Typography.Title level={3} style={{ margin: 0 }}>
            Last 25 minted
          </Typography.Title>
          <LastMintedTable events={mintEvents} />
        </Space>
      </div>
    </Space>
  );
};

export default MintPage;
