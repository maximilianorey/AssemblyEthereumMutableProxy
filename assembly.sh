node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/AssemblySimpleProxy test/AssemblySimpleProxyTests.sol.template test/AssemblySimpleProxyTests.sol
node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/SecureProxyManager test/SecureProxyManagerTests.sol.template test/SecureProxyManagerTests.sol

node ./assembler/dist/assembler.js --FROM_JSON assembly/AssemblySimpleProxy src/out/AssemblySimpleProxy.sol/AssemblySimpleProxy.json src/out/AssemblySimpleProxy.sol/AssemblySimpleProxy.json
node ./assembler/dist/assembler.js --FROM_JSON assembly/SecureProxyManager src/out/SecureProxyManager.sol/SecureProxyManager.json src/out/SecureProxyManager.sol/SecureProxyManager.json

node ./generateContractsTypescriptFiles.cjs