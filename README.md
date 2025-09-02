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
├── index.js                      # Main server entry point with Swagger UI
├── package.json                  # Dependencies and scripts
├── test.rest                     # API testing file with comprehensive examples
├── .gitignore                    # Git ignore rules
├── routes/                       # API route handlers
│   ├── getter.routes.js          # Read-only blockchain contract functions
│   ├── setter.routes.js          # State-changing blockchain operations
│   ├── get_plot.routes.js        # Plot-specific query operations
│   ├── db-management.routes.js   # Database management operations
│   └── admin.js                  # Administrative functions
├── utils/                        # Utility functions
│   ├── contractInstance.js       # Contract initialization and management
│   └── abi.json                  # Smart contract ABI definitions
├── db/                           # Database operations
│   ├── db_utils.js              # Database utility functions
│   ├── blockparcel.js           # Block parcel data operations
│   ├── plots.js                 # Plot data operations
│   └── request.js               # Transfer request operations
└── config/                      # Configuration files
    └── swagger.js               # Swagger API documentation setup
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

   # Database Configuration  
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_NAME=your_database_name
   DB_PASSWORD=your_database_password

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

### 📖 API Documentation

Interactive API documentation is available at:
```
http://localhost:8000/api-docs
```

### Getter Endpoints (Read-Only Operations)

#### Land & Token Information
- `GET /getter/land/:tokenId` - Get detailed land information by token ID
- `GET /getter/token/:tokenId/uri` - Get token metadata URI
- `GET /getter/plots` - Get list of all plots in the system
- `GET /getter/plot-and-token-id-info` - Get current plot and token ID counters

#### Plot Account Information
- `GET /getter/plot/:plotId/info` - Get plot account details (parcel IDs, amounts, owner)

#### Transfer Request Status
- `GET /getter/transfer/:requestId/status` - Get transfer request status and approvals

### Plot Query Endpoints (Detailed Plot Operations)

#### Plot Parcel Information
- `GET /get_plot/plot/:plotId/parcel/:parcelId/shareholders` - Get all shareholders of a parcel
- `GET /get_plot/plot/:plotId/parcel/:parcelId/total-shares` - Get total shares for a parcel
- `GET /get_plot/plot/:plotId/parcel/:parcelId/user/:userAddress/shares` - Get user's shares in specific parcel

#### User Plot Information  
- `GET /get_plot/plot/:plotId/user/:userAddress/parcels` - Get all parcels a user owns in a plot
- `GET /get_plot/plot/:plotId/user/:userAddress/ownership` - Get user's ownership percentage in a plot

### Setter Endpoints (State-Changing Operations)

#### Token & Plot Creation
- `POST /setter/create-token` - Create new block parcel token
  ```json
  {
    "blockInfo": "Block A1",
    "parcelInfo": "Parcel 3", 
    "tokenURI": "https://example.com/metadata/token5",
    "totalSupply": 1000
  }
  ```

- `POST /setter/plot-initiate` - Initiate a new plot with parcels
  ```json
  {
    "plotName": "Plot 1",
    "parcelIds": [1, 2],
    "parcelAmounts": [100, 100]
  }
  ```

#### Transfer Operations
- `POST /setter/request-plot-transfer` - Request transfer of entire plot
  ```json
  {
    "plotId": 1,
    "to": "0xeeFB89a2a00F8206AbB031F0c4D9fa07861c5BbD"
  }
  ```

- `POST /setter/request-parcel-transfer` - Request partial parcel transfer
  ```json
  {
    "_parcelId": 1,
    "parcelAmount": 75,
    "to": "0xeeFB89a2a00F8206AbB031F0c4D9fa07861c5BbD",
    "_plotId": 20
  }
  ```

#### Transfer Approvals (Multi-signature)
- `POST /setter/approve-transfer-execution` - Approve transfer by authority
  ```json
  {
    "signerWallet": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
    "requestId": "1",
    "role": 1
  }
  ```
  
  **Roles:**
  - `1`: Land Authority
  - `2`: Bank  
  - `3`: Lawyer

### Database Management Endpoints

#### Table Operations
- `GET /db-management/show-table/:tableName` - View data from any table
- `POST /db-management/create-table/:tableName` - Create new table with custom schema
- `DELETE /db-management/table/:tableName` - Drop entire table
- `POST /db-management/test-insertion/:tableName` - Test data insertion

#### Database Health
- `GET /db/test-connection` - Test database connectivity

### Administrative Endpoints

#### Data Management
- `DELETE /admin/block-parcel/:id` - Delete specific block parcel record
- `DELETE /admin/table/:tableName` - Administrative table operations

## 🔧 Configuration

### Environment Variables

| Variable           | Description                  | Required | Default     |
| ------------------ | ---------------------------- | -------- | ----------- |
| `PORT`             | Server port                  | No       | 8000        |
| `NODE_ENV`         | Environment mode             | No       | development |
| `RPC_URL`          | Blockchain RPC endpoint      | Yes      | -           |
| `PRIVATE_KEY`      | Private key for transactions | Yes      | -           |
| `CONTRACT_ADDRESS` | Deployed contract address    | Yes      | -           |
| `DB_HOST`          | Database host address        | Yes      | -           |
| `DB_USER`          | Database username           | Yes      | -           |
| `DB_NAME`          | Database name               | Yes      | -           |
| `DB_PASSWORD`      | Database password           | Yes      | -           |

