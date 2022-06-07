import { Table } from 'antd';
import { TypedEvent } from 'eth-hooks/models';
import React, { FC, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface ILastMintedTableProps {
  events: TypedEvent<ethers.utils.Result>[];
}

/**
 * Block Selector
 * @returns
 */
export const LastMintedTable: FC<ILastMintedTableProps> = ({ events }) => {
  const [dataSource, setDataSource] = useState<{ owner: string; tokenId: number }[]>([]);

  const columns = [
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
    },
    {
      title: 'Block Number (token ID)',
      dataIndex: 'tokenId',
      key: 'tokenId',
    },
  ];

  useEffect(() => {
    const processedEvents = events.map((event) => {
      return {
        owner: event.args[1],
        tokenId: event.args[2].toString(),
      };
    });

    setDataSource(processedEvents);
  }, [events]);

  return <Table dataSource={dataSource} columns={columns} />;
};

export default LastMintedTable;
