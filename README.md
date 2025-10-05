# API Endpoint Usage Guide

# BASE URL: http://localhost:8000

# Index of API Endpoints

## POST Endpoints

1. Create Block Parcel Token

   - `/api/setter/create-token`
   - Create new land token with block/parcel info

2. Request Whole Plot Transfer

   - `/api/setter/request-plot-transfer`
   - Request transfer of entire plot

3. Request Parcel Transfer

   - `/api/setter/request-parcel-transfer`
   - Request transfer of parcels within a plot

4. Approve Transfer Execution (Delegate)

   - `/api/setter/approve-transfer-execution`
   - Approve transfer as delegated authority

5. Initiate a New Plot

   - `/api/setter/plot-initiate`
   - Create new plot with parcel IDs and amounts

6. Initiate Plot Using Land Names
   - `/api/setter/plot-initiate-using-names`
   - Create new plot using block and parcel names instead of IDs

## GET Endpoints

### Blockchain Get Calls - Land

1. Get Plot and Token ID Info

   - `/api/getter/plot-and-token-id-info`
   - Get current plot and token IDs

2. Get Token URI

   - `/api/getter/token/{tokenId}/uri`
   - Get token metadata URI

3. Get Land Information

   - `/api/getter/land/{tokenId}`
   - Get detailed land token information

4. Get Plot Account Information

   - `/api/getter/plot/{plotId}/info`
   - Get plot account details

5. Get Transfer Request Status

   - `/api/getter/transfer/{requestId}/status`
   - Check transfer request status

6. Get All Plots Information

   - `/api/getter/all-plots-info`
   - Get comprehensive information about all plots

7. Get All Land Information

   - `/api/getter/all-land-info`
   - Get comprehensive information about all land tokens

8. Get All Transfer Requests
   - `/api/getter/all-transfer-requests`
   - Get comprehensive information about all transfer requests

### Blockchain Get Calls - Plot

9. Get Plot Parcel Shareholders

   - `/api/get_plot/plot/{plotId}/parcel/{parcelId}/shareholders`
   - Get all shareholders for a parcel

10. Get User Shares in Plot Parcel

    - `/api/get_plot/plot/{plotId}/parcel/{parcelId}/user/{userAddress}/shares`
    - Get user's share count in a parcel

11. Get Plot Parcel Total Shares

    - `/api/get_plot/plot/{plotId}/parcel/{parcelId}/total-shares`
    - Get total shares for a parcel

12. Get User Parcels in Plot

    - `/api/get_plot/plot/{plotId}/user/{userAddress}/parcels`
    - Get all parcels where user owns shares

13. Get User Ownership Percentage in Plot
    - `/api/get_plot/plot/{plotId}/user/{userAddress}/ownership`
    - Get user's ownership percentage in plot

### Database Management Endpoints

14. Database Health Check

    - `/api/db-management/health`
    - Check database connection status

15. Show Plots Table Data

    - `/api/db-management/show-plots`
    - View all data from plots table

16. Show Block Parcel Table Data

    - `/api/db-management/show-blockparcel`
    - View all data from blockparcelinfo table

17. Show Request Table Data

    - `/api/db-management/show-request`
    - View all data from request table

18. Get Plot by Name

    - `/api/db-management/plot/{plotName}`
    - Get plot details by plot name from database

19. Get Specific Block and Parcel by Name
    - `/api/db-management/blockparcel/{blockName}/{parcelName}`
    - Get specific block and parcel details by names

### Health Check & Utility Endpoints

20. API Health Check

    - `/`
    - Basic health check to verify API is running

21. View API Call Logs

    - `/api/logs`
    - View all logged API calls and their details

---

# POST Endpoints Usage Guide

---

## 1. Create Block Parcel Token

**Why/When:** Use this to create a new land token with block and parcel information. Typically used by admin or authorized users to mint new tokens.

