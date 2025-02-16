# Introduction
The idea of this proyect is to find a more optimezed mutable proxy.

On solidity a mutable proxy is used when you need to deploy a contract witch code can be changed on the future. Since on blockchain contracts are immutable, the solution for this is use the instruction “DELEGATE CALL”,  which execute the code of another contract using its local context; with this you can deploy a contract with the actual code, we will call it implementation contract, and a “proxy” that use “DELEGATE CALL” to the implementation contract. The proxy has a command that can be only be called by an specific address (which can be another contract or not) to change the “implementation contract” used.

Considering solidity’s compiler is very recent, it’s logical that it wouldn’t generate the most optime assembly output, in fact, it insert a lot of swap and pop that can be avoided. The problem is, on a smart contract a less optime code is more expensive to execute, so in this cases optimization is a priority. In this project, the proxy was constructed directly on Ethereum’s assembly.

There are three proxies: the "alpha" version has a security bonus that OpenZeppeling's one hasn't but at the end is more expensive. The "beta" version hasn't this security bonus but its actually cheaper than OpenZeppeling's one. The "delta" version consumes almost the same gas as OpenZeppeling's one but it has the extra security and require an extra contract deployed at least one time on the blockchain.

# Assembly Proxy Alpha
This version has extra security, but its execution is more expensive than OpenZeppeling's proxy. One problem with the proxy is the implementation can change the registers where the admin or the implementation address is stored. Of course, the admin had to put a contract with this implementation before, but is a way to introduce a back door. This proxy version checks the registers after the delegate call and ensures they have the same values. If not, it revert the transaction.


# Assembly Proxy Beta
This version hasn't the increment on security, but its execution is chaper than OpenZeppeling's proxy. For optimization purpouses, this code didn't respect the OpenZeppeling's proxy's interface, but has two functions: "implementation" witch returns the implementation address, and "adminFunctionsPut" witch receive one enum parameter and one address parameter and set admin's or implementation's direction (depends of what it have received as first parameter) to the address given as second parameter. Of course this functions can only be called by the actual admin.

On this case when a proxy received a call will first check if the function's id matches with "implementation" or "adminFunctionsPut", and if not it will proceed to delegate the call to the implementation, so it doesn't have to use a SLOAD to get the admin address. If the function's id actually matches, it will proceed to get the admin address and if it match with the sender, it will execute the function and if not it will delegate the call.

# Assembly Proxy Delta
This version is a midpoint between the other two. It's execution consumes almost the same gas as OpenZeppeling's one but it has the extra security. However, it has one problem, it required a third contract deployed (I call it ProxyManager), but it's not one contract per proxy, once an instance of the "ProxyManager" is on a blockchain, anyone can deploy a AssemblyProxyDelta, with the admin and implementation that they choose.

What's the trick? Admin's address isn't storaged on the proxy but on the ProxyManager contract. ProxyManager is basically a map which can return the corresponding admin for an adress. A contract's admin's address only can be changed by the actual admin of this contract using the methods "changeAdmin(address contractAddress, address newAdmin)" (it will revert if the sender is not the admin of "contractAddress"). To deploy a proxy, you need to execute "deployProxy" function on the ProxyManager. This solution also resolve one problem respect the previews ones: if you need a contract that deploy a proxy, there is not an easy way to do that with the previews versions, because solidity doesn't allow you to include compiled code, but in this case you don't need to, you need only to import the interface and call to deployProxy function.

Like the alpha's version, it will check if the implementation address matches after a DELEGATECALL. This require only an extra SLOAD.

Its interface has two functions:
- "adminFunctionsGet" that, similar to beta's interface, witch receive one enum parameter and returns the implementation address or AdminsStorage's contract
- "upgradeTo" that changes the implementation address if the caller is the admin. Inside the method, the proxy calls to AdminsStorage contract to recover its admin's address. It's more expensive, but its not part of the proxy's normal flow, so any user that call a not admin function don't have to worry about that.

# Assembly Proxy Epsilon
A variant of delta one, this version also need a ProxyManager but in this case it hasn't an own interface. If the admin need to change the implementation address, it will need to call an "upgradeTo" function on the ProxyManager, and ProxyManager will make a call to the proxy after check the caller is actually the owner of this proxy. In this case, proxy algorithm check if the caller is the ProxyManager or not.
This is a little cheapper than delta version while is delegating, but more expensive when "upgradeTo" is called. It also solves a problem: in this case the proxy is totally transparent for users, but anyone can consult the actual owner or implementation for a proxy by calling the ProxyManager.

