const { initializeContract, getContract } = require("./contractInstance");

// Custom JSON replacer to handle BigInt values
function bigIntReplacer(key, value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

// Get contract instance
async function getContractInstance() {
  let contract;
  try {
    contract = getContract();
  } catch (error) {
    await initializeContract();
    contract = getContract();
  }
  return contract;
}

// Fetch all land information
async function getAllLandInfo() {
  try {
    const contract = await getContractInstance();
    const allLandInfo = await contract.getAllLandInfo();

    const formattedLandInfo = allLandInfo.map((land, index) => {
      const landData = {
        blockInfo: land.blockInfo,
        parcelInfo: land.parcelInfo,
        blockParcelTokenURI: land.blockParcelTokenURI,
        totalSupply: land.totalSupply.toString(),
        plotAllocation: land.plotAllocation.map((id) => id.toString()),
      };
      return {
        [`Land ${index + 1}`]: landData,
      };
    });

    return JSON.stringify(
      {
        success: true,
        data: formattedLandInfo,
        message: "Land information retrieved successfully",
      },
      bigIntReplacer,
      2
    );
  } catch (error) {
    return JSON.stringify(
      {
        success: false,
        error: error.message,
        message: "Failed to fetch land information",
      },
      bigIntReplacer,
      2
    );
  }
}

// Fetch all plot account information
async function getAllPlotAccountInfo() {
  try {
    const contract = await getContractInstance();
    const allPlotAccountInfo = await contract.getAllPlotAccountInfo();

    const formattedPlotInfo = allPlotAccountInfo.map((plot, index) => {
      const plotData = {
        plotAccount: plot.plotAccount,
        plotOwner: plot.plotOwner,
        plotName: plot.plotName,
        parcelIds: plot.parcelIds.map((id) => id.toString()),
        parcelAmounts: plot.parcelAmounts.map((amount) => amount.toString()),
      };
      return {
        [`Plot ${index + 1}`]: plotData,
      };
    });

    return JSON.stringify(
      {
        success: true,
        data: formattedPlotInfo,
        message: "Plot account information retrieved successfully",
      },
      bigIntReplacer,
      2
    );
  } catch (error) {
    return JSON.stringify(
      {
        success: false,
        error: error.message,
        message: "Failed to fetch plot account information",
      },
      bigIntReplacer,
      2
    );
  }
}

// Fetch all transfer request information
async function getAllTransferRequestInfo() {
  try {
    const contract = await getContractInstance();
    const allTransferRequestInfo = await contract.getAllTransferRequestInfo();

    const formattedRequestInfo = allTransferRequestInfo.map(
      (request, index) => {
        const requestData = {
          from: request.from,
          to: request.to,
          parcelId: request.parcelId.toString(),
          parcelAmount: request.parcelAmount.toString(),
          isPlotTransfer: request.isPlotTransfer,
          plotId: request.plotId.toString(),
          timestamp: request.timestamp.toString(),
          status: request.status,
          landAuthorityApproved: request.landAuthorityApproved,
          lawyerApproved: request.lawyerApproved,
          bankApproved: request.bankApproved,
        };
        return {
          [`Transfer Request ${index + 1}`]: requestData,
        };
      }
    );

    return JSON.stringify(
      {
        success: true,
        data: formattedRequestInfo,
        message: "Transfer request information retrieved successfully",
      },
      bigIntReplacer,
      2
    );
  } catch (error) {
    return JSON.stringify(
      {
        success: false,
        error: error.message,
        message: "Failed to fetch transfer request information",
      },
      bigIntReplacer,
      2
    );
  }
}

// Fetch individual request status (only approval fields in boolean format)
async function getRequestStatus(requestId) {
  try {
    const contract = await getContractInstance();
    const requestStatus = await contract.requestStatus(requestId);

    const requestData = {
      landAuthorityApproved: Boolean(requestStatus.landAuthorityApproved),
      lawyerApproved: Boolean(requestStatus.lawyerApproved),
      bankApproved: Boolean(requestStatus.bankApproved),
    };

    return JSON.stringify(
      {
        success: true,
        data: requestData,
        message: "Request status retrieved successfully",
      },
      bigIntReplacer,
      2
    );
  } catch (error) {
    return JSON.stringify(
      {
        success: false,
        error: error.message,
        message: "Failed to fetch request status",
      },
      bigIntReplacer,
      2
    );
  }
}

// Fetch plot owner information
async function getPlotOwner(plotId) {
  try {
    const contract = await getContractInstance();
    const plotInfo = await contract.getPlotAccountInfo(plotId);

    const plotData = {
      plotOwner: plotInfo.plotOwner,
    };

    return JSON.stringify(
      {
        success: true,
        data: plotData,
        message: "Plot owner information retrieved successfully",
      },
      bigIntReplacer,
      2
    );
  } catch (error) {
    return JSON.stringify(
      {
        success: false,
        error: error.message,
        message: "Failed to fetch plot owner information",
      },
      bigIntReplacer,
      2
    );
  }
}

// Fetch all information (combined function)
async function getAllInfo() {
  try {
    console.log("Fetching all land information...");
    const landInfoJson = await getAllLandInfo();
    const landInfo = JSON.parse(landInfoJson);
    if (landInfo.success) {
      console.log("All Land Info:");
      landInfo.data.forEach((land) => {
        console.log(JSON.stringify(land, bigIntReplacer, 2));
      });
      console.log("\n");
    } else {
      console.error("Error fetching land info:", landInfo.error);
    }

    console.log("Fetching all plot account information...");
    const plotInfoJson = await getAllPlotAccountInfo();
    const plotInfo = JSON.parse(plotInfoJson);
    if (plotInfo.success) {
      console.log("All Plot Account Info:");
      plotInfo.data.forEach((plot) => {
        console.log(JSON.stringify(plot, bigIntReplacer, 2));
      });
      console.log("\n");
    } else {
      console.error("Error fetching plot info:", plotInfo.error);
    }

    console.log("Fetching all transfer request information...");
    const requestInfoJson = await getAllTransferRequestInfo();
    const requestInfo = JSON.parse(requestInfoJson);
    if (requestInfo.success) {
      console.log("All Transfer Request Info:");
      requestInfo.data.forEach((request) => {
        console.log(JSON.stringify(request, bigIntReplacer, 2));
      });
    } else {
      console.error("Error fetching request info:", requestInfo.error);
    }

    console.log("\n Successfully fetched all information!");

    return requestInfo;
  } catch (error) {
    console.error("Error fetching data:");
    console.error(error.message);
  }
}

// Export functions
module.exports = {
  getAllLandInfo,
  getAllPlotAccountInfo,
  getAllTransferRequestInfo,
  getRequestStatus,
  getPlotOwner,
};

// Run the main function if this file is executed directly
if (require.main === module) {
  getAllInfo()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
