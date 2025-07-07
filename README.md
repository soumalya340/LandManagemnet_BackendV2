# Land Tokenization Backend API

A RESTful API backend service for the Land Tokenization platform, providing seamless integration with blockchain smart contracts for land asset management, plot ownership, and fractional tokenization.

## 🏗️ Architecture Overview

This backend service acts as a bridge between the frontend applications and the blockchain smart contracts, providing a familiar REST API interface for all land tokenization operations.

### Key Features

- **Smart Contract Integration**: Direct integration with LandAssetManager and related contracts
- **RESTful API Design**: Clean, intuitive endpoints for all operations
- **Real-time Blockchain Interaction**: Live contract state queries and transaction execution
- **Modular Architecture**: Organized route handlers for different functionalities
- **Error Handling**: Comprehensive error handling for blockchain operations
- **CORS Enabled**: Cross-origin resource sharing for web applications

## 📁 Project Structure

```
backend/
├── index.js                 # Main server entry point
├── package.json            # Dependencies and scripts
├── test.rest              # API testing file
├── .gitignore             # Git ignore rules
├── routes/                # API route handlers
│   ├── getter.routes.js   # Read-only contract functions
│   ├── setter.route.js    # State-changing contract functions
│   └── get_plot.routes.js # Plot-specific operations
└── utils/                 # Utility functions
    ├── contractInstance.js # Contract initialization
    └── abi.json           # Contract ABI definitions
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Access to a blockchain network (local/testnet/mainnet)
- Smart contracts deployed and contract address
- Private key for transaction signing

### Installation

1. **Clone and navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the backend directory:

   ```env
   # Server Configuration
   PORT=8000
   NODE_ENV=development

   # Blockchain Configuration
   RPC_URL=your_rpc_endpoint_here
   PRIVATE_KEY=your_private_key_here
   CONTRACT_ADDRESS=your_deployed_contract_address

   # Network Configuration (choose one)
   # Local Development
   # RPC_URL=http://localhost:8545

   # Base Testnet
   # RPC_URL=https://sepolia.base.org

   # Polygon Testnet
   # RPC_URL=https://rpc-amoy.polygon.technology
   ```

4. **Start the development server**:

   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

5. **Verify server is running**:
   ```bash
   curl http://localhost:8000
   # Should return: "It's Land Management Api endpoint"
   ```

## 📡 API Endpoints

### Base URL

```
http://localhost:8000/api
```

### Getter Endpoints (Read-Only Operations)

#### Contract Information

- `GET /getter/contract-info` - Get basic contract information
- `GET /getter/land/:tokenId` - Get land information by token ID
- `GET /getter/token/:tokenId/uri` - Get token URI
- `GET /getter/balance/:address/:tokenId` - Get token balance for address

#### Plot Operations

- `GET /get_plot/plots` - Get all plots list
- `GET /get_plot/:plotId/info` - Get plot account information
- `GET /get_plot/:plotId/parcel/:parcelId/shareholders` - Get parcel shareholders
- `GET /get_plot/:plotId/user/:userAddress/shares` - Get user shares in plot
- `GET /get_plot/:plotId/user/:userAddress/ownership` - Get user ownership percentage

### Setter Endpoints (State-Changing Operations)

#### Administrative Functions

- `POST /setter/set-plot-registry` - Set plot registry contract address
- `POST /setter/set-plot-ownership` - Set plot ownership contract address
- `POST /setter/create-token` - Create new block parcel token

#### Plot Management

- `POST /setter/plot/initiate` - Initiate plot creation
- `POST /setter/plot/finalize` - Finalize plot registration

#### Transfer Operations

- `POST /setter/transfer/parcel/request` - Request parcel transfer
- `POST /setter/transfer/plot/request` - Request whole plot transfer
- `POST /setter/transfer/approve` - Approve transfer (authorities)
- `POST /setter/transfer/parcel/finalize` - Finalize parcel transfer
- `POST /setter/transfer/plot/finalize` - Finalize plot transfer

## 🔧 Configuration

### Environment Variables

| Variable           | Description                  | Required | Default     |
| ------------------ | ---------------------------- | -------- | ----------- |
| `PORT`             | Server port                  | No       | 8000        |
| `NODE_ENV`         | Environment mode             | No       | development |
| `RPC_URL`          | Blockchain RPC endpoint      | Yes      | -           |
| `PRIVATE_KEY`      | Private key for transactions | Yes      | -           |
| `CONTRACT_ADDRESS` | Deployed contract address    | Yes      | -           |

### Smart Contract Integration

The backend automatically connects to your deployed smart contracts using:

1. **Contract Address**: Specified in environment variables
2. **ABI**: Stored in `utils/abi.json`
3. **Provider**: Configured via RPC_URL
4. **Signer**: Initialized with PRIVATE_KEY

## 🧪 Testing

### Using REST Client

Use the included `test.rest` file with VS Code REST Client extension:

```http
# Example: Set Plot Registry Contract
POST http://localhost:8000/api/setter/set-plot-registry
Content-Type: application/json

