import { IEthersContext } from 'eth-hooks/models';
import React, { FC, useState, useEffect } from 'react';

import { PosNFT } from '~~/generated/contract-types';
import { useContractReader, useSignerAddress } from 'eth-hooks';
import { Space } from 'antd';
import { BigNumberish, ethers } from 'ethers';
import { QueryStatus } from 'react-query/types/core/types';

export interface IMintPageProps {
  contract: PosNFT | undefined;
  ethersAppContext: IEthersContext;
}

/**
 * Show your POS Block Number NFTS
 * @returns
 */
export const MyBlocksPage: FC<IMintPageProps> = ({ contract, ethersAppContext }) => {
  const [yourCollectibles, setYourCollectibles] = useState<any>([]);

  const [address] = useSignerAddress(ethersAppContext.signer);
  const [balance, _, balanceStatus] = useContractReader(contract, contract?.balanceOf, [address ?? '']);

  useEffect(() => {
    const updateYourCollectibles = async () => {
      if (!contract) return;

      const collectibleUpdate = [];
      for (let tokenIndex = 0; balance?.gt(tokenIndex); tokenIndex++) {
        try {
          console.log('Getting token index', tokenIndex);
          const tokenId: BigNumberish = await contract.tokenOfOwnerByIndex(address ?? '', tokenIndex);
          console.log('Getting Loogie tokenId: ', tokenId);
          const tokenURI = await contract.tokenURI(tokenId);
          console.log('tokenURI: ', tokenURI);
          const jsonManifestString = tokenURI ? atob(tokenURI.substring(29)) : '{}';

          try {
            const jsonManifest = JSON.parse(jsonManifestString);
            collectibleUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourCollectibles(collectibleUpdate.reverse());
    };

    if (balanceStatus === 'success' && address) {
      void updateYourCollectibles();
    }
  }, [address, balance]);

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex', margin: '20px auto', maxWidth: '800px' }}>
      My NFTs
    </Space>
  );
};

export default MyBlocksPage;
