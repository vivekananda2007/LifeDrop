export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Indian Cities & Administrative Boundaries API",
    version: "1.0.0",
    description:
      "A fast, open-access REST API providing structured JSON geodata for India derived from the official Local Government Directory (LGD). Includes 36 States & Union Territories, 784+ Districts, 7,000+ Sub-districts (Tehsils/Taluks), and 5,000+ Cities / Urban Local Bodies (Municipal Corporations, Municipalities, Town Panchayats).\n\nBuilt for developers, researchers, and public use.",
    contact: {
      name: "Kalyan Gupta",
      url: "https://github.com/kalyangupta12/indian-cities-data"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "/",
      description: "Default server (relative to host)"
    }
  ],
  tags: [
    { name: "States", description: "States and Union Territories of India" },
    { name: "Districts", description: "Districts within States & UTs" },
    { name: "Sub-districts", description: "Tehsils, Talukas, and Mandals" },
    { name: "Cities", description: "Urban Local Bodies (ULBs), Municipalities & Municipal Corporations" },
    { name: "Villages", description: "Revenue villages (if enabled)" },
    { name: "Global Search", description: "Cross-collection keyword search across all administrative levels" },
    { name: "System", description: "System status and dataset metadata" }
  ],
  paths: {
    "/api/states": {
      get: {
        tags: ["States"],
        summary: "List all States and Union Territories",
        description: "Returns paginated list of Indian States and Union Territories. Filter by code, type (S for State, U for Union Territory), or search by name.",
        parameters: [
          {
            name: "q",
            in: "query",
            description: "Case-insensitive name search query (e.g. 'assam', 'delhi')",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "code",
            in: "query",
            description: "Filter by exact state LGD code (e.g. '18')",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "type",
            in: "query",
            description: "Filter by type: 'S' for State, 'U' for Union Territory",
            required: false,
            schema: { type: "string", enum: ["S", "U"] }
          },
          {
            name: "page",
            in: "query",
            description: "Page number (defaults to 1)",
            required: false,
            schema: { type: "integer", default: 1 }
          },
          {
            name: "limit",
            in: "query",
            description: "Results per page (1 to 100, defaults to 25)",
            required: false,
            schema: { type: "integer", default: 25, maximum: 100 }
          }
        ],
        responses: {
          200: {
            description: "A paginated list of States and Union Territories",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StatesResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/districts": {
      get: {
        tags: ["Districts"],
        summary: "List all Districts",
        description: "Returns paginated list of Indian districts. Can be filtered by `stateCode` or searched with `q`.",
        parameters: [
          {
            name: "stateCode",
            in: "query",
            description: "Filter districts by parent State LGD code (e.g. '18' for Assam, '27' for Maharashtra)",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "code",
            in: "query",
            description: "Filter by specific District LGD code (e.g. '310')",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "q",
            in: "query",
            description: "Case-insensitive name search query",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "page",
            in: "query",
            description: "Page number",
            required: false,
            schema: { type: "integer", default: 1 }
          },
          {
            name: "limit",
            in: "query",
            description: "Results per page (1 to 100)",
            required: false,
            schema: { type: "integer", default: 25, maximum: 100 }
          }
        ],
        responses: {
          200: {
            description: "Paginated list of districts",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DistrictsResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/subdistricts": {
      get: {
        tags: ["Sub-districts"],
        summary: "List Sub-districts (Tehsils / Taluks / Mandals)",
        description: "Returns paginated list of Indian sub-districts (Tehsils, Talukas, Circles). Filter by `districtCode` or `stateCode`.",
        parameters: [
          {
            name: "districtCode",
            in: "query",
            description: "Filter by District LGD code (e.g. '310')",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "stateCode",
            in: "query",
            description: "Filter by State LGD code",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "code",
            in: "query",
            description: "Filter by Sub-district LGD code",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "q",
            in: "query",
            description: "Search sub-district by name",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "page",
            in: "query",
            description: "Page number",
            required: false,
            schema: { type: "integer", default: 1 }
          },
          {
            name: "limit",
            in: "query",
            description: "Results per page (1 to 100)",
            required: false,
            schema: { type: "integer", default: 25, maximum: 100 }
          }
        ],
        responses: {
          200: {
            description: "Paginated list of sub-districts",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SubdistrictsResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/cities": {
      get: {
        tags: ["Cities"],
        summary: "List Indian Cities and Urban Local Bodies",
        description: "Returns paginated list of Urban Local Bodies (Municipal Corporations, Municipalities, Town Panchayats). Filter by `stateCode`, `districtCode`, or search by city name `q`.",
        parameters: [
          {
            name: "q",
            in: "query",
            description: "City or town name query (e.g. 'moran', 'mumbai', 'pune')",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "stateCode",
            in: "query",
            description: "Filter by State LGD code",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "districtCode",
            in: "query",
            description: "Filter by District LGD code",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "code",
            in: "query",
            description: "Filter by City/ULB LGD code",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "page",
            in: "query",
            description: "Page number",
            required: false,
            schema: { type: "integer", default: 1 }
          },
          {
            name: "limit",
            in: "query",
            description: "Results per page (1 to 100)",
            required: false,
            schema: { type: "integer", default: 25, maximum: 100 }
          }
        ],
        responses: {
          200: {
            description: "Paginated list of cities and urban local bodies",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CitiesResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/villages": {
      get: {
        tags: ["Villages"],
        summary: "List Revenue Villages",
        description: "Returns paginated list of revenue villages if village dataset is enabled. Filter by `subdistrictCode`, `districtCode`, or `stateCode`.",
        parameters: [
          {
            name: "subdistrictCode",
            in: "query",
            description: "Filter by Sub-district LGD code",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "districtCode",
            in: "query",
            description: "Filter by District LGD code",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "stateCode",
            in: "query",
            description: "Filter by State LGD code",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "q",
            in: "query",
            description: "Search village by name",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "page",
            in: "query",
            description: "Page number",
            required: false,
            schema: { type: "integer", default: 1 }
          },
          {
            name: "limit",
            in: "query",
            description: "Results per page (1 to 100)",
            required: false,
            schema: { type: "integer", default: 25, maximum: 100 }
          }
        ],
        responses: {
          200: {
            description: "Paginated list of villages",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/VillagesResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/search": {
      get: {
        tags: ["Global Search"],
        summary: "Cross-administrative Global Search",
        description: "Searches across States, Districts, Sub-districts, Cities/ULBs, and Villages simultaneously. Requires at least 2 characters.",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search query keyword (minimum 2 characters, e.g. 'mumbai', 'moranhat', 'shimla')",
            schema: { type: "string", minLength: 2 }
          },
          {
            name: "limit",
            in: "query",
            description: "Maximum results per administrative collection (1 to 25, defaults to 10)",
            required: false,
            schema: { type: "integer", default: 10, maximum: 25 }
          }
        ],
        responses: {
          200: {
            description: "Search results aggregated by category",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SearchResponse"
                }
              }
            }
          },
          400: {
            description: "Invalid query (e.g. less than 2 characters)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/metadata": {
      get: {
        tags: ["System"],
        summary: "Dataset Metadata & Synchronization Info",
        description: "Returns details about the underlying dataset source, sync timestamp, and record counts per category.",
        responses: {
          200: {
            description: "Dataset metadata",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MetadataResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Service Health Check",
        description: "Returns operational health status and last data synchronization timestamp.",
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 25 },
          total: { type: "integer", example: 36 },
          pages: { type: "integer", example: 2 }
        }
      },
      State: {
        type: "object",
        properties: {
          code: { type: "string", example: "18" },
          name: { type: "string", example: "Assam" },
          localName: { type: "string", example: "অসম" },
          type: { type: "string", example: "S", description: "S = State, U = Union Territory" }
        }
      },
      StatesResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/State" }
          },
          pagination: { $ref: "#/components/schemas/Pagination" }
        }
      },
      District: {
        type: "object",
        properties: {
          code: { type: "string", example: "310" },
          name: { type: "string", example: "Dibrugarh" },
          stateCode: { type: "string", example: "18" },
          stateName: { type: "string", example: "Assam" }
        }
      },
      DistrictsResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/District" }
          },
          pagination: { $ref: "#/components/schemas/Pagination" }
        }
      },
      Subdistrict: {
        type: "object",
        properties: {
          code: { type: "string", example: "2134" },
          name: { type: "string", example: "Moran" },
          districtCode: { type: "string", example: "310" },
          districtName: { type: "string", example: "Dibrugarh" },
          stateCode: { type: "string", example: "18" },
          stateName: { type: "string", example: "Assam" }
        }
      },
      SubdistrictsResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Subdistrict" }
          },
          pagination: { $ref: "#/components/schemas/Pagination" }
        }
      },
      City: {
        type: "object",
        properties: {
          code: { type: "string", example: "250431" },
          name: { type: "string", example: "Moran Town" },
          typeCode: { type: "string", example: "5" },
          type: { type: "string", nullable: true, example: "Town Committee" },
          districtCode: { type: "string", nullable: true, example: "310" },
          districtName: { type: "string", nullable: true, example: "Dibrugarh" },
          stateCode: { type: "string", example: "18" },
          stateName: { type: "string", example: "Assam" }
        }
      },
      CitiesResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/City" }
          },
          pagination: { $ref: "#/components/schemas/Pagination" }
        }
      },
      Village: {
        type: "object",
        properties: {
          code: { type: "string", example: "291032" },
          name: { type: "string", example: "Sample Village" },
          subdistrictCode: { type: "string", example: "2134" },
          subdistrictName: { type: "string", example: "Moran" },
          districtCode: { type: "string", example: "310" },
          districtName: { type: "string", example: "Dibrugarh" },
          stateCode: { type: "string", example: "18" },
          stateName: { type: "string", example: "Assam" }
        }
      },
      VillagesResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Village" }
          },
          pagination: { $ref: "#/components/schemas/Pagination" }
        }
      },
      SearchResponse: {
        type: "object",
        properties: {
          query: { type: "string", example: "moranhat" },
          data: {
            type: "object",
            properties: {
              states: { type: "array", items: { $ref: "#/components/schemas/State" } },
              districts: { type: "array", items: { $ref: "#/components/schemas/District" } },
              subdistricts: { type: "array", items: { $ref: "#/components/schemas/Subdistrict" } },
              urban_local_bodies: { type: "array", items: { $ref: "#/components/schemas/City" } },
              villages: { type: "array", items: { $ref: "#/components/schemas/Village" } }
            }
          }
        }
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          syncedAt: { type: "string", format: "date-time", example: "2026-09-23T17:27:33.087Z" }
        }
      },
      MetadataResponse: {
        type: "object",
        properties: {
          source: { type: "string", example: "Local Government Directory-derived public archives" },
          archiveRepository: { type: "string", example: "https://github.com/ramSeraph/opendata/releases" },
          syncedAt: { type: "string", format: "date-time" },
          components: {
            type: "object"
          }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "q must contain at least 2 characters" }
        }
      }
    }
  }
};
