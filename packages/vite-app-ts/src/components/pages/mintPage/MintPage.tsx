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
import { PosBlockIncentivizedOracle, PosNFT } from '~~/generated/contract-types';
import { Address, Balance } from 'eth-components/ant';
const { Text, Link } = Typography;

export interface IMintPageProps {
  tx: TTransactorFunc | undefined;
  nftContract: PosNFT | undefined;
  oracleContract: PosBlockIncentivizedOracle | undefined;
  ethersAppContext: IEthersContext;
  scaffoldAppProviders: IScaffoldAppProviders;
}

/**
 * Home / Mint page
 * @returns
 */
export const MintPage: FC<IMintPageProps> = ({
  tx,
  nftContract,
  oracleContract,
  ethersAppContext,
  scaffoldAppProviders,
}) => {
  const [selectedBlock, setSelectedBlock] = useState(0);
  const [currentMainnetBlock, setCurrentMainnetBlock] = useState(0);

  const [totalCount] = useContractReader(nftContract, nftContract?.totalSupply);
  const [firstPosBlock] = useContractReader(oracleContract, oracleContract?.getFirstRegisteredPosBlock);
  const [winner] = useContractReader(nftContract, nftContract?.ownerOf, [firstPosBlock ?? 0]);

  const [mintEvents] = useEventListener(nftContract, 'Transfer', 0);

  const [address] = useSignerAddress(ethersAppContext.signer);

  useBlockNumber(scaffoldAppProviders.mainnetAdaptor?.provider, (blockNumber) =>
    setCurrentMainnetBlock(blockNumber ?? 0)
  );

  const mintSection = (
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
                  nftContract?.mint(address, selectedBlock, {
                    value: ethers.utils.parseEther('0.01'),
                  })
                );
                await txCur?.wait();
              } catch (e) {
                console.log('mint failed', e);
              }
            }}>
            MINT for ??0.01
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
  );

  const winnerSection = (
    <Space direction="vertical">
      <Text style={{ fontSize: '20px', color: 'darkolivegreen' }}>
        <strong>Game is over! First PoS block: {firstPosBlock?.toString()}</strong>
      </Text>
      {address === winner ? (
        <Space direction="vertical">
          <Text style={{ fontSize: '20px', color: 'darkolivegreen' }}>You won!</Text>
          <Button
            type="primary"
            onClick={async () => {
              try {
                const txCur = await tx?.(nftContract?.claim());
                await txCur?.wait();
              } catch (e) {
                console.log('claim failed', e);
              }
            }}>
            Claim price
          </Button>
        </Space>
      ) : (
        <Text style={{ fontSize: '20px' }}>
          Winner is{' '}
          <Address
            address={winner}
            ensProvider={scaffoldAppProviders?.mainnetAdaptor?.provider}
            fontSize={16}
            hideCopy
          />
        </Text>
      )}
    </Space>
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

      <Space direction="vertical" size="small" style={{ border: '1px solid', padding: '20px' }}>
        <Text style={{ fontSize: '20px' }}>
          <strong>Current Mainnet Block</strong>:{' '}
          <span style={{ cursor: 'pointer' }} onClick={(): void => setSelectedBlock(currentMainnetBlock)}>
            {!!currentMainnetBlock ? currentMainnetBlock : '-'}
          </span>
        </Text>

        <Text style={{ fontSize: '20px' }}>
          <strong>Total minted</strong>: {totalCount ? totalCount.toString() : '-'}{' '}
        </Text>

        <Text style={{ fontSize: '20px' }}>
          <strong>Pot</strong>: ??
          <Balance address={nftContract?.address} fontSize={18} padding=".25rem 0 .25rem .5rem" />
        </Text>
      </Space>

      {winner ? winnerSection : mintSection}

      <div style={{ margin: '25px 0 50px 0' }}>
        <Space direction="vertical">
          <Typography.Title level={3} style={{ margin: 0 }}>
            Last 25 minted
          </Typography.Title>
          <LastMintedTable
            events={mintEvents}
            scaffoldAppProviders={scaffoldAppProviders}
            currentMainnetBlock={currentMainnetBlock}
          />
        </Space>
      </div>
    </Space>
  );
};

export default MintPage;
