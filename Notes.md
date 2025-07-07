# API Endpoint Usage Guide

# Index of API Endpoints

## POST Endpoints

1. Set Plot Registry Contract Address

   - `/api/setter/set-plot-registry`
   - Set plot registry contract address during setup

2. Set Plot Ownership Contract Address

   - `/api/setter/set-plot-ownership`
   - Set plot ownership contract address during setup

3. Create Block Parcel Token
   - `/api/setter/create-token`
   - Create new land token with block/parcel info

## GET Endpoints

1. Get Plot and Token ID Info

   - `/api/getter/plot-and-token-id-info`
   - Retrieve current plot ID and token ID

2. Get Plot Parcel Shareholders

   - `/api/get_plot/plot/{plotId}/parcel/{parcelId}/shareholders`
   - Get all shareholders for a specific parcel

3. Get User Shares in Plot Parcel

   - `/api/get_plot/plot/{plotId}/parcel/{parcelId}/user/{address}/shares`
   - Get user's share count in a parcel

4. Get Plot Parcel Total Shares

   - `/api/get_plot/plot/{plotId}/parcel/{parcelId}/total-shares`
   - Get total shares for a parcel

5. Get User Parcels in Plot

   - `/api/get_plot/plot/{plotId}/user/{address}/parcels`
   - Get all parcels where user owns shares

6. Get User Ownership Percentage in Plot

   - `/api/get_plot/plot/{plotId}/user/{address}/ownership`
   - Get user's ownership percentage in plot

7. Get Transfer Request Status

   - `/api/getter/transfer/{requestId}/status`
   - Check status of a transfer request

8. Get Plots
   - `/api/getter/plots`
   - Retrieve all plots

---

## 1. Set Plot Registry Contract Address

**Why/When:** Use this to set the address of the plot registry contract in the main smart contract. Only needed by admin during setup or contract upgrade.

```
POST https://landmanagemnet-backend.onrender.com/api/setter/set-plot-registry
Content-Type: application/json

{
  "plotRegistryAddress": "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
}
```

**Conditions & Restrictions:**

- Can only be called by admin/contract owner
- Must be called immediately after contract deployment to set up the system

## 2. Set Plot Ownership Contract Address

**Why/When:** Use this to set the address of the plot ownership contract in the main smart contract. Only needed by admin during setup or contract upgrade.

```
POST https://landmanagemnet-backend.onrender.com/api/setter/set-plot-ownership
Content-Type: application/json

{
  "ownershipAddress": "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
}
```

**Conditions & Restrictions:**

- Can only be called by admin/contract owner
- Must be called immediately after contract deployment to set up the system

## 3. Create Block Parcel Token

**Why/When:** Use this to create a new land token with block and parcel information. Typically used by admin or authorized users to mint new tokens.

```
POST https://landmanagemnet-backend.onrender.com/api/setter/create-token
Content-Type: application/json

{
  "blockInfo": "Block A1",
  "parcelInfo": "Parcel P1",
  "tokenURI": "https://example.com/token/metadata/1",
  "totalSupply": "1000"
}
```

## 4. Request Whole Plot Transfer

**Why/When:** Use this to request the transfer of an entire plot from one address to another. Used by plot owners or authorized users to initiate a transfer.

```
POST https://landmanagemnet-backend.onrender.com/api/setter/request-plot-transfer
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

## 5. Request Parcel Transfer

**Why/When:** Use this to request the transfer of a parcel (or parcels) from one address to another inside a plot , for internal transfer parcel in that plot . Used by parcel owners or authorized users.

```
POST https://landmanagemnet-backend.onrender.com/api/setter/request-parcel-transfer
Content-Type: application/json

{
  "_parcelId": 101,
  "parcelAmount": 1000,
  "to": "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298",
  "_plotId": 1,
  "isPlotTransfer": true
}
```

## 6. Approve Transfer (Delegate)

**Why/When:** Use this to approve a transfer request as a delegated authority (Land Authority, Bank, or Lawyer). Each role has specific approval rights in the transfer process.

**Roles:**

- Land Authority = 1
- Bank Authority = 2
- Lawyer Authority = 3

```
POST https://landmanagemnet-backend.onrender.com/api/setter/approve-transfer
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

---

## 7. Finalize Parcel Transfer

