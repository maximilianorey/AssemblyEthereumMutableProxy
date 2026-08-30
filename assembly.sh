node ./dist/assembler/assembler.js --FROM_TEMPLATE assembly/assemblyCodeAlpha test/ProxyAlphaTest.sol.template test/ProxyAlphaTest.sol
node ./dist/assembler/assembler.js --FROM_TEMPLATE assembly/assemblyCodeBeta test/ProxyBetaTest.sol.template test/ProxyBetaTest.sol
node ./dist/assembler/assembler.js --FROM_TEMPLATE assembly/proxyManagerDelta test/ProxyDeltaTest.sol.template test/ProxyDeltaTest.sol
node ./dist/assembler/assembler.js --FROM_TEMPLATE assembly/proxyManagerEpsilon test/ProxyEpsilonTest.sol.template test/ProxyEpsilonTest.sol

node ./dist/assembler/assembler.js --FROM_TEMPLATE assembly/assemblyCodeAlpha templates/AssemblyProxyAlpha__factory_template.ts src/ProxyFactories/AssemblyProxyAlpha__factory.ts
node ./dist/assembler/assembler.js --FROM_TEMPLATE assembly/assemblyCodeBeta templates/AssemblyProxyBeta__factory_template.ts src/ProxyFactories/AssemblyProxyBeta__factory.ts 
node ./dist/assembler/assembler.js --FROM_TEMPLATE assembly/proxyManagerDelta templates/ProxyManagerDelta__factory_template.ts src/ProxyFactories/ProxyManagerDelta__factory.ts
node ./dist/assembler/assembler.js --FROM_TEMPLATE assembly/proxyManagerEpsilon templates/ProxyManagerEpsilon__factory_template.ts src/ProxyFactories/ProxyManagerEpsilon__factory.ts