```
POST http://localhost:8000/api/setter/create-token
Content-Type: application/json

{
  "blockInfo": "Block A1",
  "parcelInfo": "Parcel P1",
  "tokenURI": "https://example.com/token/metadata/1",
  "totalSupply": "1000"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tokenId": "1",
    "blockInfo": "Block A1",
    "parcelInfo": "Parcel P1",
    "tokenURI": "https://example.com/token/metadata/1",
    "totalSupply": "1000",
    "transaction": {
      "hash": "0x1234567890abcdef1234567890abcdef12345678",
      "gasUsed": "21000",
      "status": 1
    },
    "confirmedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Block parcel token created successfully"
}
```

---

## 2. Request Whole Plot Transfer

**Why/When:** Use this to request the transfer of an entire plot from one address to another. Used by plot owners or authorized users to initiate a transfer.

```
POST http://localhost:8000/api/setter/request-plot-transfer
Content-Type: application/json

{
  "plotId": 1,
  "to": "0x0987654321098765432109876543210987654321"
}
```

**Conditions & Restrictions:**

- Can only be initiated if the sender has 100% ownership of the plot (holds all shares)
- Sender must be the current holder of the plot Ownership NFT token
- The transfer request can be initiated by any address that meets the above conditions
- The transfer will remain pending until approved by required authorities

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "1",
    "plotId": "1",
    "to": "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298",
    "transaction": {
      "hash": "0x1234567890abcdef1234567890abcdef12345678",
      "gasUsed": "21000",
      "status": 1
    },
    "confirmedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Plot transfer request created successfully"
}
```

---

## 3. Request Parcel Transfer

**Why/When:** Use this to request the transfer of a parcel (or parcels) from one address to another inside a plot. Used by parcel owners or authorized users.

```
POST http://localhost:8000/api/setter/request-parcel-transfer
Content-Type: application/json

{
  "_parcelId": 101,
  "parcelAmount": 1000,
  "to": "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298",
  "_plotId": 1
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "1",
    "_parcelId": 101,
    "parcelAmount": 1000,
    "to": "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298",
    "_plotId": 1,
    "transaction": {
      "hash": "0x1234567890abcdef1234567890abcdef12345678",
      "gasUsed": "21000",
      "status": 1
    },
    "confirmedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Parcel transfer request created successfully"
}
```

---

## 4. Approve Transfer Execution (Delegate)

**Why/When:** Use this to approve and execute a transfer request as a delegated authority (Land Authority, Bank, or Lawyer). Each role has specific approval rights in the transfer process.

**Roles:**

- Land Authority = 1
- Bank Authority = 2
- Lawyer Authority = 3

```
POST http://localhost:8000/api/setter/approve-transfer-execution
Content-Type: application/json

{
  "signerWallet": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
  "requestId": "1",
  "role": 1
}
```

**Conditions & Restrictions:**

- Can only be called by authorized delegates (Land Authority, Bank, or Lawyer)
- Each role can only approve once per transfer request
- All required authorities must approve before transfer can be finalized

**Response:**

```json
{
  "success": true,
  "data": {
    "signerWallet": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
    "requestId": "1",
    "role": 1,
    "roleName": "Land Authority",
    "transaction": {
      "hash": "0x1234567890abcdef1234567890abcdef12345678",
      "gasUsed": "21000",
      "status": 1
    },
    "confirmedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Transfer approved by Land Authority successfully"
}
```

---

## 5. Initiate a New Plot

**Why/When:** Use this to initiate a new plot with the given parcel IDs and parcel amounts. Used by admin or authorized users during plot creation.

```
POST http://localhost:8000/api/setter/plot-initiate
Content-Type: application/json

{
  "plotName": "Agricultural Plot A1",
  "parcelIds": [101, 102, 103],
  "parcelAmounts": [1000, 800, 1200]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transaction": {
      "hash": "0x1234567890abcdef1234567890abcdef12345678",
      "gasUsed": "21000",
      "status": 1
    },
    "plotId": "1",
    "plotName": "Agricultural Plot A1",
    "parcelIds": [101, 102, 103],
    "parcelAmounts": [1000, 800, 1200]
  },
  "message": "Plot initiated successfully"
}
```

---

## 6. Initiate Plot Using Land Names

**Why/When:** Use this to initiate a new plot using human-readable block and parcel names instead of token IDs. The system automatically finds matching token IDs from the blockchain based on the provided names. This is more user-friendly than using numeric IDs.

**Key Features:**

- Automatically resolves block and parcel names to token IDs
- Validates that all land names exist on the blockchain
- Checks for duplicate plot names
- Returns detailed error messages if any lands are not found

```
POST http://localhost:8000/api/setter/plot-initiate-using-names
Content-Type: application/json

