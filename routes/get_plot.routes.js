const express = require("express");
const {
  initializeContract,
  getContract,
} = require("../utils/contractInstance");
const router = express.Router();

/**
 * Get Plot Parcel Shareholders
 *
 * Why/When: Get all shareholders for a specific parcel within a plot.
 * Use this to display ownership breakdown for a parcel.
 *
 * Parameters:
 * - plotId: The ID of the plot containing the parcel
 * - parcelId: The ID of the parcel to get shareholders for
 *
 * Returns: List of all shareholder addresses for the specified parcel
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
 * Get User Shares in Plot Parcel
 *
 * Why/When: Retrieve the number of shares a specific user owns in a plot parcel.
 * Use for user dashboards or ownership checks.
 *
 * Parameters:
 * - plotId: The ID of the plot containing the parcel
 * - parcelId: The ID of the parcel to check shares for
 * - userAddress: The Ethereum address of the user to check shares for
 *
 * Validation: Validates Ethereum address format (42-character hex string starting with 0x)
 *
 * Returns: Number of shares the user owns in the specified parcel
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
        userAddress.toLowerCase()
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
 * Get Plot Parcel Total Shares
 *
 * Why/When: Get the total number of shares for a specific parcel within a plot.
 * Useful for calculating ownership percentages.
 *
 * Parameters:
 * - plotId: The ID of the plot containing the parcel
 * - parcelId: The ID of the parcel to get total shares for
 *
 * Returns: Total number of shares for the specified parcel
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
 * Get User Parcels in Plot
 *
 * Why/When: Get all parcels that a specific user owns shares in within a plot.
 * Use for user dashboards or ownership overviews.
 *
 * Parameters:
 * - plotId: The ID of the plot to check user parcels in
 * - userAddress: The Ethereum address of the user to check parcels for
 *
 * Validation:
 * - Validates plotId is a valid positive number
 * - Validates Ethereum address format (42-character hex string starting with 0x)
 *
 * Returns: List of all parcel IDs where the user owns shares in the specified plot
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

    // Validate plotId is a valid number
    const plotIdNumber = parseInt(plotId);
    if (isNaN(plotIdNumber) || plotIdNumber < 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid plot ID format",
          details: "Plot ID must be a valid positive number",
          timestamp: new Date().toISOString(),
          endpoint: "/api/plot/:plotId/user/:userAddress/parcels",
        },
      });
    }

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
      plotIdNumber,
      userAddress.toLowerCase()
    );

    res.json({
      success: true,
      data: {
        plotId: plotIdNumber,
        userAddress,
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
 * Get User Ownership Percentage in Plot
 *
 * Why/When: Retrieve the ownership percentage of a specific user in a plot.
 * The percentage is calculated based on the user's total shares compared to the plot's total shares.
 *
 * Parameters:
 * - plotId: The ID of the plot to check ownership in
 * - userAddress: The Ethereum address of the user to check ownership for
 *
 * Validation: Validates Ethereum address format (42-character hex string starting with 0x)
 *
 * Returns: User's ownership percentage in the plot (both raw value and formatted percentage)
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
      userAddress.toLowerCase()
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
