const express = require("express");
const {
  initializeContract,
  getContract,
} = require("../utils/contractInstance");
const {
  insertBlockParcelInfo,
  syncBlockParcelWithBlockchain,
  checkBlockParcelTableExists,
} = require("../db/blockparcel");
const {
  insertPlot,
  checkPlotNameExists,
  checkPlotTableExists,
  syncPlotsWithBlockchain,
  updatePlotOwner,
} = require("../db/plots");
const {
  insertRequest,
  checkRequestExists,
  updateRequestStatus,
  syncRequestsWithBlockchain,
  checkRequestTableExists,
} = require("../db/request");
const {
  getRequestStatus,
  getPlotOwner,
  getAllLandInfo,
  getAllPlotAccountInfo,
} = require("../utils/info");

const router = express.Router();

router.post("/create-token", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { blockInfo, parcelInfo, tokenURI, totalSupply } = req.body;

    // Validate required fields
    if (!blockInfo || !parcelInfo || !tokenURI || !totalSupply) {
      return res.status(400).json({
        success: false,
        error: {
          message: "All fields are required",
          details:
            "Please provide blockInfo, parcelInfo, tokenURI, and totalSupply",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/create-token",
        },
      });
    }

    const tx = await contract.createBlockParcelToken(
      blockInfo,
      parcelInfo,
      tokenURI,
      totalSupply
    );
    const receipt = await tx.wait();

    // Parse events to get token ID
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed.name === "TokenCreated") {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch (e) {
        // Skip unparseable logs
      }
    }

    // Check if blockparcel table exists and sync if needed, then save to database
    try {
      console.log("Checking if blockparcel table exists...");
      const tableExists = await checkBlockParcelTableExists();

      if (tableExists) {
        console.log("Blockparcel table exists");
      } else {
        console.log("Blockparcel table does not exist");
        console.log("Syncing blockparcel data with blockchain...");
        await syncBlockParcelWithBlockchain();
      }

      // Insert the new record
      await insertBlockParcelInfo({
        token_id: parseInt(tokenId),
        parcel_name: parcelInfo,
        block_name: blockInfo,
        total_supply: totalSupply.toString(),
        metadata: tokenURI.toString(),
      });
    } catch (dbError) {
      console.error("Database insertion error:", dbError.message);
    }

    console.log("The Db Insertion was successful");

    res.json({
      success: true,
      data: {
        tokenId,
        blockInfo,
        parcelInfo,
        tokenURI,
        totalSupply: totalSupply.toString(),
        transaction: {
          hash: tx.hash,
          gasUsed: receipt.gasUsed?.toString(),
          status: receipt.status,
        },
        confirmedAt: new Date().toISOString(),
      },
      message: "Block parcel token created successfully",
    });
  } catch (error) {
    console.error("Error in /api/setter/create-token:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to create block parcel token",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/setter/create-token",
      },
    });
  }
});

router.post("/request-plot-transfer", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { plotId, to } = req.body;

    if (!plotId || !to) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Plot ID and recipient address are required",
          details: "Please provide 'plotId' and 'to' in request body",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/request-plot-transfer",
        },
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid recipient address format",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/request-plot-transfer",
        },
      });
    }

    const tx = await contract.requestForWholePlotTransfer(plotId, to);
    const receipt = await tx.wait();

    // Parse events to get request ID
    let requestId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed.name === "TransferRequestCreated") {
          requestId = parsed.args.requestId.toString();
          break;
        }
      } catch (e) {
        // Skip unparseable logs
      }
    }

    // Check if request table exists and sync if needed, then save request to database
    try {
      console.log("Checking if request table exists...");
      const tableExists = await checkRequestTableExists();

      if (tableExists) {
        console.log("Request table exists");
      } else {
        console.log("Request table does not exist");
        console.log("Syncing request data with blockchain...");
        await syncRequestsWithBlockchain();
      }

      // Insert the new request
      await insertRequest({
        request_id: parseInt(requestId),
        plot_id: parseInt(plotId),
        is_plot: true, // This is a plot transfer
        land_authority: false,
        lawyer: false,
        bank: false,
        current_status: "PENDING",
      });
      console.log("Request inserted into database:", requestId);

      res.json({
        success: true,
        data: {
          requestId,
          plotId,
          to,
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          confirmedAt: new Date().toISOString(),
        },
        message: "Plot transfer request created successfully",
      });
    } catch (dbError) {
      console.error("Database error:", dbError.message);
      res.status(207).json({
        success: true,
        warning: "Transaction successful but database update failed",
        data: {
          requestId,
          plotId,
          to,
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          dbError: dbError.message,
        },
        message: "Plot transfer request created but database update failed",
      });
    }
  } catch (error) {
    console.error("Error in /api/setter/request-plot-transfer:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to request plot transfer",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/setter/request-plot-transfer",
      },
    });
  }
});

