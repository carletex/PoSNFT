import '~~/styles/main-page.css';
import { GenericContract } from 'eth-components/ant/generic-contract';
import { useEthersAdaptorFromProviderOrSigners, useGasPrice } from 'eth-hooks';
import { useEthersAppContext } from 'eth-hooks/context';
import { useDexEthPrice } from 'eth-hooks/dapps';
import { asEthersAdaptor } from 'eth-hooks/functions';
import React, { FC, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Switch } from 'react-router-dom';

import { MainPageFooter, MainPageHeader, createPagesAndTabs, TContractPageList } from './components/main';

import { useAppContracts, useConnectAppContracts, useLoadAppContracts } from '~~/components/contractContext';
import { useCreateAntNotificationHolder } from '~~/components/main/hooks/useAntNotification';
import { useBurnerFallback } from '~~/components/main/hooks/useBurnerFallback';
import { useScaffoldProviders as useScaffoldAppProviders } from '~~/components/main/hooks/useScaffoldAppProviders';
import { BURNER_FALLBACK_ENABLED, MAINNET_PROVIDER } from '~~/config/app.config';
import { MintPage, MyBlocksPage } from '~~/components/pages';
import { transactor } from 'eth-components/functions';
import { EthComponentsSettingsContext } from 'eth-components/models';
import { getNetworkInfo } from '~~/functions';

/**
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 * See config/app.config.ts for configuration, such as TARGET_NETWORK
 * See appContracts.config.ts and externalContracts.config.ts to configure your contracts
 * See pageList variable below to configure your pages
 * See web3Modal.config.ts to configure the web3 modal
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 *
 * For more
 */

/**
 * The main component
 * @returns
 */
export const MainPage: FC = () => {
  const notificationHolder = useCreateAntNotificationHolder();
  // -----------------------------
  // Providers, signers & wallets
  // -----------------------------
  // 🛰 providers
  // see useLoadProviders.ts for everything to do with loading the right providers
  const scaffoldAppProviders = useScaffoldAppProviders();

  // 🦊 Get your web3 ethers context from current providers
  const ethersAppContext = useEthersAppContext();

  // if no user is found use a burner wallet on localhost as fallback if enabled
  useBurnerFallback(scaffoldAppProviders, BURNER_FALLBACK_ENABLED);

  // -----------------------------
  // Load Contracts
  // -----------------------------
  // 🛻 load contracts
  useLoadAppContracts();
  // 🏭 connect to contracts for mainnet network & signer
  const [mainnetAdaptor] = useEthersAdaptorFromProviderOrSigners(MAINNET_PROVIDER);
  useConnectAppContracts(mainnetAdaptor);
  // 🏭 connec to  contracts for current network & signer
  useConnectAppContracts(asEthersAdaptor(ethersAppContext));

  // -----------------------------
  // These are the contracts!
  // -----------------------------

  // init contracts
  const posBlockOracle = useAppContracts('PosBlockIncentivizedOracle', ethersAppContext.chainId);
  const posNFT = useAppContracts('PosNFT', ethersAppContext.chainId);

  const ethComponentsSettings = useContext(EthComponentsSettingsContext);
  const [gasPrice] = useGasPrice(ethersAppContext.chainId, 'fast', getNetworkInfo(ethersAppContext.chainId));
  const tx = transactor(ethComponentsSettings, ethersAppContext?.signer, gasPrice);

  // 📟 Listen for broadcast events
  // const [setPurposeEvents] = useEventListener(yourContract, 'SetPurpose', 0);

  // 💵 This hook will get the price of ETH from 🦄 Uniswap:
  const [ethPrice] = useDexEthPrice(scaffoldAppProviders.mainnetAdaptor?.provider, scaffoldAppProviders.targetNetwork);

  const [route, setRoute] = useState<string>('');
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  // -----------------------------
  // 📃 Page List
  // -----------------------------
  // This is the list of tabs and their contents
  const pageList: TContractPageList = {
    mainPage: {
      name: 'Mint',
      content: (
        <MintPage
          tx={tx}
          nftContract={posNFT}
          oracleContract={posBlockOracle}
          ethersAppContext={ethersAppContext}
          scaffoldAppProviders={scaffoldAppProviders}
        />
      ),
    },
    pages: [
      {
        name: 'My Blocks',
        content: (
          <MyBlocksPage nftContract={posNFT} oracleContract={posBlockOracle} ethersAppContext={ethersAppContext} />
        ),
      },
      {
        name: 'Debug',
        content: (
          <>
            <GenericContract
              contractName="PosBlockOracle"
              contract={posBlockOracle}
              mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
              blockExplorer={scaffoldAppProviders.targetNetwork.blockExplorer}
            />
            <GenericContract
              contractName="PosNFT"
              contract={posNFT}
              mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
              blockExplorer={scaffoldAppProviders.targetNetwork.blockExplorer}
            />
          </>
        ),
      },
    ],
  };
  const { tabContents, tabMenu } = createPagesAndTabs(pageList, route, setRoute);

  return (
    <div className="App">
      <MainPageHeader scaffoldAppProviders={scaffoldAppProviders} price={ethPrice} />
      {/* Routes should be added between the <Switch> </Switch> as seen below */}
      <BrowserRouter>
        {tabMenu}
        <Switch>
          {tabContents}
          {/* Subgraph also disabled in MainPageMenu, it does not work, see github issue https://github.com/scaffold-eth/scaffold-eth-typescript/issues/48! */}
          {/*
          <Route path="/subgraph">
            <Subgraph subgraphUri={subgraphUri} mainnetProvider={scaffoldAppProviders.mainnetAdaptor?.provider} />
          </Route>
          */}
        </Switch>
      </BrowserRouter>

      <MainPageFooter scaffoldAppProviders={scaffoldAppProviders} price={ethPrice} />
      <div style={{ position: 'absolute' }}>{notificationHolder}</div>
    </div>
  );
};
