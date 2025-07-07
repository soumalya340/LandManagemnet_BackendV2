const express = require("express");
const {
  initializeContract,
  getContract,
} = require("../utils/contractInstance");
const router = express.Router();

/**
 * @swagger
 * /api/getter/get-treasury:
 *   get:
 *     summary: Get Treasury Wallet Address
 *     description: Retrieves the treasury wallet address from the smart contract
 *     tags: [Treasury]
 *     responses:
 *       200:
 *         description: Treasury wallet address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     treasuryWallet:
 *                       type: string
 *                       pattern: "^0x[a-fA-F0-9]{40}$"
 *                       example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                     fetchedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     blockchainCall:
 *                       type: string
 *                       example: "treasuryWallet()"
 *                 message:
 *                   type: string
 *                   example: "Treasury wallet address retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Operation failed"
 *                     details:
 *                       type: string
 *                       example: "Detailed error description"
 *                     code:
 *                       type: string
 *                       example: "CALL_EXCEPTION"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     endpoint:
 *                       type: string
 *                       example: "/api/getter/endpoint"
 */
router.get("/get-treasury", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }
    // This is the actual blockchain call - similar to your getTreasuryWallet function
    const treasuryWallet = await contract.treasuryWallet();

    // Prepare response data with additional useful information
    const responseData = {
      success: true,
      data: {
        treasuryWallet: treasuryWallet.toString(),
        fetchedAt: new Date().toISOString(),
        blockchainCall: "treasuryWallet()",
      },
      message: "Treasury wallet address retrieved successfully",
    };

    // Send JSON response back to client
    res.json(responseData);
  } catch (error) {
    console.error("Error in /api/get-treasury:", error.message);

    // Send error response with helpful debugging information
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch treasury wallet",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/get-treasury",
      },
    });
  }
});

/**
 * @swagger
 * /api/getter/land/{tokenId}:
 *   get:
 *     summary: Get Land Information
 *     description: Retrieves detailed information about a specific land token by its ID
 *     tags: [Land]
 *     parameters:
 *       - name: tokenId
 *         in: path
 *         required: true
 *         description: The ID of the land token
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Land information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokenId:
 *                       type: string
 *                       example: "1"
 *                     blockInfo:
 *                       type: string
 *                       example: "Block A1"
 *                     parcelInfo:
 *                       type: string
 *                       example: "Parcel P1"
 *                     blockParcelTokenURI:
 *                       type: string
 *                       example: "https://example.com/token/1"
 *                     totalSupply:
 *                       type: string
 *                       example: "1000"
 *                     plotAllocation:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["100", "200", "300"]
 *                 message:
 *                   type: string
 *                   example: "Land information retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Operation failed"
 *                     details:
 *                       type: string
 *                       example: "Detailed error description"
 *                     code:
 *                       type: string
 *                       example: "CALL_EXCEPTION"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     endpoint:
 *                       type: string
 *                       example: "/api/getter/endpoint"
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
 * @swagger
 * /api/getter/plot/{plotId}/info:
 *   get:
 *     summary: Get Plot Account Information
 *     description: Retrieves detailed information about a specific plot account by its ID
 *     tags: [Plot]
 *     parameters:
 *       - $ref: '#/components/parameters/PlotId'
 *     responses:
 *       200:
 *         description: Plot account information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     plotId:
 *                       type: string
 *                       example: "1"
 *                     plotAccount:
 *                       type: string
 *                       example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                     parcelIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["101", "102", "103"]
 *                     parcelAmounts:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["1000", "800", "1200"]
 *                 message:
 *                   type: string
 *                   example: "Plot account information retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Operation failed"
 *                     details:
 *                       type: string
 *                       example: "Detailed error description"
 *                     code:
 *                       type: string
 *                       example: "CALL_EXCEPTION"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     endpoint:
 *                       type: string
 *                       example: "/api/getter/endpoint"
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
 * @swagger
 * /api/getter/plots:
 *   get:
 *     summary: Get All Plots
 *     description: Retrieves a list of all plots in the system
 *     tags: [Plot]
 *     responses:
 *       200:
 *         description: List of all plots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     plots:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["1", "2", "3"]
 *                     totalPlots:
 *                       type: number
 *                       example: 3
 *                 message:
 *                   type: string
 *                   example: "List of all plots retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Operation failed"
 *                     details:
 *                       type: string
 *                       example: "Detailed error description"
 *                     code:
 *                       type: string
 *                       example: "CALL_EXCEPTION"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     endpoint:
 *                       type: string
 *                       example: "/api/getter/endpoint"
 */
