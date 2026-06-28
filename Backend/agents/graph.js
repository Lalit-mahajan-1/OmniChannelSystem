const { StateGraph } = require("@langchain/langgraph");
const AgentState = require("./state");

// Import agent nodes
const intentAgent = require("./nodes/intentAgent");
const sentimentAgent = require("./nodes/sentimentAgent");
const contextAgent = require("./nodes/contextAgent");
const knowledgeAgent = require("./nodes/knowledgeAgent");
const complianceAgent = require("./nodes/complianceAgent");
const responseAgent = require("./nodes/responseAgent");
const reviewAgent = require("./nodes/reviewAgent");

/**
 * Create the LangGraph agent workflow
 */
function createAgentGraph() {
  const graph = new StateGraph({
    stateSchema: AgentState,
  });

  // Add nodes
  graph.addNode("intent", intentAgent);
  graph.addNode("sentiment", sentimentAgent);
  graph.addNode("context", contextAgent);
  graph.addNode("knowledge", knowledgeAgent);
  graph.addNode("compliance", complianceAgent);
  graph.addNode("response", responseAgent);
  graph.addNode("review", reviewAgent);

  // Define edges
  // START -> intent
  graph.setEntryPoint("intent");

  // intent -> sentiment (always)
  graph.addEdge("intent", "sentiment");

  // sentiment -> [context, knowledge] (parallel)
  graph.addConditionalEdges(
    "sentiment",
    (state) => {
      // Always route to both context and knowledge in parallel
      return ["context", "knowledge"];
    },
    {
      context: "context",
      knowledge: "knowledge",
    }
  );

  // [context, knowledge] -> compliance (join)
  graph.addEdge("context", "compliance");
  graph.addEdge("knowledge", "compliance");

  // compliance -> response (if clear or warning) or END (if blocked)
  graph.addConditionalEdges(
    "compliance",
    (state) => {
      if (state.complianceStatus === "blocked") {
        return "blocked";
      }
      return "response";
    },
    {
      blocked: "__end__",
      response: "response",
    }
  );

  // response -> review
  graph.addEdge("response", "review");

  // review -> response (retry if confidence < 0.7) or END (if confidence >= 0.7)
  graph.addConditionalEdges(
    "review",
    (state) => {
      if (state.confidenceScore < 0.7) {
        // Check retry count (max 2 retries)
        const retryCount = state.agentTrace.filter(
          (t) => t.agentName === "response"
        ).length;
        if (retryCount < 2) {
          return "retry";
        }
      }
      return "end";
    },
    {
      retry: "response",
      end: "__end__",
    }
  );

  return graph.compile();
}

module.exports = { createAgentGraph };
