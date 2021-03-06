import { lazier } from 'eth-hooks/helpers';

// the components and pages are lazy loaded for performance and bundle size reasons
// code is in the component file

export const Subgraph = lazier(() => import('./subgraph/Subgraph'), 'Subgraph');
export const MintPage = lazier(() => import('./mintPage/MintPage'), 'MintPage');
export const MyBlocksPage = lazier(() => import('./mintPage/MyBlocksPage'), 'MyBlocksPage');
export const LastMintedTable = lazier(() => import('./mintPage/LastMintedTable'), 'LastMintedTable');