{
  "plotRegistryAddress": "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
}
```

### Manual Testing

```bash
# Test server health
curl http://localhost:8000

# Test getter endpoint
curl http://localhost:8000/api/getter/contract-info

# Test with POST data
curl -X POST http://localhost:8000/api/setter/create-token \
  -H "Content-Type: application/json" \
  -d '{"blockInfo":"Block123","parcelInfo":"Parcel456","tokenURI":"ipfs://...","totalSupply":"1000"}'
```

## 🔐 Security Considerations

### Environment Variables

- ⚠️ **Never commit `.env` file to version control**
- 🔒 Use environment-specific private keys
- 🛡️ Rotate private keys regularly in production

### CORS Configuration

Current CORS settings allow all origins (`*`). For production:

```javascript
app.use(
  cors({
    origin: ["https://yourfrontend.com"], // Specific origins only
    credentials: true,
    methods: ["GET", "POST"],
  })
);
```

### Rate Limiting

Consider implementing rate limiting for production:

```bash
npm install express-rate-limit
```

## 🚀 Deployment

### Local Development

```bash
npm start
```

### Production Deployment

1. **Environment Setup**:

   ```bash
   export NODE_ENV=production
   export PORT=3000
   export RPC_URL=your_mainnet_rpc
   # ... other production variables
   ```

2. **Process Management** (using PM2):

   ```bash
   npm install -g pm2
   pm2 start index.js --name "land-api"
   pm2 startup
   pm2 save
   ```

3. **Docker Deployment**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 8000
   CMD ["npm", "start"]
   ```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔍 Monitoring & Logging

### Health Check Endpoint

```bash
curl http://localhost:8000/
```

### Error Handling

The server includes comprehensive error handling for:

- Blockchain connection issues
- Contract call failures
- Invalid request parameters
- Network timeouts

### Logs

Monitor application logs for:

- Server startup messages
- Contract initialization status
- Transaction receipts
- Error details

## 🤝 Contributing

1. **Code Style**: Follow existing patterns in route handlers
2. **Error Handling**: Always use try-catch blocks for async operations
3. **Documentation**: Update README for new endpoints
4. **Testing**: Test new endpoints with the REST client

### Adding New Endpoints

1. **Create route handler** in appropriate routes file
2. **Add validation** for request parameters
3. **Handle async operations** with proper error catching
4. **Test thoroughly** with various inputs
5. **Update documentation**

## 📚 API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

### Transaction Response

```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "blockNumber": 12345,
    "gasUsed": "21000",
    "status": "success"
  }
}
```

## 🆘 Troubleshooting

### Common Issues

1. **Contract Connection Failed**

   - Verify RPC_URL is accessible
   - Check CONTRACT_ADDRESS is correct
   - Ensure network matches deployed contract

2. **Transaction Failures**

   - Verify PRIVATE_KEY has sufficient balance
   - Check gas limit settings
   - Confirm contract function exists

3. **Permission Denied**

   - Ensure signer has required role for function
   - Check contract access control settings

4. **Server Won't Start**
   - Verify all environment variables are set
   - Check port availability
   - Review dependency installation

### Debug Mode

Set environment variable for detailed logging:

```bash
export DEBUG=1
npm start
```

## 📝 License

MIT License - see LICENSE file for details

## 🔗 Related Documentation

- [Smart Contracts Documentation](../smart_contracts/README.md)
- [Frontend Documentation](../frontend/README.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [API Reference](../docs/API.md)