**Why/When:** Use this to finalize a parcel transfer by its request ID. Called after all required approvals are complete.

```
POST https://landmanagemnet-backend.onrender.com/api/setter/finalize-parcel-transfer
Content-Type: application/json

{
  "requestId": 1
}
```

**Conditions & Restrictions:**

- Should be approved by all required authorities
- Should be one who requested for it

---

## 8. Finalize Plot Transfer

**Why/When:** Use this to finalize a plot transfer by its request ID. Called after all required approvals are complete.

```
POST https://landmanagemnet-backend.onrender.com/api/setter/finalize-plot-transfer
Content-Type: application/json

{
  "requestId": 1
}
```

**Conditions & Restrictions:**

- Should be approved by all required authorities
- Should be one who requested for it

---

## 9. Initiate a New Plot

**Why/When:** Use this to initiate a new plot with the given parcel IDs and parcel amounts. Used by admin or authorized users during plot creation.

```
POST https://landmanagemnet-backend.onrender.com/api/setter/plot-initiate
Content-Type: application/json

{
  "parcelIds": [101, 102, 103],
  "parcelAmounts": [1000, 800, 1200]
}
```

---

## 10. Finalize a Plot

**Why/When:** Use this to finalize a plot by its plot ID. Called after plot creation steps are complete.

```
POST https://landmanagemnet-backend.onrender.com/api/setter/plot-finalize
Content-Type: application/json

{
  "plotId": 1
}
```

---

# GET Endpoints Usage Guide

---

## 1. Get Treasury Wallet Address

**Why/When:** Retrieve the treasury wallet address from the smart contract. Useful for clients who need to know where fees or funds are collected.

```
GET https://landmanagemnet-backend.onrender.com/api/getter/get-treasury
Content-Type: application/json
```

---

## 2. Get Land Information

**Why/When:** Get detailed information about a specific land token by its ID. Use this to display land details to users.

```
GET https://landmanagemnet-backend.onrender.com/api/getter/land/1
Content-Type: application/json
```

---

## 3. Get Plot Account Information

**Why/When:** Retrieve detailed information about a specific plot account by its ID. Useful for showing plot composition and ownership.

```
GET https://landmanagemnet-backend.onrender.com/api/getter/plot/1/info
Content-Type: application/json
```

---

## 4. Get All Plots

**Why/When:** Get a list of all plots in the system. Use this to display available plots or for admin overviews.

```
GET https://landmanagemnet-backend.onrender.com/api/getter/plots
Content-Type: application/json
```

---

## 5. Get Token URI

**Why/When:** Retrieve the token URI for a specific land token. Use this to fetch metadata or images for a token.

```
GET https://landmanagemnet-backend.onrender.com/api/getter/token/1/uri
Content-Type: application/json
```

---

## 6. Get Transfer Request Status

**Why/When:** Check the status of a transfer request by its ID. Only the sender of the request can access its status. Use for tracking transfer progress.

```
GET https://landmanagemnet-backend.onrender.com/api/getter/transfer/1/status
Content-Type: application/json
```

---

## 7. Get Plot and Token ID Info

**Why/When:** Retrieve the current plot ID and token ID from the contract. Useful for admin or for creating new records.

```
GET https://landmanagemnet-backend.onrender.com/api/getter/plot-and-token-id-info
Content-Type: application/json
```

---

## 8. Get Plot Parcel Shareholders

**Why/When:** Get all shareholders for a specific parcel within a plot. Use this to display ownership breakdown for a parcel.

```
GET https://landmanagemnet-backend.onrender.com/api/get_plot/plot/1/parcel/101/shareholders
Content-Type: application/json
```

---

## 9. Get User Shares in Plot Parcel

**Why/When:** Retrieve the number of shares a specific user owns in a plot parcel. Use for user dashboards or ownership checks.

```
GET https://landmanagemnet-backend.onrender.com/api/get_plot/plot/1/parcel/101/user/0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0/shares
Content-Type: application/json
```

---

## 10. Get Plot Parcel Total Shares

**Why/When:** Get the total number of shares for a specific parcel within a plot. Useful for calculating ownership percentages.

```
GET https://landmanagemnet-backend.onrender.com/api/get_plot/plot/1/parcel/101/total-shares
Content-Type: application/json

```