# Ethereum function scheme
I am writting this section because there are elements from the smart contract's flow that are invisible when we compiling a code from solidity.

- When the contract is deployed, it expect to receive a "constructor" which returns the actual code of the new smart contract. Also, if a SSTORE is executed during the execution of contructor the action will persist on the new contract and it's allowed to make a call to another contract.

- When you call a function of another contract in solidity, compiler will put a function id at the beginning of input's buffer. This id is calculated using the first four bytes from the Keccak-256 hash of function name and its parameter types between parenthesis separated by coma. For example, if the another contract has the funcion "function anExample(address addr, bigint val) public" its id will be the first four bytes of Keccak-256("anExample(address,bigint)"): 0x6373fc9f

Any "enum" type is considered as an "uint8"

- All jump instruction's destination should be a "JUMPDEST" instruction. jump instructions always have a absolute direction, not relative. The conditional jump "JUMPI" takes to parameters from the queue: the last element from the queue is the direction to jump and the one before is the "condition". If condition is zero the system won't jump and the next instruction will be executed, otherwise, if condition is different to zero, it will jump to the received direction.

- When you execute a call or a delegate call to another contract, on the stack will appear a 1 value if the execution was successful or a 0 otherwise. But of course, this execution maybe will return some data. There is two ways to recover this data, the first is using two of the stack parameters from this instructions: "RETLENGTH" and "RETOFFSET", the first one if the reserved length from the response and, if the first is not zero, the second one is the memory offset from where the response will be written; this is useful if you know the length of the answer before the execution, but if not you can reserve a smaller memory segment and lose a segment of the response, or reserve a bigger segment and waste gas. In this cases is better to set RETLENGTH on zero and use the second method: the instruction "RETURNDATASIZE" and "RETURNDATACOPY". The first one put on the stack the actual size of the returned data from the last call or delegate call execution and RETURNDATACOPY copy this data to memory (it received three parameters: the offset on memory, the offset on the returned data and the size to copy).

- When we returns errors with "revert", we will need to follow a specific patter if the idea is the function can be called on by solidity smart contract (and it's the case).
1. First the message should start with 0x08c379a0
2. Second we should a 32 byte value that is the length of the next parameter
3. Third we have the length of the actual error ASCII-encoded message.
4. The actual error ASCII-encoded text.

Also, lastest hardhat version only allow that second parameter was 32 (and third parameter a 32-byte-length value).

# Compilation
1. Execute "npm i command".
2. Execute "npm run compile"
3. Execute "npm run build"

If you want to modify on of the assembly, you should change the corresponding file on "assembly" folder and later change the typescript file with EthereumAssembly (https://github.com/maximilianorey/EthereumAssembler). 

For example, if you want to change the assembly/assemblyCodeAlpha, you should execute "java -jar path/to/assemblier/jar fromTemplate assembly/assemblyProxyAlpha templates/AssemblyProxyAlpha__factory_template.ts src/AssemblyProxyAlpha/AssemblyProxyAlpha__factory.ts" after that

Finally you will need to execute step 3 again.

# Configuration
Next step is copy the .env.example file as .env and define a mnemonic. If you want to generate a new one, you can execute npm run generate-mnemonic.

# Test
There are to types of test, one that check the correct functionality of proxy and other that checks the gas usage.

For the first, you can execute "npm run test".

For the second case, you can test it locally with hardhat or on testnets:
To use hardhat, you should execute npm run hardhat:node on a terminal and "npm run test-gas-usage-local" on other terminal. The gas usage will appear the second terminal.

For the testnets option, you can execute "npm run test-gas-usage-testnet". There are seven testnet configured: binance, sepolia, amoy, rsk, fantom, avax, cardona-zkevm, but you should define alchemy api keys for interact with some of them (by defining the .env parameters amoy_api_key sepolia_api_key polygon_zkevm). You can specify to execute only some of them by executing "npm run test-gas-usage-testnet -- --blockchains"  and then the list of blockchains to use separated by commas (example "npm run test-gas-usage-testnet -- --blockchains amoy,binance") or defined the parameter "blockchains" the on .env file.