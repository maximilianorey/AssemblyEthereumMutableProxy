# Introduction
The idea of this project is to find a more optimized mutable proxy.

On solidity a mutable proxy is used when you need to deploy a contract which code can be changed in the future. Since on blockchain contracts are immutable, the solution for this is use the instruction “DELEGATE CALL”,  which execute the code of another contract using its local context; with this you can deploy a contract with the actual code, we will call it implementation contract, and a “proxy” that use “DELEGATE CALL” to the implementation contract. The proxy has a command that can only be called by a specific address (which can be another contract or not) to change the “implementation contract” used.

Considering solidity’s compiler is very recent, it’s logical that it wouldn’t generate the most optime assembly output, in fact, it inserts a lot of swap and pop that can be avoided. The problem is, on a smart contract a less optime code is more expensive to execute, so in this case optimization is a priority. In this project, the proxy was constructed directly on Ethereum’s assembly.

There are three proxies: the "alpha" version has a security bonus that OpenZeppeling's one doesn't have but at the end is more expensive. The "beta" version hasn't this security bonus but it's actually cheaper than OpenZeppeling's one. The "delta" version consumes almost the same gas as OpenZeppeling's one but it has the extra security and requires an extra contract deployed at least one time on the blockchain.

# Assembly Proxy Alpha
This version has extra security, but its execution is more expensive than OpenZeppeling's proxy. One problem with the proxy is the implementation can change the registers where the admin or the implementation address is stored. Of course, the admin had to put a contract with this implementation before, but is a way to introduce a back door. This proxy version checks the registers after the delegate call and ensures they have the same values. If not, it revert the transaction.


# Assembly Proxy Beta
This version hasn't the increment on security, but its execution is cheaper than OpenZeppeling's proxy. For optimization purposes, this code didn't respect the OpenZeppeling's proxy's interface, but has two functions: "implementation" which returns the implementation address, and "adminFunctionsPut" which receive one enum parameter and one address parameter and set admin's or implementation's direction (depends of what it have received as first parameter) to the address given as second parameter. Of course these functions can only be called by the actual admin.

In this case when a proxy receives a call it will first check if the function's id matches with "implementation" or "adminFunctionsPut", and if not it will proceed to delegate the call to the implementation, so it doesn't have to use a SLOAD to get the admin address. If the function's id actually matches, it will proceed to get the admin address and if it match with the sender, it will execute the function and if not it will delegate the call.

# Assembly Proxy Delta
This version is a midpoint between the other two. Its execution consumes almost the same gas as OpenZeppeling's one but it has the extra security. However, it has one problem, it required a third contract deployed (I call it ProxyManager), but it's not one contract per proxy, once an instance of the "ProxyManager" is on a blockchain, anyone can deploy a AssemblyProxyDelta, with the admin and implementation that they choose.

What's the trick? Admin's address isn't stored on the proxy but on the ProxyManager contract. ProxyManager is basically a map which can return the corresponding admin for an address. A contract's admin's address only can be changed by the actual admin of this contract using the methods "changeAdmin(address contractAddress, address newAdmin)" (it will revert if the sender is not the admin of "contractAddress"). To deploy a proxy, you need to execute the "deployProxy" function on the ProxyManager. This solution also resolve one problem respect the previews ones: if you need a contract that deploy a proxy, there is not an easy way to do that with the previews versions, because solidity doesn't allow you to include compiled code, but in this case you don't need to, you need only to import the interface and call to deployProxy function.

Like the alpha's version, it will check if the implementation address matches after a DELEGATECALL. This requires only an extra SLOAD.

Its interface has two functions:
- "adminFunctionsGet" that, similar to beta's interface, which receive one enum parameter and returns the implementation address or AdminsStorage's contract
- "upgradeTo" that changes the implementation address if the caller is the admin. Inside the method, the proxy calls the AdminsStorage contract to recover its admin's address. It's more expensive, but it's not part of the proxy's normal flow, so any user that calls a not admin function don't have to worry about that.

