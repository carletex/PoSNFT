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
  const [yourNfts, setYourNfts] = useState<any>([]);

  const [address] = useSignerAddress(ethersAppContext.signer);
  const [balance, _, balanceStatus] = useContractReader(contract, contract?.balanceOf, [address ?? '']);

  useEffect(() => {
    const updateYourCollectibles = async () => {
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
      My NFTs
    </Space>
  );
};

export default MyBlocksPage;
