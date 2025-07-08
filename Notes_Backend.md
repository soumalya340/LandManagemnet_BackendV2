# API Endpoint Usage Guide

# BASE URL :



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

## GET Endpoints

1. Get Land Information

   - `/api/getter/land/{tokenId}`
   - Get detailed land token information

2. Get Plot Account Information

   - `/api/getter/plot/{plotId}/info`
   - Get plot account details
   - Returns plot account address and details of all included parcels with their allocated amounts

3. Get All Plots

   - `/api/getter/plots`
   - Retrieve all plots in system

4. Get Token URI

   - `/api/getter/token/{tokenId}/uri`
   - Get token metadata URI

5. Get Transfer Request Status

   - `/api/getter/transfer/{requestId}/status`
   - Check transfer request status

6. Get Plot and Token ID Info

   - `/api/getter/plot-and-token-id-info`
   - Get current plot and token IDs

7. Get Plot Parcel Shareholders

   - `/api/get_plot/plot/{plotId}/parcel/{parcelId}/shareholders`
   - Get all shareholders for a parcel

8. Get User Shares in Plot Parcel

   - `/api/get_plot/plot/{plotId}/parcel/{parcelId}/user/{userAddress}/shares`
   - Get user's share count in a parcel

9. Get Plot Parcel Total Shares

   - `/api/get_plot/plot/{plotId}/parcel/{parcelId}/total-shares`
   - Get total shares for a parcel

10. Get User Parcels in Plot

    - `/api/get_plot/plot/{plotId}/user/{userAddress}/parcels`
    - Get all parcels where user owns shares

11. Get User Ownership Percentage in Plot
    - `/api/get_plot/plot/{plotId}/user/{userAddress}/ownership`
    - Get user's ownership percentage in plot

---

# POST Endpoints Usage Guide

---

## 1. Create Block Parcel Token

**Why/When:** Use this to create a new land token with block and parcel information. Typically used by admin or authorized users to mint new tokens.

```
POST https://landmanagemnet-backendv2.onrender.com/api/setter/create-token
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
POST https://landmanagemnet-backendv2.onrender.com/api/setter/request-plot-transfer
Content-Type: application/json

{
  "plotId": "1",
  "to": "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
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
POST https://landmanagemnet-backendv2.onrender.com/api/setter/request-parcel-transfer
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
POST https://landmanagemnet-backendv2.onrender.com/api/setter/approve-transfer-execution
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
POST https://landmanagemnet-backendv2.onrender.com/api/setter/plot-initiate
Content-Type: application/json

{
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
    "parcelIds": [101, 102, 103],
    "parcelAmounts": [1000, 800, 1200]
  },
  "message": "Plot initiated successfully"
}
```

---

# GET Endpoints Usage Guide

---

## 1. Get Land Information

**Why/When:** Get detailed information about a specific land token by its ID. Use this to display land details to users.

```
GET https://landmanagemnet-backendv2.onrender.com/api/getter/land/1
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
GET https://landmanagemnet-backendv2.onrender.com/api/getter/plot/1/info
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
GET https://landmanagemnet-backendv2.onrender.com/api/getter/plots
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
GET https://landmanagemnet-backendv2.onrender.com/api/getter/token/1/uri
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
GET https://landmanagemnet-backendv2.onrender.com/api/getter/transfer/1/status
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
GET https://landmanagemnet-backendv2.onrender.com/api/getter/plot-and-token-id-info
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
GET https://landmanagemnet-backendv2.onrender.com/api/get_plot/plot/1/parcel/101/shareholders
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
GET https://landmanagemnet-backendv2.onrender.com/api/get_plot/plot/1/parcel/101/user/0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0/shares
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
GET https://landmanagemnet-backendv2.onrender.com/api/get_plot/plot/1/parcel/101/total-shares
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
GET https://landmanagemnet-backendv2.onrender.com/api/get_plot/plot/1/user/0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0/parcels
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
GET https://landmanagemnet-backendv2.onrender.com/api/get_plot/plot/1/user/0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0/ownership
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

# Authentication Notes

- Most endpoints require proper authentication in production
- The transfer status endpoint specifically requires that only the sender of the request can access its status
- Delegate approval endpoints require specific role-based permissions
- Consider implementing proper authentication middleware for production use
