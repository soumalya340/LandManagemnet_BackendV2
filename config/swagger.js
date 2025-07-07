const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Land Management API",
      version: "1.0.0",
      description: `A comprehensive blockchain-based API for managing land tokenization, plot transfers, and smart contract operations.`,
      contact: {
        name: "Land Management API Support",
        email: "support@landmanagement.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server",
      },
      {
        url: "https://api.landmanagement.com",
        description: "Production server (if deployed)",
      },
    ],
    tags: [
      {
        name: "Treasury",
        description: "Treasury wallet operations",
      },
      {
        name: "Land",
        description: "Land token information and management",
      },
      {
        name: "Plot",
        description: "Plot account operations and shareholder management",
      },
      {
        name: "Transfer",
        description: "Transfer requests and approvals",
      },
      {
        name: "Admin",
        description: "Administrative functions (contract management)",
      },
      {
        name: "Token",
        description: "Token creation and URI management",
      },
    ],
    components: {
      parameters: {
        PlotId: {
          name: "plotId",
          in: "path",
          required: true,
          description: "The ID of the plot",
          schema: {
            type: "integer",
            minimum: 1,
            example: 1,
          },
        },
        EthereumAddressParam: {
          name: "userAddress",
          in: "path",
          required: true,
          description: "The Ethereum address of the user",
          schema: {
            $ref: "#/components/schemas/EthereumAddress",
          },
        },
        TokenId: {
          name: "tokenId",
          in: "path",
          required: true,
          description: "The ID of the token",
          schema: {
            type: "integer",
            minimum: 1,
            example: 1,
          },
        },
      },
      schemas: {
        EthereumAddress: {
          type: "string",
          pattern: "^0x[a-fA-F0-9]{40}$",
          example: "0x742d35Cc6634C0532925a3b8D2DE0f87b7b82fd0",
          description: "A valid Ethereum address",
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "Operation failed",
                },
                details: {
                  type: "string",
                  example: "Detailed error description",
                },
                code: {
                  type: "string",
                  example: "CALL_EXCEPTION",
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
                endpoint: {
                  type: "string",
                  example: "/api/endpoint",
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js", "./index.js"], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
