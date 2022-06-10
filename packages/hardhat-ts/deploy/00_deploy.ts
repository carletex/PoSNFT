import { DeployFunction } from 'hardhat-deploy/types';
import { THardhatRuntimeEnvironmentExtended } from 'helpers/types/THardhatRuntimeEnvironmentExtended';

const func: DeployFunction = async (hre: THardhatRuntimeEnvironmentExtended) => {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const oracleContract = await deploy('PosBlockIncentivizedOracle', {
    from: deployer,
    log: true,
  });

  await deploy('PosNFT', {
    from: deployer,
    args: [oracleContract.address],
    log: true,
  });
};

export default func;
func.tags = ['PosBlockIncentivizedOracle', 'PosNFT'];
