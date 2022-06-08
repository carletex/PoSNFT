import { Table } from 'antd';
import { TypedEvent } from 'eth-hooks/models';
import { ethers } from 'ethers';
import moment from 'moment';
import React, { FC, useState, useEffect } from 'react';

export interface ILastMintedTableProps {
  events: TypedEvent<ethers.utils.Result>[];
}

interface IProcessedEvent {
  owner: string;
  tokenId: string;
  timestamp: string;
}

/**
 * Block Selector
 * @returns
 */
export const LastMintedTable: FC<ILastMintedTableProps> = ({ events }) => {
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
      title: 'Minted on',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
  ];

  useEffect(() => {
    const processEvents = async (): Promise<void> => {
      console.log();
      const processedEvents = await Promise.all(
        events.map(async (event) => {
          const timestamp = (await event.getBlock()).timestamp;
          return {
            owner: event.args[1],
            tokenId: event.args[2].toString(),
            timestamp: moment(timestamp, 'X').fromNow(),
          };
        })
      );

      setDataSource(processedEvents.reverse().slice(0, 25));
    };

    void processEvents();
  }, [events]);

  return <Table dataSource={dataSource} columns={columns} pagination={false} />;
};

export default LastMintedTable;
