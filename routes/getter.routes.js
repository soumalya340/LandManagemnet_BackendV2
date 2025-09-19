const express = require("express");
const {
  initializeContract,
  getContract,
} = require("../utils/contractInstance");
const {
  getAllLandInfo,
  getAllPlotAccountInfo,
  getAllTransferRequestInfo,
} = require("../utils/info");
const router = express.Router();

/**
 * Get Latest Token and Plot ID Info
 *
 * Why/When: Retrieve the current plot ID and token ID from the contract.
 * Useful for admin or for creating new records.
 *
 * Returns: Current plot ID and token ID counters from the smart contract
 */
router.get("/plot-and-token-id-info", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }
    console.log("The api is started fetching plot and token id info");
    const [plotId, tokenId] = await contract.getCurrentPlotAndTokenIdInfo();
    console.log("The api is finished fetching plot and token id info");
    res.json({
      success: true,
      data: {
        plotId: plotId.toString(),
        tokenId: tokenId.toString(),
      },
      message: "Plot and token ID info retrieved successfully",
    });
  } catch (error) {
    console.error(
      "Error in /api/getter/plot-and-token-id-info:",
      error.message
    );
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch plot and token ID info",
        details: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        endpoint: "/api/getter/plot-and-token-id-info",
      },
    });
  }
});

/**
 * Get Token URI of a specific land token
 *
 * Why/When: Retrieve the token URI for a specific land token.
 * Use this to fetch metadata or images for a token.
 *
 * Parameters:
 * - tokenId: The ID of the token to get URI for
 *
 * Returns: Token metadata URI for the specified token
 */
router.get("/token/:tokenId/uri", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { tokenId } = req.params;
    const uri = await contract.getBlockParcelTokenURI(tokenId);

    res.json({
      success: true,
      data: {
        tokenId,
        uri,
      },
      message: "Token URI retrieved successfully",
    });
  } catch (error) {
    console.error("Error in /api/token/:tokenId/uri:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch token URI",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/token/:tokenId/uri",
      },
    });
  }
});

/**
 * Get Land Information of a specific land token
 *
 * Why/When: Get detailed information about a specific land token by its ID.
 * Use this to display land details to users.
 *
 * Parameters:
 * - tokenId: The ID of the land token to retrieve information for
 *
 * Returns: Detailed land information including block info, parcel info,
 * token URI, total supply, and plot allocations
 */
router.get("/land/:tokenId", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }
    const { tokenId } = req.params;
    const landData = await contract.getLandInfo(tokenId);
    res.json({
      success: true,
      data: {
        tokenId,
        blockInfo: landData.blockInfo,
        parcelInfo: landData.parcelInfo,
        blockParcelTokenURI: landData.blockParcelTokenURI,
        totalSupply: landData.totalSupply.toString(),
        plotAllocation: landData.plotAllocation.map((allocation) =>
          allocation.toString()
        ),
      },
      message: "Land information retrieved successfully",
    });
  } catch (error) {
    console.error("Error in /api/land/:tokenId:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch land information",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/land/:tokenId",
      },
    });
  }
});

/**
 * Get Plot Account Information of a specific plot
 *
 * Why/When: Retrieve detailed information about a specific plot account by its ID.
 * Useful for showing plot composition and ownership.
 *
 * Parameters:
 * - plotId: The ID of the plot to retrieve information for
 *
 * Returns: Plot account details including plot account address, parcel IDs,
 * and parcel amounts
 */
router.get("/plot/:plotId/info", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { plotId } = req.params;
    const plotInfo = await contract.getPlotAccountInfo(plotId);

    res.json({
      success: true,
      data: {
        plotId,
        plotAccount: plotInfo.plotAccount,
        parcelIds: plotInfo.parcelIds.map((id) => id.toString()),
        parcelAmounts: plotInfo.parcelAmounts.map((amount) =>
          amount.toString()
        ),
      },
      message: "Plot account information retrieved successfully",
    });
  } catch (error) {
    console.error("Error in /api/plot/:plotId/info:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch plot account information",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/plot/:plotId/info",
      },
    });
  }
});