// REQUEST FOR PARCEL INSIDE PLOT TRANSFER
router.post("/request-parcel-transfer", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { _parcelId, parcelAmount, to, _plotId } = req.body;

    // Input validation
    if (
      typeof _parcelId !== "number" ||
      typeof parcelAmount !== "number" ||
      typeof _plotId !== "number" ||
      !to
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message: "All fields are required and must be of correct type",
          details:
            "Please provide _parcelId (number), parcelAmount (number), to (address), _plotId (number)",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/request-parcel-transfer",
        },
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid recipient address format",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/request-parcel-transfer",
        },
      });
    }

    const tx = await contract.requestForParcelTransfer(
      _parcelId,
      parcelAmount,
      to,
      _plotId
    );
    const receipt = await tx.wait();

    // Parse events to get request ID
    let requestId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed.name === "TransferRequestCreated") {
          requestId = parsed.args.requestId.toString();
          break;
        }
      } catch (e) {
        // Skip unparseable logs
      }
    }

    // Check if request table exists and sync if needed, then save request to database
    try {
      console.log("Checking if request table exists...");
      const tableExists = await checkRequestTableExists();

      if (tableExists) {
        console.log("Request table exists");
      } else {
        console.log("Request table does not exist");
        console.log("Syncing request data with blockchain...");
        await syncRequestsWithBlockchain();
      }

      // Insert the new request
      await insertRequest({
        request_id: parseInt(requestId),
        plot_id: parseInt(_plotId),
        is_plot: false, // This is a parcel transfer
        land_authority: false,
        lawyer: false,
        bank: false,
        current_status: "PENDING",
      });
      console.log("Parcel transfer request inserted into database:", requestId);

      res.json({
        success: true,
        data: {
          requestId,
          _parcelId,
          parcelAmount,
          to,
          _plotId,
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          confirmedAt: new Date().toISOString(),
        },
        message: "Parcel transfer request created successfully",
      });
    } catch (dbError) {
      console.error("Database error:", dbError.message);
      res.status(207).json({
        success: true,
        warning: "Transaction successful but database update failed",
        data: {
          requestId,
          _parcelId,
          parcelAmount,
          to,
          _plotId,
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          dbError: dbError.message,
        },
        message: "Parcel transfer request created but database update failed",
      });
    }
  } catch (error) {
    console.error(
      "Error in /api/setter/request-parcel-transfer:",
      error.message
    );
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to request parcel transfer",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/setter/request-parcel-transfer",
      },
    });
  }
});

