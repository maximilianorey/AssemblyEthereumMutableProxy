node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/assemblyCodeAlpha test/ProxyAlphaTest.sol.template test/ProxyAlphaTest.sol
node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/assemblyCodeBeta test/ProxyBetaTest.sol.template test/ProxyBetaTest.sol
node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/proxyManagerDelta test/ProxyDeltaTest.sol.template test/ProxyDeltaTest.sol
node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/proxyManagerEpsilon test/ProxyEpsilonTest.sol.template test/ProxyEpsilonTest.sol

#node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/assemblyCodeAlpha templates/AssemblyProxyAlpha__factory_template.ts src/ProxyFactories/AssemblyProxyAlpha__factory.ts
#node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/assemblyCodeBeta templates/AssemblyProxyBeta__factory_template.ts src/ProxyFactories/AssemblyProxyBeta__factory.ts 
#node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/proxyManagerDelta templates/ProxyManagerDelta__factory_template.ts src/ProxyFactories/ProxyManagerDelta__factory.ts
#node ./assembler/dist/assembler.js --FROM_TEMPLATE assembly/proxyManagerEpsilon templates/ProxyManagerEpsilon__factory_template.ts src/ProxyFactories/ProxyManagerEpsilon__factory.ts

node ./assembler/dist/assembler.js --FROM_JSON assembly/assemblyCodeAlpha src/out/AssemblyProxyAlpha.sol/AssemblyProxyAlpha.json src/out/AssemblyProxyAlpha.sol/AssemblyProxyAlpha.json
node ./assembler/dist/assembler.js --FROM_JSON assembly/assemblyCodeBeta src/out/AssemblyProxyBeta.sol/AssemblyProxyBeta.json src/out/AssemblyProxyBeta.sol/AssemblyProxyBeta.json
node ./assembler/dist/assembler.js --FROM_JSON assembly/proxyManagerDelta src/out/ProxyManagerDelta.sol/ProxyManagerDelta.json src/out/ProxyManagerDelta.sol/ProxyManagerDelta.json
node ./assembler/dist/assembler.js --FROM_JSON assembly/proxyManagerEpsilon src/out/ProxyManagerEpsilon.sol/ProxyManagerEpsilon.json src/out/ProxyManagerEpsilon.sol/ProxyManagerEpsilon.json

node ./generateContractsTypescriptFiles.cjs