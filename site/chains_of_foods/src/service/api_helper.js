const { apiClient, codec, cryptography, transactions } = require( '@liskhq/lisk-client');
const schema = {
    $id: 'lisk/food/transaction',
    type: 'object',
    required: ["items", "price", "restaurantData", "restaurantNonce", "recipientAddress"],
    properties: {            
        items: {
            dataType: 'string',
            fieldNumber: 1
        },
        price:{
            dataType: 'uint64',
            fieldNumber: 2
        },
        restaurantData: {
            dataType: 'string',
            fieldNumber: 3
        },
        restaurantNonce: {
            dataType: 'string',
            fieldNumber: 4
        },
        recipientAddress: {
            dataType: "bytes",
            fieldNumber: 5
        }	  
    }
};

var menuSchema = {
    $id: 'lisk/menu/transaction',
    type: 'object',
    required: ["items"],
    properties: {
        items: {
            dataType: 'string',
            fieldNumber: 1
        },
    }
}

var newsSchema = {
    $id: 'lisk/news/transaction',
    type: 'object',
    required: ["items"],
    properties: {
        items: {
            dataType: 'string',
            fieldNumber: 1
        },
    }
}

var profileSchema = {
    $id: 'lisk/profile/transaction',
    type: 'object',
    required: ["name", "clientData", "clientNonce"],
    properties: {
        name: {
            dataType: 'string',
            fieldNumber: 1
        },            
        clientData: {
            dataType: 'string',
            fieldNumber: 2
        },
        clientNonce: {
            dataType: 'string',
            fieldNumber: 3
        },	    
        recipientAddress: {
            dataType: "bytes",
            fieldNumber: 4
        }	  
    }
};
const networkIdentifier = "68bc1b08c5ee6218d58df4909116e35a4dda0bf723f018b6c315dba9851ea4de";
const server = { host: "http://localhost:4000" };

export class ApiHelper{
             
    RPC_ENDPOINT;
    constructor (RPC_ENDPOINT){
        this.RPC_ENDPOINT = RPC_ENDPOINT;
    }

    static clientCache;
    async getClient () {
        if (!ApiHelper.clientCache) {            
            ApiHelper.clientCache = await apiClient.createWSClient(this.RPC_ENDPOINT);
        }        
        
        return ApiHelper.clientCache;
    };

    async getAccountFromAddress (address){
        const client = await this.getClient();
        const schema = await client.invoke('app:getSchema');
        const account = await client.invoke('app:getAccount', {
            address,
        });
                
        return codec.codec.decodeJSON(schema.account, Buffer.from(account, 'hex'));
    };

    async getAccountFromHexAddres(){
        const client = await this.getClient();             
                
        return await client.account.get(cryptography.getAddressFromBase32Address('lskfn3cm9jmph2cftqpzvevwxwyz864jh63yg784b'));
    }

    async getAccountNonce (address) {
        var account = await this.getAccountFromAddress(address);        
        const sequence = account.sequence;
        return Number(sequence.nonce);
    };

    async getBlockByHeight(height){
        const client = await this.getClient();
        const schema = await client.invoke('app:getSchema');
        const block = await client.invoke('app:getBlockByHeight', {height: height});
                
        return codec.codec.decodeJSON(schema.block, Buffer.from(block, 'hex'));
    }

    async getBlockById(id){
        const client = await this.getClient();
        const schema = await client.invoke('app:getSchema');
        const block = await client.invoke('app:getBlockByID', {id: id});
                
        return codec.codec.decodeJSON(schema.block, Buffer.from(block, 'hex'));
    }

    async getConnectedPeers(){
        const client = await this.getClient();        
        const nodeInfo = await client.invoke('app:getConnectedPeers', {});

        return nodeInfo;
    }    
    
    async getCustomTransactionByid(transactionId){        
        const client = await this.getClient();        
        
        return await client.transaction.get(Buffer.from(transactionId, 'hex'));
    }

    async getDisconnectedPeers(){
        const client = await this.getClient();        
        const nodeInfo = await client.invoke('app:getDisconnectedPeers', {});

        return nodeInfo;
    }

    async getTransactions(){
        const client = await this.getClient();
        return await await client.invoke('app:getRegisteredActions');
    }

    async getGenericTransactionByid(transactionId){
        const client = await this.getClient();
        const schema = await client.invoke('app:getSchema');
        const transaction = await client.invoke('app:getTransactionByID', {id: transactionId});

        return codec.codec.decodeJSON(schema.transaction, Buffer.from(transaction, 'hex'));
    }    

    async getNodeInfo(){
        const client = await this.getClient();        
        const nodeInfo = await client.invoke('app:getNodeInfo', {});

        return nodeInfo;
    }     

    async getTransactionsFromPool(){
        const client = await this.getClient();
        const schema = await client.invoke('app:getSchema');
        const transactions = await client.invoke('app:getTransactionsFromPool');
        var transactionsDecoded = [];

        transactions.forEach(transaction => {
            
            var transactionDecoded = codec.codec.decodeJSON(schema.transaction, Buffer.from(transaction, 'hex'));
            transactionsDecoded.push(transactionDecoded);
            console.log(transactionDecoded);
        })

        return transactionsDecoded;
    }    
    