router.post("/approve-transfer-execution", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { signerWallet, requestId, role } = req.body;

    if (!signerWallet || !requestId || role === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          message: "All fields are required",
          details: "Please provide signerWallet, requestId, and role",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/approve-transfer",
        },
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(signerWallet)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid signer wallet address format",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/approve-transfer",
        },
      });
    }

    // Validate role (1 = Land Authority, 2 = Bank, 3 = Lawyer)
    if (![1, 2, 3].includes(parseInt(role))) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid role",
          details: "Role must be 1 (Land Authority), 2 (Bank), or 3 (Lawyer)",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/approve-transfer",
        },
      });
    }

    const signerWalletLower = signerWallet.toLowerCase();
    console.log("signerWalletLower", signerWalletLower);
    console.log("requestId", requestId);
    console.log("role", role);

    // Check if request exists in database
    const existingRequest = await checkRequestExists(parseInt(requestId));
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Transfer request not found",
          details: "No plot transfer request found with this ID",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/approve-transfer",
        },
      });
    }

    // Get initial plot owner before transaction
    console.log("Getting initial plot owner...");
    const initialPlotOwnerJson = await getPlotOwner(existingRequest.plot_id);
    const initialPlotOwnerData = JSON.parse(initialPlotOwnerJson);
    const initialPlotOwner = initialPlotOwnerData.success
      ? initialPlotOwnerData.data.plotOwner
      : null;
    console.log("Initial plot owner:", initialPlotOwner);

    const tx = await contract.delegateApproveAndTransfer(
      signerWalletLower,
      requestId,
      role
    );
    const receipt = await tx.wait();

    // Check if request table exists and sync if needed, then update request status in database
    try {
      console.log("Checking if request table exists...");
      const tableExists = await checkRequestTableExists();

      if (tableExists) {
        console.log("Request table exists");
      } else {
        console.log("Request table does not exist");
        console.log("Syncing request data with blockchain...");
        await syncRequestsWithBlockchain();
      }

      // Update the request status
      await updateRequestStatus(parseInt(requestId), parseInt(role));
    } catch (dbError) {
      console.error("Database update error:", dbError.message);
      // Continue with response as transaction was successful
    }

    // Check if all approvals are complete and update plot owner if needed
    try {
      console.log("Checking request status for all approvals...");
      const requestStatusJson = await getRequestStatus(parseInt(requestId));
      const requestStatusData = JSON.parse(requestStatusJson);

      if (requestStatusData.success) {
        const { landAuthorityApproved, lawyerApproved, bankApproved } =
          requestStatusData.data;

        // Check if all 3 approvals are true
        if (landAuthorityApproved && lawyerApproved && bankApproved) {
          console.log(
            "All approvals completed! Checking for plot owner change..."
          );

          // Get current plot owner
          const currentPlotOwnerJson = await getPlotOwner(
            existingRequest.plot_id
          );
          const currentPlotOwnerData = JSON.parse(currentPlotOwnerJson);
          const currentPlotOwner = currentPlotOwnerData.success
            ? currentPlotOwnerData.data.plotOwner
            : null;

          console.log("Current plot owner:", currentPlotOwner);

          // Compare initial vs current plot owner
          if (
            initialPlotOwner &&
            currentPlotOwner &&
            initialPlotOwner !== currentPlotOwner
          ) {
            console.log(
              `Plot owner changed from ${initialPlotOwner} to ${currentPlotOwner}`
            );
            console.log("Updating plot owner in database...");

            // Update plot owner in database
            await updatePlotOwner(existingRequest.plot_id, currentPlotOwner);
            console.log("Plot owner updated successfully in database");
          } else {
            console.log("Plot owner unchanged or data unavailable");
          }
        } else {
          console.log("Not all approvals completed yet");
        }
      } else {
        console.error("Failed to get request status:", requestStatusData.error);
      }
    } catch (ownerUpdateError) {
      console.error(
        "Error checking/updating plot owner:",
        ownerUpdateError.message
      );
      // Continue with response as transaction was successful
    }

    const roleNames = { 1: "Land Authority", 2: "Bank", 3: "Lawyer" };

    res.json({
      success: true,
      data: {
        signerWallet,
        requestId,
        role: parseInt(role),
        roleName: roleNames[parseInt(role)],
        transaction: {
          hash: tx.hash,
          gasUsed: receipt.gasUsed?.toString(),
          status: receipt.status,
        },
        confirmedAt: new Date().toISOString(),
      },
      message: `Transfer approved by ${roleNames[parseInt(role)]} successfully`,
    });
  } catch (error) {
    console.error("Error in /api/setter/approve-transfer:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to approve transfer",
        details: error.message,
        timestamp: new Date().toISOString(),
        endpoint: "/api/setter/approve-transfer",
      },
    });
  }
});

