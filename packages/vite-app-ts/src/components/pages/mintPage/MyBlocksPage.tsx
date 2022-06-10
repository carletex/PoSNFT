import { Card, List, Space, Typography } from 'antd';
import { useContractReader, useSignerAddress } from 'eth-hooks';
import { IEthersContext } from 'eth-hooks/models';
import { BigNumber, BigNumberish } from 'ethers';
import React, { FC, useState, useEffect, ReactElement } from 'react';

const { Text } = Typography;

import { PosBlockIncentivizedOracle, PosNFT } from '~~/generated/contract-types';

export interface IMintPageProps {
  nftContract: PosNFT | undefined;
  oracleContract: PosBlockIncentivizedOracle | undefined;
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
export const MyBlocksPage: FC<IMintPageProps> = ({ nftContract, oracleContract, ethersAppContext }) => {
  const [yourNfts, setYourNfts] = useState<IMyNft[]>([]);

  const [address] = useSignerAddress(ethersAppContext.signer);
  const [balance, _, balanceStatus] = useContractReader(nftContract, nftContract?.balanceOf, [address ?? '']);

  const [firstPosBlock] = useContractReader(oracleContract, oracleContract?.getFirstRegisteredPosBlock);

  useEffect(() => {
    const updateYourCollectibles = async (): Promise<void> => {
      if (!nftContract) return;

      const yourNftInfo = [];
      for (let tokenIndex = 0; balance?.gt(tokenIndex); tokenIndex++) {
        try {
          console.log('Getting token index', tokenIndex);
          const tokenId: BigNumberish = await nftContract.tokenOfOwnerByIndex(address ?? '', tokenIndex);
          const tokenURI = await nftContract.tokenURI(tokenId);
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
      <div style={{ width: 750, margin: 'auto', paddingBottom: 25 }}>
        <List
          dataSource={yourNfts}
          grid={{ gutter: 16, column: 2 }}
          renderItem={(item: IMyNft): ReactElement => {
            const id = item.id.toNumber();

            return (
              <List.Item key={`${id}_${item.uri}_${item.owner}`}>
                <Card>
                  <p>{firstPosBlock?.toNumber() === id && '🏆 Winner block 🏆'}</p>
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