router.get("/plots", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const plots = await contract.getListOfTotalPlots();

    res.json({
      success: true,
      data: {
        plots,
        totalPlots: plots.length,
      },
      message: "List of all plots retrieved successfully",
    });
  } catch (error) {
    console.error("Error in /api/plots:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch plots list",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/plots",
      },
    });
  }
});

/**
 * @swagger
 * /api/getter/token/{tokenId}/uri:
 *   get:
 *     summary: Get Token URI
 *     description: Retrieves the token URI for a specific land token
 *     tags: [Token]
 *     parameters:
 *       - $ref: '#/components/parameters/TokenId'
 *     responses:
 *       200:
 *         description: Token URI retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokenId:
 *                       type: string
 *                       example: "1"
 *                     uri:
 *                       type: string
 *                       example: "https://example.com/token/1"
 *                 message:
 *                   type: string
 *                   example: "Token URI retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Operation failed"
 *                     details:
 *                       type: string
 *                       example: "Detailed error description"
 *                     code:
 *                       type: string
 *                       example: "CALL_EXCEPTION"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     endpoint:
 *                       type: string
 *                       example: "/api/getter/endpoint"
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
 * @swagger
 * /api/getter/transfer/{requestId}/status:
 *   get:
 *     summary: Get Transfer Request Status
 *     description: |
 *       Retrieves the status of a transfer request by its ID.
 *
 *       ⚠️ **Important**: This endpoint has authentication requirements in the smart contract - only the sender of the request can access its status.
 *     tags: [Transfer]
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         description: The ID of the transfer request
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Transfer request status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: string
 *                       example: "1"
 *                     from:
 *                       type: string
 *                       pattern: "^0x[a-fA-F0-9]{40}$"
 *                       example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                     to:
 *                       type: string
 *                       pattern: "^0x[a-fA-F0-9]{40}$"
 *                       example: "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
 *                     parcelId:
 *                       type: string
 *                       example: "101"
 *                     parcelAmount:
 *                       type: string
 *                       example: "1000"
 *                     isPlotTransfer:
 *                       type: boolean
 *                       example: false
 *                     plotId:
 *                       type: string
 *                       example: "0"
 *                     timestamp:
 *                       type: string
 *                       example: "1642250000"
 *                     status:
 *                       type: number
 *                       example: 1
 *                     landAuthorityApproved:
 *                       type: boolean
 *                       example: true
 *                     lawyerApproved:
 *                       type: boolean
 *                       example: false
 *                     bankApproved:
 *                       type: boolean
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "Transfer request status retrieved successfully"
 *                 warning:
 *                   type: string
 *                   example: "This endpoint should have authentication in production"
 *       500:
 *         description: Internal server error or access denied
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     error:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "Operation failed"
 *                         details:
 *                           type: string
 *                           example: "Detailed error description"
 *                         code:
 *                           type: string
 *                           example: "CALL_EXCEPTION"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         endpoint:
 *                           type: string
 *                           example: "/api/getter/endpoint"
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: object
 *                       properties:
 *                         note:
 *                           type: string
 *                           example: "This may fail if you're not the sender of the request"
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
 * @swagger
 * /api/getter/plot-and-token-id-info:
 *   get:
 *     summary: Get Plot and Token ID Info
 *     description: Retrieves the plot ID and token ID from the contract.
 *     tags: [Token]
 *     responses:
 *       200:
 *         description: Plot and token ID info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     plotId:
 *                       type: string
 *                       example: "1"
 *                     tokenId:
 *                       type: string
 *                       example: "1001"
 *                 message:
 *                   type: string
 *                   example: "Plot and token ID info retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Operation failed"
 *                     details:
 *                       type: string
 *                       example: "Detailed error description"
 *                     code:
 *                       type: string
 *                       example: "CALL_EXCEPTION"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     endpoint:
 *                       type: string
 *                       example: "/api/getter/plot-and-token-id-info"
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
    const [plotId, tokenId] = await contract.getPlotAndTokenIdInfo();
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

module.exports = router;
