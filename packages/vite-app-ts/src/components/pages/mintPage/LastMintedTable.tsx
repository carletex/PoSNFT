import { Table } from 'antd';
import { Address } from 'eth-components/ant';
import { TypedEvent } from 'eth-hooks/models';
import { ethers } from 'ethers';
import moment from 'moment';
import React, { FC, useState, useEffect } from 'react';

import { IScaffoldAppProviders } from '~~/components/main/hooks/useScaffoldAppProviders';
import { getEstimatedTimestampForBlock } from '~~/functions/getEstimatedTimestampForBlock';

export interface ILastMintedTableProps {
  events: TypedEvent<ethers.utils.Result>[];
  scaffoldAppProviders: IScaffoldAppProviders;
  currentMainnetBlock: number;
}

interface IProcessedEvent {
  owner: JSX.Element;
  tokenId: string;
  timestamp: string;
}

/**
 * Block Selector
 * @returns
 */
export const LastMintedTable: FC<ILastMintedTableProps> = ({ events, scaffoldAppProviders, currentMainnetBlock }) => {
  const [dataSource, setDataSource] = useState<IProcessedEvent[]>([]);

  const columns = [
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
    },
    {
      title: 'Block Number (tokenID)',
      dataIndex: 'tokenId',
      key: 'tokenId',
    },
    {
      title: 'Minted',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: 'Estimated on',
      dataIndex: 'estimation',
      key: 'estimation',
    },
  ];

  useEffect(() => {
    const processEvents = async (): Promise<void> => {
      console.log();
      const processedEvents = await Promise.all(
        events
          .reverse()
          .slice(0, 25)
          .map(async (event) => {
            const timestamp = (await event.getBlock()).timestamp * 1000; // to ms
            const tokenId = event.args[2].toString();
            const estimation = getEstimatedTimestampForBlock(currentMainnetBlock, Number(tokenId));
            return {
              owner: (
                <Address
                  address={event.args[1]}
                  ensProvider={scaffoldAppProviders?.mainnetAdaptor?.provider}
                  fontSize={16}
                  hideCopy
                />
              ),
              tokenId,
              timestamp: moment(timestamp).fromNow(),
              estimation: estimation > 0 ? moment(estimation).format('MMMM Do YYYY') : '-',
            };
          })
      );

      setDataSource(processedEvents);
    };

    void processEvents();
  }, [events]);

  return <Table dataSource={dataSource} columns={columns} pagination={false} />;
};

export default LastMintedTable;