router.post("/request-transfer-using-names", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { transferPlot, blockName, parcelName, parcelAmount, to, plotName } =
      req.body;

    // Validate recipient address
    if (!to || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Valid recipient address is required",
          details: "Please provide a valid Ethereum address in 'to' field",
          code: "INVALID_ADDRESS",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/request-transfer-using-names",
        },
      });
    }

    // Validate transferPlot flag
    if (typeof transferPlot !== "boolean") {
      return res.status(400).json({
        success: false,
        error: {
          message: "transferPlot must be a boolean value",
          details:
            "Please provide true for plot transfer or false for parcel transfer",
          code: "INVALID_INPUT",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/request-transfer-using-names",
        },
      });
    }

    let plotId, parcelId, requestId;

    // Handle whole plot transfer
    if (transferPlot) {
      // Validate plotName is provided
      if (!plotName) {
        return res.status(400).json({
          success: false,
          error: {
            message: "plotName is required for plot transfer",
            details: "Please provide the plot name when transferPlot is true",
            code: "MISSING_PLOT_NAME",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/request-transfer-using-names",
          },
        });
      }

      console.log("Fetching all plots information from blockchain...");
      const plotInfoJson = await getAllPlotAccountInfo();
      const plotInfoData = JSON.parse(plotInfoJson);

      if (!plotInfoData.success) {
        return res.status(500).json({
          success: false,
          error: {
            message: "Failed to fetch plot information from blockchain",
            details: plotInfoData.error,
            code: "BLOCKCHAIN_FETCH_ERROR",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/request-transfer-using-names",
          },
        });
      }

      // Find matching plot by name
      const plotInfo = plotInfoData.data;
      let foundPlot = false;

      for (let i = 0; i < plotInfo.length; i++) {
        const plotKey = Object.keys(plotInfo[i])[0];
        const plot = plotInfo[i][plotKey];

        if (plot.plotName === plotName) {
          plotId = i + 1; // Plot ID is index + 1
          foundPlot = true;
          console.log(`Found plot: ${plotName} with ID: ${plotId}`);
          break;
        }
      }

      if (!foundPlot) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Plot name not found on blockchain",
            details: `No plot found with name '${plotName}'`,
            code: "PLOT_NOT_FOUND",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/request-transfer-using-names",
          },
        });
      }

      // Execute whole plot transfer request
      console.log(`Requesting whole plot transfer for plot ${plotId} to ${to}`);
      const tx = await contract.requestForWholePlotTransfer(plotId, to);
      const receipt = await tx.wait();

      // Parse events to get request ID
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === "TransferRequestCreated") {
            requestId = parsed.args.requestId.toString();
            break;
          }
        } catch (e) {
          // Skip unparseable logs
        }
      }

      // Save request to database
      try {
        console.log("Checking if request table exists...");
        const tableExists = await checkRequestTableExists();

        if (!tableExists) {
          console.log("Request table does not exist. Syncing...");
          await syncRequestsWithBlockchain();
        }

        await insertRequest({
          request_id: parseInt(requestId),
          plot_id: parseInt(plotId),
          is_plot: true,
          land_authority: false,
          lawyer: false,
          bank: false,
          current_status: "PENDING",
        });
        console.log("Request inserted into database:", requestId);
      } catch (dbError) {
        console.error("Database error:", dbError.message);
      }

      return res.json({
        success: true,
        data: {
          requestId,
          transferType: "PLOT_TRANSFER",
          plotName,
          plotId: plotId.toString(),
          to,
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          confirmedAt: new Date().toISOString(),
        },
        message: "Plot transfer request created successfully using plot name",
      });
    }
    // Handle parcel transfer
    else {
      // Validate required fields for parcel transfer
      if (!blockName || !parcelName || !parcelAmount || !plotName) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields for parcel transfer",
            details:
              "Please provide blockName, parcelName, parcelAmount, and plotName when transferPlot is false",
            code: "MISSING_PARCEL_INFO",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/request-transfer-using-names",
          },
        });
      }

      console.log("Fetching all land information from blockchain...");
      const landInfoJson = await getAllLandInfo();
      const landInfoData = JSON.parse(landInfoJson);

      if (!landInfoData.success) {
        return res.status(500).json({
          success: false,
          error: {
            message: "Failed to fetch land information from blockchain",
            details: landInfoData.error,
            code: "BLOCKCHAIN_FETCH_ERROR",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/request-transfer-using-names",
          },
        });
      }

      // Find matching parcel by block and parcel name
      const landInfo = landInfoData.data;
      let foundParcel = false;

      for (let i = 0; i < landInfo.length; i++) {
        const landKey = Object.keys(landInfo[i])[0];
        const land = landInfo[i][landKey];

        if (land.blockInfo === blockName && land.parcelInfo === parcelName) {
          parcelId = i + 1; // Token ID is index + 1
          foundParcel = true;
          console.log(
            `Found parcel: ${blockName} - ${parcelName} with ID: ${parcelId}`
          );
          break;
        }
      }

      if (!foundParcel) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Parcel not found on blockchain",
            details: `No parcel found with blockName '${blockName}' and parcelName '${parcelName}'`,
            code: "PARCEL_NOT_FOUND",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/request-transfer-using-names",
          },
        });
      }

      // Find plot ID by plot name
      console.log("Fetching plot information...");
      const plotInfoJson = await getAllPlotAccountInfo();
      const plotInfoData = JSON.parse(plotInfoJson);

      if (!plotInfoData.success) {
        return res.status(500).json({
          success: false,
          error: {
            message: "Failed to fetch plot information from blockchain",
            details: plotInfoData.error,
            code: "BLOCKCHAIN_FETCH_ERROR",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/request-transfer-using-names",
          },
        });
      }

      const plotInfo = plotInfoData.data;
      let foundPlot = false;

      for (let i = 0; i < plotInfo.length; i++) {
        const plotKey = Object.keys(plotInfo[i])[0];
        const plot = plotInfo[i][plotKey];

        if (plot.plotName === plotName) {
          plotId = i + 1;
          foundPlot = true;
          console.log(`Found plot: ${plotName} with ID: ${plotId}`);
          break;
        }
      }

      if (!foundPlot) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Plot name not found on blockchain",
            details: `No plot found with name '${plotName}'`,
            code: "PLOT_NOT_FOUND",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/request-transfer-using-names",
          },
        });
      }

      // Execute parcel transfer request
      console.log(
        `Requesting parcel transfer for parcel ${parcelId}, amount ${parcelAmount}, plot ${plotId} to ${to}`
      );
      const tx = await contract.requestForParcelTransfer(
        parcelId,
        parcelAmount,
        to,
        plotId
      );
      const receipt = await tx.wait();

      // Parse events to get request ID
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === "TransferRequestCreated") {
            requestId = parsed.args.requestId.toString();
            break;
          }
        } catch (e) {
          // Skip unparseable logs
        }
      }

      // Save request to database
      try {
        console.log("Checking if request table exists...");
        const tableExists = await checkRequestTableExists();

        if (!tableExists) {
          console.log("Request table does not exist. Syncing...");
          await syncRequestsWithBlockchain();
        }

        await insertRequest({
          request_id: parseInt(requestId),
          plot_id: parseInt(plotId),
          is_plot: false,
          land_authority: false,
          lawyer: false,
          bank: false,
          current_status: "PENDING",
        });
        console.log(
          "Parcel transfer request inserted into database:",
          requestId
        );
      } catch (dbError) {
        console.error("Database error:", dbError.message);
      }

      return res.json({
        success: true,
        data: {
          requestId,
          transferType: "PARCEL_TRANSFER",
          blockName,
          parcelName,
          parcelId: parcelId.toString(),
          parcelAmount,
          plotName,
          plotId: plotId.toString(),
          to,
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          confirmedAt: new Date().toISOString(),
        },
        message: "Parcel transfer request created successfully using names",
      });
    }
  } catch (error) {
    console.error(
      "Error in /api/setter/request-transfer-using-names:",
      error.message
    );
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to create transfer request using names",
        details: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        endpoint: "/api/setter/request-transfer-using-names",
      },
    });
  }
});