# Assembly Proxy Epsilon
A variant of delta one, this version also needs a ProxyManager but in this case it doesn't have its own interface. If the admin needs to change the implementation address, it will need to call an "upgradeTo" function on the ProxyManager, and ProxyManager will make a call to the proxy after checking if the caller is actually the owner of this proxy. In this case, the proxy algorithm checks if the caller is the ProxyManager or not.
This is a little cheaper than the delta version while it is delegating, but more expensive when "upgradeTo" is called. It also solves a problem: in this case the proxy is totally transparent for users, but anyone can consult the actual owner or implementation for a proxy by calling the ProxyManager.

# Ethereum function scheme
I am writing this section because there are elements from the smart contract's flow that are invisible when we compile a code from solidity.

- When the contract is deployed, it expect to receive a "constructor" which returns the actual code of the new smart contract. Also, if a SSTORE is executed during the execution of constructor the action will persist on the new contract and it's allowed to make a call to another contract.

- When you call a function of another contract in solidity, compiler will put a function id at the beginning of input's buffer. This id is calculated using the first four bytes from the Keccak-256 hash of function name and its parameter types between parenthesis separated by coma. For example, if the another contract has the funcion "function anExample(address addr, bigint val) public" its id will be the first four bytes of Keccak-256("anExample(address,bigint)"): 0x6373fc9f

Any "enum" type is considered as an "uint8"

- All jump instruction's destination should be a "JUMPDEST" instruction. jump instructions always have an absolute direction, not relative. The conditional jump "JUMPI" takes two parameters from the queue: the last element from the queue is the direction to jump and the one before is the "condition". If the condition is zero the system won't jump and the next instruction will be executed, otherwise, if condition is different to zero, it will jump to the received direction.

- When you execute a call or a delegate call to another contract, on the stack will appear a 1 value if the execution was successful or a 0 otherwise. But of course, this execution may return some data. There are two ways to recover this data, the first is using two of the stack parameters from this instructions: "RETLENGTH" and "RETOFFSET", the first one if the reserved length from the response and, if the first is not zero, the second one is the memory offset from where the response will be written; this is useful if you know the length of the answer before the execution, but if not you can reserve a smaller memory segment and lose a segment of the response, or reserve a bigger segment and waste gas. In this case it is better to set RETLENGTH on zero and use the second method: the instructions "RETURNDATASIZE" and "RETURNDATACOPY". The first one put on the stack the actual size of the returned data from the last call or delegate call execution and RETURNDATACOPY copied this data to memory (it received three parameters: the offset on memory, the offset on the returned data and the size to copy).

- When we return errors with "revert", we will need to follow a specific pattern if the idea is that the function can be called on by solidity smart contract (and it's the case).
1. First the message should start with 0x08c379a0
2. Second we should a 32 byte value that is the length of the next parameter
3. Third we have the length of the actual error ASCII-encoded message.
4. The actual error ASCII-encoded text.

Also, latest hardhat version only allow that second parameter was 32 (and third parameter a 32-byte-length value).

# Compilation
First, to compile the assembler, open a terminal on assembler folder ans:
1. Execute "npm i"
2. Execute "npm run build"

Then open a terminal on project's root and:
1. Execute "npm i".
2. Execute "npm run compile"
3. Execute "npm run assembly"
4. Execute "npm run build"


# Configuration
Next step is copy the .env.example file as .env and define a mnemonic. If you want to generate a new one, you can execute npm run generate-mnemonic.

# Test
There are two types of test, one that checks the correct functionality of the proxy and other that checks the gas usage.

For the first, you can execute "npm run test".

For the second case, you can test it locally with "npm run test-gas-usage-local" or on testnets "npm run test-gas-usage-testnet".


For the second file, you must create a file called "testnets.json" with a list of objects with two attributes: "name" (an id for the logs) and "nodeUrl" (the rpc url).