{
  "plotName": "Plot 7",
  "land_info": [
    {
      "blockName": "Block 1",
      "parcelName": "Parcel 3",
      "amount": 100
    },
    {
      "blockName": "Block 1",
      "parcelName": "Parcel 4",
      "amount": 150
    }
  ]
}
```

**Request Body Parameters:**

- `plotName` (string, required): Name for the new plot
- `land_info` (array, required): Array of land information objects
  - `blockName` (string, required): Name of the block
  - `parcelName` (string, required): Name of the parcel
  - `amount` (number, required): Amount/quantity of tokens from this parcel

**Conditions & Restrictions:**

- All block and parcel name combinations must exist on the blockchain
- The caller must have sufficient token balance for the specified amounts
- Plot name must be unique (not already exist)
- `land_info` array must contain at least one entry

**Response:**

```json
{
  "success": true,
  "data": {
    "transaction": {
      "hash": "0xa4328f87d58e2bde7a43d377685772481fc172b427d42c53e99320e1926d55f0",
      "gasUsed": "783615",
      "status": 1
    },
    "plotId": "7",
    "plotName": "Plot 7",
    "land_info": [
      {
        "blockName": "Block 1",
        "parcelName": "Parcel 3",
        "amount": 100
      },
      {
        "blockName": "Block 1",
        "parcelName": "Parcel 4",
        "amount": 150
      }
    ],
    "matchingTokenIds": [3, 4],
    "parcelAmounts": [100, 150],
    "dbRecord": {
      "plot_id": 7,
      "plot_name": "Plot 7",
      "current_holder": "0x6e6C0a0634D184DAaC91e2B28ceF2131871e79FE",
      "list_of_parcels": [3, 4],
      "amount": [100, 150],
      "created_at": "2025-10-05T07:28:44.260Z"
    }
  },
  "message": "Plot initiated using land names and saved to database successfully"
}
```

**Error Response (Land Not Found):**

```json
{
  "success": false,
  "error": {
    "message": "Some land names were not found on blockchain",
    "details": "Could not find token IDs for 1 land(s)",
    "notFoundLands": [
      {
        "blockName": "Block 99",
        "parcelName": "Parcel 99",
        "amount": 100
      }
    ],
    "code": "LAND_NOT_FOUND",
    "timestamp": "2025-10-05T12:51:21.730Z",
    "endpoint": "/api/setter/plot-initiate-using-names"
  }
}
```

---

# GET Endpoints Usage Guide

---

## 1. Get Land Information

**Why/When:** Get detailed information about a specific land token by its ID. Use this to display land details to users.

```
GET http://localhost:8000/api/getter/land/1
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tokenId": "1",
    "blockInfo": "Block A1",
    "parcelInfo": "Parcel P1",
    "blockParcelTokenURI": "https://example.com/token/1",
    "totalSupply": "1000",
    "plotAllocation": ["100", "200", "300"]
  },
  "message": "Land information retrieved successfully"
}
```

---

## 2. Get Plot Account Information

**Why/When:** Retrieve detailed information about a specific plot account by its ID. Useful for showing plot composition and ownership.

```
GET http://localhost:8000/api/getter/plot/1/info
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plotId": "1",
    "plotAccount": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
    "parcelIds": ["101", "102", "103"],
    "parcelAmounts": ["1000", "800", "1200"]
  },
  "message": "Plot account information retrieved successfully"
}
```

---

## 3. Get All Plots

**Why/When:** Get a list of all plots in the system. Use this to display available plots or for admin overviews.

```
GET http://localhost:8000/api/getter/plots
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plots": ["1", "2", "3"],
    "totalPlots": 3
  },
  "message": "List of all plots retrieved successfully"
}
```

---

## 4. Get Token URI

**Why/When:** Retrieve the token URI for a specific land token. Use this to fetch metadata or images for a token.

```
GET http://localhost:8000/api/getter/token/1/uri
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tokenId": "1",
    "uri": "https://example.com/token/1"
  },
  "message": "Token URI retrieved successfully"
}
```

---

## 5. Get Transfer Request Status

**Why/When:** Check the status of a transfer request by its ID. Only the sender of the request can access its status. Use for tracking transfer progress.

```
GET http://localhost:8000/api/getter/transfer/1/status
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "1",
    "from": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
    "to": "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298",
    "parcelId": "101",
    "parcelAmount": "1000",
    "isPlotTransfer": false,
    "plotId": "0",
    "timestamp": "1642250000",
    "status": "1",
    "landAuthorityApproved": "true",
    "lawyerApproved": "false",
    "bankApproved": "false"
  },
  "message": "Transfer request status retrieved successfully",
  "warning": "This endpoint should have authentication in production"
}
```

---

## 6. Get Plot and Token ID Info

**Why/When:** Retrieve the current plot ID and token ID from the contract. Useful for admin or for creating new records.

```
GET http://localhost:8000/api/getter/plot-and-token-id-info
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plotId": "1",
    "tokenId": "1001"
  },
  "message": "Plot and token ID info retrieved successfully"
}
```

---

## 7. Get Plot Parcel Shareholders

**Why/When:** Get all shareholders for a specific parcel within a plot. Use this to display ownership breakdown for a parcel.

```
GET http://localhost:8000/api/get_plot/plot/1/parcel/101/shareholders
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plotId": "1",
    "parcelId": "101",
    "shareholders": [
      "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
      "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
    ],
    "totalShareholders": 2
  },
  "message": "Plot parcel shareholders retrieved successfully"
}
```

---

## 8. Get User Shares in Plot Parcel

**Why/When:** Retrieve the number of shares a specific user owns in a plot parcel. Use for user dashboards or ownership checks.

```
GET http://localhost:8000/api/get_plot/plot/1/parcel/101/user/0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0/shares
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plotId": "1",
    "parcelId": "101",
    "userAddress": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
    "shares": "500"
  },
  "message": "User shares in plot parcel retrieved successfully"
}
```

---

## 9. Get Plot Parcel Total Shares

**Why/When:** Get the total number of shares for a specific parcel within a plot. Useful for calculating ownership percentages.

```
GET http://localhost:8000/api/get_plot/plot/1/parcel/101/total-shares
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plotId": "1",
    "parcelId": "101",
    "totalShares": "1000"
  },
  "message": "Plot parcel total shares retrieved successfully"
}
```

---

## 10. Get User Parcels in Plot

**Why/When:** Get all parcels that a specific user owns shares in within a plot. Use for user dashboards or ownership overviews.

```
GET http://localhost:8000/api/get_plot/plot/1/user/0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0/parcels
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plotId": 1,
    "userAddress": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
    "parcels": ["101", "102", "103"],
    "totalParcels": 3
  },
  "message": "User parcels in plot retrieved successfully"
}
```

---

## 11. Get User Ownership Percentage in Plot

**Why/When:** Retrieve the ownership percentage of a specific user in a plot. The percentage is calculated based on the user's total shares compared to the plot's total shares.

```
GET http://localhost:8000/api/get_plot/plot/1/user/0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0/ownership
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plotId": "1",
    "userAddress": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
    "ownershipPercentage": "2500",
    "ownershipPercent": "25.00%"
  },
  "message": "User ownership percentage in plot retrieved successfully"
}
```

---

# Error Response Format

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Operation failed",
    "details": "Detailed error description",
    "code": "CALL_EXCEPTION",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "endpoint": "/api/endpoint/path"
  }
}
```