router.post("/plot-initiate-using-names", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }

    const { plotName, land_info } = req.body;

    // Input validation
    if (!plotName || !Array.isArray(land_info) || land_info.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "plotName and land_info are required. land_info must be a non-empty array",
          details:
            "Please provide plotName (string) and land_info (array of {blockName, parcelName, amount}).",
          code: "INVALID_INPUT",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/plot-initiate-using-names",
        },
      });
    }

    // Validate land_info structure
    for (let i = 0; i < land_info.length; i++) {
      if (
        !land_info[i].blockName ||
        !land_info[i].parcelName ||
        !land_info[i].amount
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid land_info structure",
            details: `Each element in land_info must have 'blockName', 'parcelName', and 'amount'. Error at index ${i}`,
            code: "INVALID_LAND_INFO_STRUCTURE",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/plot-initiate-using-names",
          },
        });
      }
    }

    console.log("Fetching all land information from blockchain...");
    const landInfoJson = await getAllLandInfo();
    const landInfoData = JSON.parse(landInfoJson);

    if (!landInfoData.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch land information from blockchain",
          details: landInfoData.error,
          code: "BLOCKCHAIN_FETCH_ERROR",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/plot-initiate-using-names",
        },
      });
    }

    const landInfo = landInfoData.data;
    console.log("\nProcessing land info to find matching token IDs...");

    // Arrays to store matching tokenIds and amounts
    const matchingTokenIds = [];
    const parcelAmounts = [];
    const notFoundLands = [];

    // Loop through each land info entry and find matching tokenIds
    land_info.forEach((landEntry, entryIndex) => {
      const blockName = landEntry.blockName;
      const parcelName = landEntry.parcelName;
      const amount = landEntry.amount;

      console.log(
        `[${entryIndex + 1}] Searching for: ${blockName} - ${parcelName}`
      );

      // Find matching tokenId
      let found = false;
      for (let i = 0; i < landInfo.length; i++) {
        // Extract the land data from the nested structure
        const landKey = Object.keys(landInfo[i])[0]; // "Land 1", "Land 2", etc.
        const land = landInfo[i][landKey];

        if (land.blockInfo === blockName && land.parcelInfo === parcelName) {
          matchingTokenIds.push(i + 1); // TokenId is index + 1
          parcelAmounts.push(amount); // Add corresponding amount
          console.log(`Found tokenId: ${i + 1}`);
          found = true;
          break;
        }
      }

      if (!found) {
        notFoundLands.push({ blockName, parcelName, amount });
        console.log(`NOT FOUND: ${blockName} - ${parcelName}`);
      }
    });

    // If any lands were not found, return error
    if (notFoundLands.length > 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Some land names were not found on blockchain",
          details: `Could not find token IDs for ${notFoundLands.length} land(s)`,
          notFoundLands,
          code: "LAND_NOT_FOUND",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/plot-initiate-using-names",
        },
      });
    }

    console.log("\n=== FOUND TOKEN IDs ===");
    console.log(matchingTokenIds);

    // Check if plot name already exists
    try {
      console.log("Checking if plots table exists...");
      const tableExists = await checkPlotTableExists();

      if (tableExists) {
        console.log("Plots table exists");
      } else {
        console.log("Plots table does not exist");
        console.log("Syncing plots data with blockchain...");
        await syncPlotsWithBlockchain();
      }

      const plotExists = await checkPlotNameExists(plotName);
      if (plotExists) {
        return res.status(409).json({
          success: false,
          error: {
            message: "Plot name already exists",
            details: `A plot with the name '${plotName}' already exists. Please choose a different name.`,
            code: "PLOT_NAME_EXISTS",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/plot-initiate-using-names",
          },
        });
      }
    } catch (checkError) {
      console.error("Error checking plot name existence:", checkError.message);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to validate plot name",
          details: checkError.message,
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/plot-initiate-using-names",
        },
      });
    }

    // Get current plot ID before transaction
    let beforePlotId = (await contract.getCurrentPlotAndTokenIdInfo())[0];
    console.log("beforePlotId", beforePlotId);

    // Execute contract transaction with the found token IDs
    const tx = await contract.plotInitiate(
      plotName,
      matchingTokenIds,
      parcelAmounts
    );

    // Get signer's address from the transaction
    const callerAddress = tx.from;
    const receipt = await tx.wait();

    let plotId = Number(beforePlotId) + 1;
    console.log("new plotId", plotId);

    // Save plot data to database
    console.log("Caller Address:", callerAddress);
    try {
      const plotData = {
        plot_id: plotId,
        plot_name: plotName,
        current_holder: callerAddress,
        list_of_parcels: matchingTokenIds,
        amount: parcelAmounts,
      };

      // Validate data fields before insertion
      const requiredFields = [
        "plot_id",
        "plot_name",
        "current_holder",
        "list_of_parcels",
        "amount",
      ];
      const missingFields = requiredFields.filter(
        (field) => !plotData.hasOwnProperty(field)
      );
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      const insertedPlot = await insertPlot(plotData);

      if (!insertedPlot) {
        throw new Error("Failed to insert plot data into database");
      }

      res.json({
        success: true,
        data: {
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          plotId: plotId.toString(),
          plotName,
          land_info,
          matchingTokenIds,
          parcelAmounts,
          dbRecord: insertedPlot,
        },
        message:
          "Plot initiated using land names and saved to database successfully",
      });
    } catch (dbError) {
      console.error("Database plot insertion error:", dbError.message);
      // Still return success but with warning about DB
      res.status(207).json({
        success: true,
        warning: "Transaction successful but database update failed",
        data: {
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          plotId: plotId.toString(),
          plotName,
          land_info,
          matchingTokenIds,
          parcelAmounts,
          dbError: dbError.message,
        },
        message: "Plot initiated but database update failed",
      });
    }
  } catch (error) {
    console.error(
      "Error in /api/setter/plot-initiate-using-names:",
      error.message
    );
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to initiate plot using land names",
        details: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        endpoint: "/api/setter/plot-initiate-using-names",
      },
    });
  }
});

