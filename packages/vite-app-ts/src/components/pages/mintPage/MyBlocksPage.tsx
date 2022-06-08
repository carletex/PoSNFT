import { Card, List, Space, Typography } from 'antd';
import { useContractReader, useSignerAddress } from 'eth-hooks';
import { IEthersContext } from 'eth-hooks/models';
import { BigNumber, BigNumberish } from 'ethers';
import React, { FC, useState, useEffect, ReactElement } from 'react';

import { PosNFT } from '~~/generated/contract-types';

export interface IMintPageProps {
  contract: PosNFT | undefined;
  ethersAppContext: IEthersContext;
}

interface IMyNft {
  description: string;
  id: BigNumber;
  image: string;
  name: string;
  owner: string;
  uri: string;
}

/**
 * Show your POS Block Number NFTS
 * @returns
 */
export const MyBlocksPage: FC<IMintPageProps> = ({ contract, ethersAppContext }) => {
  const [yourNfts, setYourNfts] = useState<IMyNft[]>([]);

  const [address] = useSignerAddress(ethersAppContext.signer);
  const [balance, _, balanceStatus] = useContractReader(contract, contract?.balanceOf, [address ?? '']);

  useEffect(() => {
    const updateYourCollectibles = async (): Promise<void> => {
      if (!contract) return;

      const yourNftInfo = [];
      for (let tokenIndex = 0; balance?.gt(tokenIndex); tokenIndex++) {
        try {
          console.log('Getting token index', tokenIndex);
          const tokenId: BigNumberish = await contract.tokenOfOwnerByIndex(address ?? '', tokenIndex);
          const tokenURI = await contract.tokenURI(tokenId);
          // Decode the Base64 response (removing the 29 chars of "data:application/json;base64,")
          const jsonManifestString = tokenURI ? atob(tokenURI.substring(29)) : '{}';
          console.log('jsonManifestString: ', jsonManifestString);

          try {
            const jsonManifest = JSON.parse(jsonManifestString);
            yourNftInfo.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourNfts(yourNftInfo.reverse());
    };

    if (balanceStatus === 'success' && address) {
      void updateYourCollectibles();
    }
  }, [address, balance]);

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex', margin: '20px auto', maxWidth: '800px' }}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        <>Your NFTs ({balance?.toString()})</>
      </Typography.Title>
      <div style={{ width: 600, margin: 'auto', paddingBottom: 25 }}>
        <List
          dataSource={yourNfts}
          grid={{ gutter: 16, column: 4 }}
          renderItem={(item: IMyNft): ReactElement => {
            const id = item.id.toNumber();

            return (
              <List.Item key={`${id}_${item.uri}_${item.owner}`}>
                <Card>
                  <img src={item.image} alt={`Block Number #${id}`} />
                </Card>
              </List.Item>
            );
          }}
        />
      </div>
    </Space>
  );
};

export default MyBlocksPage;
