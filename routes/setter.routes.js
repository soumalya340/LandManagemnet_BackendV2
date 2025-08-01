const express = require("express");
const {
  initializeContract,
  getContract,
} = require("../utils/contractInstance");

const router = express.Router();

/**
 * @swagger
 * /api/setter/create-token:
 *   post:
 *     summary: Create Block Parcel Token
 *     description: Creates a new land token with block and parcel information
 *     tags: [Token]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blockInfo
 *               - parcelInfo
 *               - tokenURI
 *               - totalSupply
 *             properties:
 *               blockInfo:
 *                 type: string
 *                 description: Information about the block
 *                 example: "Block A1"
 *               parcelInfo:
 *                 type: string
 *                 description: Information about the parcel
 *                 example: "Parcel P1"
 *               tokenURI:
 *                 type: string
 *                 description: URI pointing to token metadata
 *                 example: "https://example.com/token/metadata/1"
 *               totalSupply:
 *                 type: string
 *                 description: Total supply of the token
 *                 example: "1000"
 *           example:
 *             blockInfo: "Block A1"
 *             parcelInfo: "Parcel P1"
 *             tokenURI: "https://example.com/token/metadata/1"
 *             totalSupply: "1000"
 *     responses:
 *       200:
 *         description: Block parcel token created successfully
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
 *                     tokenURI:
 *                       type: string
 *                       example: "https://example.com/token/metadata/1"
 *                     totalSupply:
 *                       type: string
 *                       example: "1000"
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         hash:
 *                           type: string
 *                           example: "0x1234567890abcdef1234567890abcdef12345678"
 *                         from:
 *                           type: string
 *                           example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                         to:
 *                           type: string
 *                           example: "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
 *                         gasUsed:
 *                           type: string
 *                           example: "21000"
 *                         status:
 *                           type: number
 *                           example: 1
 *                     confirmedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Block parcel token created successfully"
 *       400:
 *         description: Bad request - missing required fields
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
 *                       example: "/api/setter/endpoint"
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
 *                       example: "/api/setter/endpoint"
 */
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

/**
 * @swagger
 * /api/setter/request-plot-transfer:
 *   post:
 *     summary: Request Whole Plot Transfer
 *     description: Creates a request to transfer an entire plot from one address to another
 *     tags: [Transfer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plotId
 *               - to
 *             properties:
 *               plotId:
 *                 type: string
 *                 description: The ID of the plot to transfer
 *                 example: "1"
 *               to:
 *                 type: string
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *                 example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                 description: The recipient address for the plot transfer
 *           example:
 *             plotId: "1"
 *             to: "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
 *     responses:
 *       200:
 *         description: Plot transfer request created successfully
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
 *                     plotId:
 *                       type: string
 *                       example: "1"
 *                     to:
 *                       type: string
 *                       pattern: "^0x[a-fA-F0-9]{40}$"
 *                       example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         hash:
 *                           type: string
 *                           example: "0x1234567890abcdef1234567890abcdef12345678"
 *                         from:
 *                           type: string
 *                           example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                         to:
 *                           type: string
 *                           example: "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
 *                         gasUsed:
 *                           type: string
 *                           example: "21000"
 *                         status:
 *                           type: number
 *                           example: 1
 *                     confirmedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Plot transfer request created successfully"
 *       400:
 *         description: Bad request - invalid input
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
 *                       example: "/api/setter/endpoint"
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
 *                       example: "/api/setter/endpoint"
 */
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

/**
 * @swagger
 * /api/setter/request-parcel-transfer:
 *   post:
 *     summary: Request Parcel Transfer
 *     description: Creates a request to transfer a parcel (or parcels) from one address to another.
 *     tags: [Transfer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _parcelId
 *               - parcelAmount
 *               - to
 *               - _plotId
 *             properties:
 *               _parcelId:
 *                 type: integer
 *                 description: The ID of the parcel to transfer
 *                 example: 101
 *               parcelAmount:
 *                 type: integer
 *                 description: The amount of the parcel to transfer
 *                 example: 1000
 *               to:
 *                 type: string
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *                 example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                 description: The recipient address for the parcel transfer
 *               _plotId:
 *                 type: integer
 *                 description: The plot ID associated with the parcel
 *                 example: 1
 *           example:
 *             _parcelId: 101
 *             parcelAmount: 1000
 *             to: "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
 *             _plotId: 1
 *     responses:
 *       200:
 *         description: Parcel transfer request created successfully
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
 *                     _parcelId:
 *                       type: integer
 *                       example: 101
 *                     parcelAmount:
 *                       type: integer
 *                       example: 1000
 *                     to:
 *                       type: string
 *                       pattern: "^0x[a-fA-F0-9]{40}$"
 *                       example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                     _plotId:
 *                       type: integer
 *                       example: 1
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         hash:
 *                           type: string
 *                           example: "0x1234567890abcdef1234567890abcdef12345678"
 *                         gasUsed:
 *                           type: string
 *                           example: "21000"
 *                         status:
 *                           type: number
 *                           example: 1
 *                     confirmedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Parcel transfer request created successfully"
 *       400:
 *         description: Bad request - invalid input
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
 *                       example: "/api/setter/request-parcel-transfer"
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
 *                       example: "/api/setter/request-parcel-transfer"
 */
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

