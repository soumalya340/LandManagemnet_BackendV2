const express = require("express");
const {
  initializeContract,
  getContract,
} = require("../utils/contractInstance");
const router = express.Router();

/**
 * @swagger
 * /api/get_plot/plot/{plotId}/parcel/{parcelId}/shareholders:
 *   get:
 *     summary: Get Plot Parcel Shareholders
 *     description: Retrieves all shareholders for a specific parcel within a plot
 *     tags: [Plot]
 *     parameters:
 *       - $ref: '#/components/parameters/PlotId'
 *       - name: parcelId
 *         in: path
 *         required: true
 *         description: The ID of the parcel
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 101
 *     responses:
 *       200:
 *         description: Plot parcel shareholders retrieved successfully
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
 *                     parcelId:
 *                       type: string
 *                       example: "101"
 *                     shareholders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/EthereumAddress'
 *                       example: ["0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0", "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"]
 *                     totalShareholders:
 *                       type: number
 *                       example: 2
 *                 message:
 *                   type: string
 *                   example: "Plot parcel shareholders retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/plot/:plotId/parcel/:parcelId/shareholders", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { plotId, parcelId } = req.params;
    const shareholders = await contract.getPlotAccountParcelShareholders(
      plotId,
      parcelId
    );

    res.json({
      success: true,
      data: {
        plotId,
        parcelId,
        shareholders,
        totalShareholders: shareholders.length,
      },
      message: "Plot parcel shareholders retrieved successfully",
    });
  } catch (error) {
    console.error(
      "Error in /api/plot/:plotId/parcel/:parcelId/shareholders:",
      error.message
    );
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch plot parcel shareholders",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/plot/:plotId/parcel/:parcelId/shareholders",
      },
    });
  }
});

/**
 * @swagger
 * /api/get_plot/plot/{plotId}/parcel/{parcelId}/user/{userAddress}/shares:
 *   get:
 *     summary: Get User Shares in Plot Parcel
 *     description: Retrieves the number of shares a specific user owns in a plot parcel
 *     tags: [Plot]
 *     parameters:
 *       - $ref: '#/components/parameters/PlotId'
 *       - name: parcelId
 *         in: path
 *         required: true
 *         description: The ID of the parcel
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 101
 *       - $ref: '#/components/parameters/EthereumAddressParam'
 *     responses:
 *       200:
 *         description: User shares in plot parcel retrieved successfully
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
 *                     parcelId:
 *                       type: string
 *                       example: "101"
 *                     userAddress:
 *                       $ref: '#/components/schemas/EthereumAddress'
 *                     shares:
 *                       type: string
 *                       example: "500"
 *                 message:
 *                   type: string
 *                   example: "User shares in plot parcel retrieved successfully"
 *       400:
 *         description: Bad request - invalid user address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/plot/:plotId/parcel/:parcelId/user/:userAddress/shares",
  async (req, res) => {
    try {
      let contract;
      try {
        contract = getContract();
      } catch (error) {
        await initializeContract();
        contract = getContract();
      }

      const { plotId, parcelId, userAddress } = req.params;

      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid user address format",
            details:
              "Address must be a valid 42-character hex string starting with 0x",
            timestamp: new Date().toISOString(),
            endpoint:
              "/api/plot/:plotId/parcel/:parcelId/user/:userAddress/shares",
          },
        });
      }

      const shares = await contract.getPlotAccountUserShares(
        plotId,
        parcelId,
        userAddress
      );

      res.json({
        success: true,
        data: {
          plotId,
          parcelId,
          userAddress,
          shares: shares.toString(),
        },
        message: "User shares in plot parcel retrieved successfully",
      });
    } catch (error) {
      console.error(
        "Error in /api/plot/:plotId/parcel/:parcelId/user/:userAddress/shares:",
        error.message
      );
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch user shares in plot parcel",
          details: error.message,
          timestamp: new Date().toISOString(),
          endpoint:
            "/api/plot/:plotId/parcel/:parcelId/user/:userAddress/shares",
        },
      });
    }
  }
);

/**
 * @swagger
 * /api/get_plot/plot/{plotId}/parcel/{parcelId}/total-shares:
 *   get:
 *     summary: Get Plot Parcel Total Shares
 *     description: Retrieves the total number of shares for a specific parcel within a plot
 *     tags: [Plot]
 *     parameters:
 *       - $ref: '#/components/parameters/PlotId'
 *       - name: parcelId
 *         in: path
 *         required: true
 *         description: The ID of the parcel
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 101
 *     responses:
 *       200:
 *         description: Plot parcel total shares retrieved successfully
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
 *                     parcelId:
 *                       type: string
 *                       example: "101"
 *                     totalShares:
 *                       type: string
 *                       example: "1000"
 *                 message:
 *                   type: string
 *                   example: "Plot parcel total shares retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/plot/:plotId/parcel/:parcelId/total-shares", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { plotId, parcelId } = req.params;
    const totalShares = await contract.getPlotAccountParcelTotalShares(
      plotId,
      parcelId
    );

    res.json({
      success: true,
      data: {
        plotId,
        parcelId,
        totalShares: totalShares.toString(),
      },
      message: "Plot parcel total shares retrieved successfully",
    });
  } catch (error) {
    console.error(
      "Error in /api/plot/:plotId/parcel/:parcelId/total-shares:",
      error.message
    );
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch plot parcel total shares",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/plot/:plotId/parcel/:parcelId/total-shares",
      },
    });
  }
});

/**
 * @swagger
 * /api/get_plot/plot/{plotId}/user/{userAddress}/parcels:
 *   get:
 *     summary: Get User Parcels in Plot
 *     description: Retrieves all parcels that a specific user owns shares in within a plot
 *     tags: [Plot]
 *     parameters:
 *       - $ref: '#/components/parameters/PlotId'
 *       - $ref: '#/components/parameters/EthereumAddressParam'
 *       - name: parcel
 *         in: query
 *         required: false
 *         description: Optional parcel ID filter
 *         schema:
 *           type: integer
 *           minimum: 0
 *           example: 101
 *     responses:
 *       200:
 *         description: User parcels in plot retrieved successfully
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
 *                     userAddress:
 *                       $ref: '#/components/schemas/EthereumAddress'
 *                     parcelFilter:
 *                       type: string
 *                       example: "0"
 *                     parcels:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["101", "102", "103"]
 *                     totalParcels:
 *                       type: number
 *                       example: 3
 *                 message:
 *                   type: string
 *                   example: "User parcels in plot retrieved successfully"
 *       400:
 *         description: Bad request - invalid user address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/plot/:plotId/user/:userAddress/parcels", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { plotId, userAddress } = req.params;
    const { parcel } = req.query; // Optional query parameter

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid user address format",
          details:
            "Address must be a valid 42-character hex string starting with 0x",
          timestamp: new Date().toISOString(),
          endpoint: "/api/plot/:plotId/user/:userAddress/parcels",
        },
      });
    }

    const userParcels = await contract.getPlotAccountUserParcels(
      plotId,
      userAddress,
      parcel || 0
    );

    res.json({
      success: true,
      data: {
        plotId,
        userAddress,
        parcelFilter: parcel || "0", // Shows what parcel filter was used
        parcels: userParcels.map((p) => p.toString()),
        totalParcels: userParcels.length,
      },
      message: "User parcels in plot retrieved successfully",
    });
  } catch (error) {
    console.error(
      "Error in /api/plot/:plotId/user/:userAddress/parcels:",
      error.message
    );
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch user parcels in plot",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/plot/:plotId/user/:userAddress/parcels",
      },
    });
  }
});

/**
 * @swagger
 * /api/get_plot/plot/{plotId}/user/{userAddress}/ownership:
 *   get:
 *     summary: Get User Ownership Percentage in Plot
 *     description: |
 *       Retrieves the ownership percentage of a specific user in a plot.
 *       The percentage is calculated based on the user's total shares compared to the plot's total shares.
 *     tags: [Plot]
 *     parameters:
 *       - $ref: '#/components/parameters/PlotId'
 *       - $ref: '#/components/parameters/EthereumAddressParam'
 *     responses:
 *       200:
 *         description: User ownership percentage in plot retrieved successfully
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
 *                     userAddress:
 *                       $ref: '#/components/schemas/EthereumAddress'
 *                     ownershipPercentage:
 *                       type: string
 *                       example: "2500"
 *                       description: "Ownership percentage in basis points (10000 = 100%)"
 *                     ownershipPercent:
 *                       type: string
 *                       example: "25.00%"
 *                       description: "Human-readable ownership percentage"
 *                 message:
 *                   type: string
 *                   example: "User ownership percentage in plot retrieved successfully"
 *       400:
 *         description: Bad request - invalid user address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/plot/:plotId/user/:userAddress/ownership", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { plotId, userAddress } = req.params;

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid user address format",
          details:
            "Address must be a valid 42-character hex string starting with 0x",
          timestamp: new Date().toISOString(),
          endpoint: "/api/plot/:plotId/user/:userAddress/ownership",
        },
      });
    }

    const ownershipPercentage = await contract.getOwnershipPercentage(
      plotId,
      userAddress
    );

    res.json({
      success: true,
      data: {
        plotId,
        userAddress,
        ownershipPercentage: ownershipPercentage.toString(),
        ownershipPercent: (Number(ownershipPercentage) / 100).toFixed(2) + "%", // Convert from basis points to percentage
      },
      message: "User ownership percentage in plot retrieved successfully",
    });
  } catch (error) {
    console.error(
      "Error in /api/plot/:plotId/user/:userAddress/ownership:",
      error.message
    );
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch user ownership percentage in plot",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/plot/:plotId/user/:userAddress/ownership",
      },
    });
  }
});

module.exports = router;