/**
 * Get Transfer Request Status of a specific request
 *
 * Why/When: Check the status of a transfer request by its ID.
 * Only the sender of the request can access its status. Use for tracking transfer progress.
 *
 * Parameters:
 * - requestId: The ID of the transfer request to check status for
 *
 * Security: Only the sender of the request can access its status.
 * Implement proper authentication before using this in production.
 *
 * Returns: Transfer request details including from/to addresses, amounts,
 * approvals, and current status
 */
router.get("/transfer/:requestId/status", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { requestId } = req.params;

    // WARNING: The contract function has a requirement that only the sender can access
    // You should implement proper authentication before using this in production
    const requestData = await contract.requestStatus(requestId);

    res.json({
      success: true,
      data: {
        requestId,
        from: requestData.from,
        to: requestData.to,
        parcelId: requestData.parcelId.toString(),
        parcelAmount: requestData.parcelAmount.toString(),
        isPlotTransfer: requestData.isPlotTransfer,
        plotId: requestData.plotId.toString(),
        timestamp: requestData.timestamp.toString(),
        status: requestData.status.toString(),
        landAuthorityApproved: requestData.landAuthorityApproved.toString(),
        lawyerApproved: requestData.lawyerApproved.toString(),
        bankApproved: requestData.bankApproved.toString(),
      },
      message: "Transfer request status retrieved successfully",
      warning: "This endpoint should have authentication in production",
    });
  } catch (error) {
    console.error("Error in /api/transfer/:requestId/status:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch transfer request status",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/transfer/:requestId/status",
        note: "This may fail if you're not the sender of the request",
      },
    });
  }
});

/**
 * Get All Plots Information (Enhanced)
 *
 * Why/When: Get comprehensive information about all plots in the blockchain.
 *
 * Returns: All plot account information with proper BigInt handling and
 * consistent data formatting including plot accounts, names, parcel IDs, and amounts
 */
router.get("/all-plots-info", async (req, res) => {
  try {
    const plotInfoJson = await getAllPlotAccountInfo();
    const plotInfo = JSON.parse(plotInfoJson);

    if (plotInfo.success) {
      res.json(plotInfo);
    } else {
      res.status(500).json(plotInfo);
    }
  } catch (error) {
    console.error("Error in /api/all-plots-info:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch plots list",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/all-plots-info",
      },
    });
  }
});

/**
 * Get All Land Information (Enhanced)
 *
 * Why/When: Get comprehensive information about all land tokens in the blockchain.
 *
 *
 * Returns: All land information with proper BigInt handling including
 * block info, parcel info, token URIs, supplies, and plot allocations
 */
router.get("/all-land-info", async (req, res) => {
  try {
    const landInfoJson = await getAllLandInfo();
    const landInfo = JSON.parse(landInfoJson);

    if (landInfo.success) {
      res.json(landInfo);
    } else {
      res.status(500).json(landInfo);
    }
  } catch (error) {
    console.error("Error in /api/all-land-info:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch land information",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/all-land-info",
      },
    });
  }
});

/**
 * Get All Transfer Requests (Enhanced)
 *
 * Why/When: Get comprehensive information about all transfer requests in the blockchain.
 *
 *
 * Returns: All transfer request information with proper BigInt handling including
 * from/to addresses, amounts, approvals, and status for all requests
 */
router.get("/all-transfer-requests", async (req, res) => {
  try {
    const requestInfoJson = await getAllTransferRequestInfo();
    const requestInfo = JSON.parse(requestInfoJson);

    if (requestInfo.success) {
      res.json(requestInfo);
    } else {
      res.status(500).json(requestInfo);
    }
  } catch (error) {
    console.error("Error in /api/all-transfer-requests:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch transfer requests",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/all-transfer-requests",
      },
    });
  }
});

module.exports = router;