### Smart Contract Integration

The backend automatically connects to your deployed smart contracts using:

1. **Contract Address**: Specified in environment variables
2. **ABI**: Stored in `utils/abi.json`
3. **Provider**: Configured via RPC_URL
4. **Signer**: Initialized with PRIVATE_KEY

## 🧪 Testing

### Using REST Client

Use the included `test.rest` file with VS Code REST Client extension. The file contains comprehensive examples for all endpoints:

```http
# Example: Create Block Parcel Token
POST http://localhost:8000/api/setter/create-token
Content-Type: application/json

{
  "blockInfo": "Block A1",
  "parcelInfo": "Parcel 3",
  "tokenURI": "https://example.com/metadata/token5",
  "totalSupply": 1000
}

# Example: Initiate Plot
POST http://localhost:8000/api/setter/plot-initiate
Content-Type: application/json

{
  "plotName": "Plot 1",
  "parcelIds": [1, 2],
  "parcelAmounts": [100, 100]
}

# Example: Request Plot Transfer
POST http://localhost:8000/api/setter/request-plot-transfer
Content-Type: application/json

{
  "plotId": 1,
  "to": "0xeeFB89a2a00F8206AbB031F0c4D9fa07861c5BbD"
}
```

### Manual Testing

```bash
# Test server health
curl http://localhost:8000

# Test database connection
curl http://localhost:8000/api/db/test-connection

# Get all plots
curl http://localhost:8000/api/getter/plots

# Get land information
curl http://localhost:8000/api/getter/land/1

# Get plot information
curl http://localhost:8000/api/getter/plot/1/info

# Create token
curl -X POST http://localhost:8000/api/setter/create-token \
  -H "Content-Type: application/json" \
  -d '{"blockInfo":"Block A1","parcelInfo":"Parcel 3","tokenURI":"https://example.com/metadata/token5","totalSupply":1000}'

# View database table
curl http://localhost:8000/api/db-management/show-table/blockparcelinfo
```

## 🔐 Security Considerations

### Environment Variables

- ⚠️ **Never commit `.env` file to version control**
- 🔒 Use environment-specific private keys and database credentials
- 🛡️ Rotate private keys and database passwords regularly in production
- 🗄️ Use secure database connections (SSL) in production

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

### Health Check Endpoints

```bash
# API Health Check
curl http://localhost:8000/

# Database Connection Check
curl http://localhost:8000/api/db/test-connection

# Swagger API Documentation
curl http://localhost:8000/api-docs
```

### Error Handling

The server includes comprehensive error handling for:

- Blockchain connection issues
- Contract call failures
- Database connectivity issues
- Invalid request parameters
- Network timeouts
- Multi-signature approval validation

### Logs

Monitor application logs for:

- Server startup messages
- Contract initialization status  
- Database connection status
- Transaction receipts and gas usage
- Transfer request approvals
- Error details with timestamps

## 🤝 Contributing

1. **Code Style**: Follow existing patterns in route handlers
2. **Error Handling**: Always use try-catch blocks for async operations
3. **Documentation**: Update README for new endpoints
4. **Testing**: Test new endpoints with the REST client

### Adding New Endpoints

1. **Choose appropriate route file** (`getter.routes.js` for read operations, `setter.routes.js` for blockchain writes, `db-management.routes.js` for database operations)
2. **Add Swagger documentation** using JSDoc comments for API documentation
3. **Add validation** for request parameters (especially Ethereum addresses and numeric values)
4. **Handle async operations** with proper error catching and transaction receipts
5. **Update database operations** if the endpoint interacts with persistent data
6. **Test thoroughly** with various inputs using the `test.rest` file
7. **Update this README** with new endpoint information

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
    "requestId": "1",
    "plotId": 1,
    "transaction": {
      "hash": "0x1234567890abcdef...",
      "gasUsed": "84523",
      "status": 1
    },
    "confirmedAt": "2023-12-07T10:30:45.123Z"
  },
  "message": "Plot transfer request created successfully"
}
```

## 🆘 Troubleshooting

### Common Issues

1. **Contract Connection Failed**
   - Verify RPC_URL is accessible and network is up
   - Check CONTRACT_ADDRESS is correct and deployed
   - Ensure network matches deployed contract
   - Verify PRIVATE_KEY format (64-character hex without 0x prefix)

2. **Database Connection Failed**
   - Verify DB_HOST, DB_USER, DB_NAME, DB_PASSWORD are correct
   - Check if PostgreSQL service is running
   - Ensure database exists and user has proper permissions
   - Verify network connectivity to database host

3. **Transaction Failures**
   - Verify PRIVATE_KEY wallet has sufficient balance for gas fees
   - Check if contract function exists and is spelled correctly
   - Ensure correct parameter types are passed
   - Verify signer has required permissions for the function

4. **Transfer Approval Issues**
   - Check if request ID exists in database
   - Verify signer wallet has the correct role (1=Land Authority, 2=Bank, 3=Lawyer)
   - Ensure transfer request hasn't already been fully approved
   - Check if plot/parcel exists and has valid ownership

5. **Server Won't Start**
   - Verify all required environment variables are set
   - Check if port 8000 is available
   - Review dependency installation with `npm install`
   - Check PostgreSQL connection parameters

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