    async getTransactionsSchemas(){
        const client = await this.getClient();
        const schema = await client.invoke('app:getSchema');
        const result = await schema.transactionsAssets;

        return result;
    }

    async sendTransaction(transaction){
        const client = await this.getClient();        
        const result = await client.transaction.send(transaction);

        return result;
    }

    async getMenuTransaction(){
        var url = server.host.concat("/api/node/transactions?limit=50");

        var response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response;
    }

    async createFoodAssetAndSign(orderRequest, credential, restaurant){
        /*incluir validação de tipo de pedido através de consulta à menu asset (por definir)*/
        var recipientAddress = cryptography.getAddressFromBase32Address(restaurant.address);

        const sender = cryptography.getAddressAndPublicKeyFromPassphrase(credential.passphrase);
        
        var accountNonce = await this.getAccountNonce(sender.address);        

        var orderPrice = 0;
        
        var items = orderRequest.items;
        console.log("items :", typeof []);
        
        items.forEach(item =>{            
            orderPrice += (item.price * item.quantity);
        });        

        console.log("price", orderPrice);

        var restaurantData = cryptography.encryptMessageWithPassphrase(
            orderRequest.deliveryAddress
            .concat(' ***Field*** ')
            .concat(orderRequest.phone)
            .concat(' ***Field*** ')
            .concat(orderRequest.username),
            credential.passphrase,
            restaurant.publicKey);
        
        const tx = await transactions.signTransaction(
            schema,
            {
                moduleID: 2000,
                assetID: 1040,
                nonce: BigInt(accountNonce),
                fee: BigInt(0),
                senderPublicKey: sender.publicKey,
                asset: {
                    items: JSON.stringify(orderRequest.items),
                    price: BigInt(transactions.convertLSKToBeddows(orderPrice.toString())),                    
                    restaurantData: restaurantData.encryptedMessage,
                    restaurantNonce: restaurantData.nonce,
                    recipientAddress: recipientAddress
                },
            },
            Buffer.from(networkIdentifier, "hex"),
            credential.passphrase);
    
        return tx;
    }

    async createMenuAssetAndSign(menu, credential){
        const sender = cryptography.getAddressAndPublicKeyFromPassphrase(credential.passphrase);
        
        var accountNonce = await this.getAccountNonce(sender.address);                
        
        const tx = await transactions.signTransaction(
            menuSchema,
            {
                moduleID: 2000,
                assetID: 1060,
                nonce: BigInt(accountNonce),
                fee: BigInt(0),
                senderPublicKey: sender.publicKey,
                asset: {
                    items: JSON.stringify(menu),
                    recipientAddress: sender.address
                },
            },
            Buffer.from(networkIdentifier, "hex"),
            credential.passphrase);
    
        return tx;
    }

    async createNewsAssetAndSign(news, credential){
        const sender = cryptography.getAddressAndPublicKeyFromPassphrase(credential.passphrase);
        
        var accountNonce = await this.getAccountNonce(sender.address);                
        
        const tx = await transactions.signTransaction(
            newsSchema,
            {
                moduleID: 2000,
                assetID: 1080,
                nonce: BigInt(accountNonce),
                fee: BigInt(0),
                senderPublicKey: sender.publicKey,
                asset: {
                    items: JSON.stringify(news),
                    recipientAddress: sender.address
                },
            },
            Buffer.from(networkIdentifier, "hex"),
            credential.passphrase);
    
        return tx;
    }

    async createProfileAssetAndSign(userProfile, credential){
        const sender = cryptography.getAddressAndPublicKeyFromPassphrase(credential.passphrase);

        var accountNonce = await this.getAccountNonce(sender.address);
        
        var clientData = cryptography.encryptMessageWithPassphrase(
            userProfile.name.concat(' ***Field*** ')        
            .concat(userProfile.deliveryAddress)
            .concat(' ***Field*** ')        
            .concat(userProfile.phone),            
            credential.passphrase,
            sender.publicKey);
        
        const tx = await transactions.signTransaction(
            profileSchema,
            {
                moduleID: 2000,
                assetID: 1020,
                nonce: BigInt(accountNonce),
                fee: BigInt(0),
                senderPublicKey: sender.publicKey,
                asset: {                   
                    name: userProfile.name,
                    clientData: clientData.encryptedMessage,
                    clientNonce: clientData.nonce,
                    recipientAddress: sender.address
                },
            },
            Buffer.from(networkIdentifier, "hex"),
            credential.passphrase);
    
        return tx;
    }

    async setNewBlockEventSubscriber(){      
        const client = await this.getClient();      
        client.subscribe('app:block:new', async ( block ) => {
            const schema = await client.invoke('app:getSchema');
            var blockDecoded = codec.codec.decodeJSON(schema.block, Buffer.from(block.block, 'hex'))
            console.log(blockDecoded);
        });        
    }    

    async setNewTransactionEventSubscriber(){      
        const client = await this.getClient();      
        client.subscribe('app:transaction:new', async ( transaction ) => {
            const schema = await client.invoke('app:getSchema');
            var transactionDecoded = codec.codec.decodeJSON(schema.transaction, Buffer.from(transaction.transaction, 'hex'));
            console.log(transactionDecoded);
        });        
    }
}