---

# Database Management Endpoints

---

## 12. View Database Table Data

**Why/When:** View all data from any database table. Useful for debugging and data inspection.

```
GET http://localhost:8000/api/db-management/show-table/blockparcelinfo
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "message": "Data retrieved from 'blockparcelinfo' successfully",
  "data": [
    {
      "id": 1,
      "token_id": 1,
      "parcel_name": "Parcel 3",
      "block_name": "Block A1",
      "total_supply": "1000",
      "metadata": "https://example.com/metadata/token5"
    }
  ]
}
```

---

## 13. Get Plot by Name (Database)

**Why/When:** Get plot details by plot name from the local database. Useful for searching plots by name.

```
GET http://localhost:8000/api/db-management/plot/Plot7
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "message": "Plot details retrieved successfully",
  "data": {
    "id": 1,
    "plot_name": "Plot7",
    "parcel_ids": [4, 5],
    "parcel_amounts": [100, 100],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 14. Get Specific Block and Parcel by Name

**Why/When:** Get specific block and parcel details by their names from the database. Useful for searching specific block-parcel combinations.

```
GET http://localhost:8000/api/db-management/blockparcel/Block A1/Parcel 5
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "message": "Block parcel details retrieved successfully",
  "data": {
    "id": 1,
    "token_id": 1,
    "block_name": "Block A1",
    "parcel_name": "Parcel 5",
    "total_supply": "1000",
    "metadata": "https://example.com/metadata/token5",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 15. Create Database Table

**Why/When:** Create a new database table with custom schema. Useful for setting up new data structures.

```
POST http://localhost:8000/api/db-management/create-table/users
Content-Type: application/json

{
  "columns": "id SERIAL PRIMARY KEY, username VARCHAR(50) NOT NULL, email VARCHAR(100) UNIQUE, password VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Table 'users' created successfully",
  "data": {
    "tableName": "users",
    "columns": "id SERIAL PRIMARY KEY, username VARCHAR(50) NOT NULL, email VARCHAR(100) UNIQUE, password VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
  }
}
```

---

## 16. Test Database Insertion

**Why/When:** Insert test data into any database table. Useful for testing database operations.

```
POST http://localhost:8000/api/db-management/test-insertion/users
Content-Type: application/json

{
  "columns": ["username", "email", "password"],
  "values": ["john_doe", "john@example4.com", "password123"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Data inserted into 'users' successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example4.com",
    "password": "password123",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

# Health Check Endpoints

---

## 17. Test Database Connection

**Why/When:** Check if the database connection is working properly. Useful for health monitoring.

```
GET http://localhost:8000/api/db/test-connection
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "message": "Database connection successful",
  "data": {
    "status": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 18. API Health Check

**Why/When:** Basic health check to verify the API is running.

```
GET http://localhost:8000/
Content-Type: application/json
```

**Response:**

```
It's Land Management Api endpoint
```

---

## 6. Get All Plots Information

**Why/When:** Get comprehensive information about all plots in the blockchain with proper BigInt handling and consistent data formatting.

```
GET http://localhost:8000/api/getter/all-plots-info
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "Plot 1": {
      "plotAccount": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
      "plotOwner": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
      "plotName": "Agricultural Plot A1",
      "parcelIds": ["101", "102", "103"],
      "parcelAmounts": ["1000", "800", "1200"]
    }
  },
  "message": "Plot account information retrieved successfully"
}
```

---

## 7. Get All Land Information

**Why/When:** Get comprehensive information about all land tokens in the blockchain with proper BigInt handling.

```
GET http://localhost:8000/api/getter/all-land-info
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "Land 1": {
      "blockInfo": "Block A1",
      "parcelInfo": "Parcel P1",
      "blockParcelTokenURI": "https://example.com/token/1",
      "totalSupply": "1000",
      "plotAllocation": ["100", "200", "300"]
    }
  },
  "message": "Land information retrieved successfully"
}
```

---

## 8. Get All Transfer Requests

**Why/When:** Get comprehensive information about all transfer requests in the blockchain with proper BigInt handling.

```
GET http://localhost:8000/api/getter/all-transfer-requests
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "Transfer Request 1": {
      "from": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
      "to": "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298",
      "parcelId": "101",
      "parcelAmount": "1000",
      "isPlotTransfer": false,
      "plotId": "1",
      "timestamp": "1642250000",
      "status": "1",
      "landAuthorityApproved": true,
      "lawyerApproved": false,
      "bankApproved": false
    }
  },
  "message": "Transfer request information retrieved successfully"
}
```

---

## 9. Database Health Check

**Why/When:** Check if the database connection is working properly. Useful for health monitoring and debugging database connectivity issues.

```
GET http://localhost:8000/api/db-management/health
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "message": "Database connection is healthy"
}
```

---

## 10. Show Plots Table Data

**Why/When:** View all data from the plots table in the database. Useful for debugging and data inspection of plot records.

```
GET http://localhost:8000/api/db-management/show-plots
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "message": "Plots data retrieved successfully",
  "data": [
    {
      "id": 1,
      "plot_id": 1,
      "plot_name": "Agricultural Plot A1",
      "current_holder": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
      "list_of_parcels": [101, 102, 103],
      "amount": [1000, 800, 1200],
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 11. Show Block Parcel Table Data

**Why/When:** View all data from the blockparcelinfo table in the database. Useful for debugging and data inspection of block parcel records.

```
GET http://localhost:8000/api/db-management/show-blockparcel
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "message": "Block parcel data retrieved successfully",
  "data": [
    {
      "id": 1,
      "token_id": 1,
      "parcel_name": "Parcel P1",
      "block_name": "Block A1",
      "total_supply": "1000",
      "metadata": "https://example.com/metadata/token1",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 12. Show Request Table Data

**Why/When:** View all data from the request table in the database. Useful for debugging and data inspection of transfer request records.

```
GET http://localhost:8000/api/db-management/show-request
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "message": "Request data retrieved successfully",
  "data": [
    {
      "id": 1,
      "request_id": 1,
      "plot_id": 1,
      "is_plot": true,
      "land_authority": false,
      "lawyer": false,
      "bank": false,
      "current_status": "PENDING",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 13. View API Call Logs

**Why/When:** View all logged API calls and their details including request/response information, console logs, and performance metrics.

```
GET http://localhost:8000/api/logs
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "logs": {
      "1": {
        "timestamp": "2024-01-15T10:30:00.000Z",
        "endpoint": "GET /api/getter/all-plots-info",
        "method": "GET",
        "url": "/api/getter/all-plots-info",
        "headers": {...},
        "query": {},
        "body": {},
        "statusCode": 200,
        "duration": "150ms",
        "consoleLogs": [...]
      }
    },
    "counter": 1
  },
  "message": "API call logs retrieved successfully"
}
```

---

# Complete Endpoint Summary

## Total Endpoints: 22

### By Category:

- **Setter Endpoints (Blockchain Writes):** 6
- **Blockchain Get Calls - Land:** 8
- **Blockchain Get Calls - Plot:** 5
- **Database Management:** 6
- **Health Check & Utility:** 2

### By HTTP Method:

- **GET:** 19 endpoints
- **POST:** 6 endpoints

---