router.post("/plot-initiate", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }
    const { plotName, parcelIds, parcelAmounts } = req.body;

    // Input validation
    if (
      !plotName ||
      !Array.isArray(parcelIds) ||
      !Array.isArray(parcelAmounts) ||
      parcelIds.length !== parcelAmounts.length ||
      parcelIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "plotName, parcelIds and parcelAmounts are required. Arrays must be non-empty and of equal length",
          details:
            "Please provide plotName (string), parcelIds and parcelAmounts (arrays of equal length).",
          code: "INVALID_INPUT",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/plot-initiate",
        },
      });
    }

    // Check if plot name already exists
    try {
      console.log("Checking if plots table exists ...");
      const tableExists = await checkPlotTableExists();

      if (tableExists) {
        if (tableExists) {
          console.log(`Plots table exists`);
        }
      } else {
        console.log(`Plots table does not exist`);
        console.log("Syncing plots data with blockchain...");
        await syncPlotsWithBlockchain();
      }

      const plotExists = await checkPlotNameExists(plotName);
      if (plotExists) {
        return res.status(409).json({
          success: false,
          error: {
            message: "Plot name already exists",
            details: `A plot with the name '${plotName}' already exists. Please choose a different name.`,
            code: "PLOT_NAME_EXISTS",
            timestamp: new Date().toISOString(),
            endpoint: "/api/setter/plot-initiate",
          },
        });
      }
    } catch (checkError) {
      console.error("Error checking plot name existence:", checkError.message);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to validate plot name",
          details: checkError.message,
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/plot-initiate",
        },
      });
    }

    // Get current plot ID before transaction
    let beforePlotId = (await contract.getCurrentPlotAndTokenIdInfo())[0];
    console.log("beforePlotId", beforePlotId);

    // Execute contract transaction
    const tx = await contract.plotInitiate(plotName, parcelIds, parcelAmounts);

    // Get signer's address from the transaction
    const callerAddress = tx.from;
    const receipt = await tx.wait();

    let plotId = Number(beforePlotId) + 1;
    console.log("new plotId", plotId);

    // Sync with blockchain data first (only if table is empty), then save plot data to database
    console.log("Caller Address :", callerAddress);
    try {
      const plotData = {
        plot_id: plotId,
        plot_name: plotName,
        current_holder: callerAddress,
        list_of_parcels: parcelIds,
        amount: parcelAmounts,
      };

      // Validate data fields before insertion
      const requiredFields = [
        "plot_id",
        "plot_name",
        "current_holder",
        "list_of_parcels",
        "amount",
      ];
      const missingFields = requiredFields.filter(
        (field) => !plotData.hasOwnProperty(field)
      );
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      const insertedPlot = await insertPlot(plotData);

      if (!insertedPlot) {
        throw new Error("Failed to insert plot data into database");
      }

      res.json({
        success: true,
        data: {
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          plotId: plotId.toString(),
          plotName,
          parcelIds,
          parcelAmounts,
          dbRecord: insertedPlot,
        },
        message: "Plot initiated and saved to database successfully",
      });
    } catch (dbError) {
      console.error("Database plot insertion error:", dbError.message);
      // Still return success but with warning about DB
      res.status(207).json({
        success: true,
        warning: "Transaction successful but database update failed",
        data: {
          transaction: {
            hash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status,
          },
          plotId: plotId.toString(),
          plotName,
          parcelIds,
          parcelAmounts,
          dbError: dbError.message,
        },
        message: "Plot initiated but database update failed",
      });
    }
  } catch (error) {
    console.error("Error in /api/setter/plot-initiate:", error.message);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to initiate plot",
        details: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        endpoint: "/api/setter/plot-initiate",
      },
    });
  }
});

module.exports = router;
