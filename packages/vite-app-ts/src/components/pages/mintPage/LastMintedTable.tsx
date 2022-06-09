import { Table } from 'antd';
import { Address } from 'eth-components/ant';
import { TypedEvent } from 'eth-hooks/models';
import { ethers } from 'ethers';
import moment from 'moment';
import React, { FC, useState, useEffect } from 'react';

import { IScaffoldAppProviders } from '~~/components/main/hooks/useScaffoldAppProviders';

export interface ILastMintedTableProps {
  events: TypedEvent<ethers.utils.Result>[];
  scaffoldAppProviders: IScaffoldAppProviders;
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
export const LastMintedTable: FC<ILastMintedTableProps> = ({ events, scaffoldAppProviders }) => {
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
  ];

  useEffect(() => {
    const processEvents = async (): Promise<void> => {
      console.log();
      const processedEvents = await Promise.all(
        events
          .reverse()
          .slice(0, 25)
          .map(async (event) => {
            const timestamp = (await event.getBlock()).timestamp;
            return {
              owner: (
                <Address
                  address={event.args[1]}
                  ensProvider={scaffoldAppProviders?.mainnetAdaptor?.provider}
                  fontSize={16}
                  hideCopy
                />
              ),
              tokenId: event.args[2].toString(),
              timestamp: moment(timestamp, 'X').fromNow(),
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