/**
 * @swagger
 * /api/setter/approve-transfer-execution:
 *   post:
 *     summary: Delegate Approve Transfer Execution
 *     description: |
 *       Approves and executes a transfer request by a delegated authority (Land Authority, Bank, or Lawyer).
 *       Each role has specific approval rights in the transfer process.
 *     tags: [Transfer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signerWallet
 *               - requestId
 *               - role
 *             properties:
 *               signerWallet:
 *                 type: string
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *                 example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                 description: The wallet address of the approving authority
 *               requestId:
 *                 type: string
 *                 description: The ID of the transfer request to approve
 *                 example: "1"
 *               role:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: |
 *                   The role of the approving authority:
 *                   - 1: Land Authority
 *                   - 2: Bank
 *                   - 3: Lawyer
 *                 example: 1
 *           example:
 *             signerWallet: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *             requestId: "1"
 *             role: 1
 *     responses:
 *       200:
 *         description: Transfer request approved successfully
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
 *                     signerWallet:
 *                       type: string
 *                       pattern: "^0x[a-fA-F0-9]{40}$"
 *                       example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                     role:
 *                       type: integer
 *                       example: 1
 *                     roleName:
 *                       type: string
 *                       example: "Land Authority"
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         hash:
 *                           type: string
 *                           example: "0x1234567890abcdef1234567890abcdef12345678"
 *                         from:
 *                           type: string
 *                           example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0"
 *                         to:
 *                           type: string
 *                           example: "0x1B8683e1885B3ee93524cD58BC10Cf3Ed6af4298"
 *                         gasUsed:
 *                           type: string
 *                           example: "21000"
 *                         status:
 *                           type: number
 *                           example: 1
 *                     confirmedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Transfer request approved successfully by Land Authority"
 *       400:
 *         description: Bad request - invalid input or role
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
 *                       example: "/api/setter/endpoint"
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
 *                       example: "/api/setter/endpoint"
 */
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
    // approve and execute
    const tx = await contract.delegateApproveAndTransfer(
      signerWalletLower,
      requestId,
      role
    );
    const receipt = await tx.wait();

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

/**
 * @swagger
 * /api/setter/plot-initiate:
 *   post:
 *     summary: Initiate a new Plot
 *     description: Initiates a new plot with the given parcel IDs and parcel amounts.
 *     tags: [Plot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parcelIds
 *               - parcelAmounts
 *             properties:
 *               parcelIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [101, 102, 103]
 *                 description: Array of parcel IDs
 *               parcelAmounts:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1000, 800, 1200]
 *                 description: Array of parcel amounts (must match parcelIds length)
 *           example:
 *             parcelIds: [101, 102, 103]
 *             parcelAmounts: [1000, 800, 1200]
 *     responses:
 *       200:
 *         description: Plot initiated successfully
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
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         hash:
 *                           type: string
 *                           example: "0x1234567890abcdef1234567890abcdef12345678"
 *                         gasUsed:
 *                           type: string
 *                           example: "21000"
 *                         status:
 *                           type: number
 *                           example: 1
 *                     plotId:
 *                       type: string
 *                       example: "1"
 *                 message:
 *                   type: string
 *                   example: "Plot initiated successfully"
 *       400:
 *         description: Bad request - invalid input
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
 *                       example: "/api/setter/plot-initiate"
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
 *                       example: "/api/setter/plot-initiate"
 */
router.post("/plot-initiate", async (req, res) => {
  try {
    let contract;
    try {
      contract = getContract();
    } catch (error) {
      await initializeContract();
      contract = getContract();
    }
    const { parcelIds, parcelAmounts } = req.body;
    if (
      !Array.isArray(parcelIds) ||
      !Array.isArray(parcelAmounts) ||
      parcelIds.length !== parcelAmounts.length ||
      parcelIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "parcelIds and parcelAmounts must be non-empty arrays of equal length",
          details: "Both arrays are required and must have the same length.",
          code: "INVALID_INPUT",
          timestamp: new Date().toISOString(),
          endpoint: "/api/setter/plot-initiate",
        },
      });
    }
    let beforePlotId = (await contract.getCurrentPlotAndTokenIdInfo())[0];
    console.log("beforePlotId", beforePlotId);
    const tx = await contract.plotInitiate(parcelIds, parcelAmounts);
    const receipt = await tx.wait();

    let afterPlotId = Number(beforePlotId) + 1;
    console.log("afterPlotId", afterPlotId);

    res.json({
      success: true,
      data: {
        transaction: {
          hash: tx.hash,
          gasUsed: receipt.gasUsed?.toString(),
          status: receipt.status,
        },
        plotId: afterPlotId.toString(),
        parcelIds,
        parcelAmounts,
      },
      message: "Plot initiated successfully",
    });
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
